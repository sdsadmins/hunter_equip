import React from "react";
import "./CraneTable.css";

export default function CraneTable({ cranes, filter, onEdit, onRefresh, onDelete, onEmailAlert, itemsPerPage, setItemsPerPage, setCurrentPage }) {
  const [inputValue, setInputValue] = React.useState(itemsPerPage.toString());

  // Sync input value when itemsPerPage changes
  React.useEffect(() => {
    setInputValue(itemsPerPage.toString());
  }, [itemsPerPage]);

  // Helper function to convert Excel date serial numbers
  const convertExcelDate = (dateValue) => {
    if (!dateValue) return "";

    // If it's already a string
    if (typeof dateValue === 'string') {
      // Excel serial as string
      if (/^\d{5,}$/.test(dateValue)) {
        try {
          const d = new Date((parseInt(dateValue, 10) - 25569) * 86400 * 1000);
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const yyyy = d.getFullYear();
          return `${mm}/${dd}/${yyyy}`;
        } catch {
          return dateValue;
        }
      }
      // If looks like DD/MM/YYYY or MM/DD/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
        const [p1, p2, y] = dateValue.split('/');
        const a = parseInt(p1, 10);
        const b = parseInt(p2, 10);
        if (a > 12 && b <= 12) {
          // DD/MM/YYYY -> MM/DD/YYYY
          return `${p2.padStart(2, '0')}/${p1.padStart(2, '0')}/${y}`;
        }
        return `${p1}/${p2}/${y}`;
      }
      return dateValue; // other strings
    }

    // If it's a number (Excel serial)
    if (typeof dateValue === 'number' && dateValue > 1000) {
      try {
        const d = new Date((dateValue - 25569) * 86400 * 1000);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
      } catch {
        return String(dateValue);
      }
    }

    // Fallback: best effort parse
    try {
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return String(dateValue);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    } catch {
      return String(dateValue);
    }
  };

  // Color expiration date (MM/DD/YYYY expected)
  const getExpirationColor = (expiration) => {
    if (!expiration) return "gray";
    try {
      const dateString = convertExcelDate(expiration);
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[0]) - 1; // 0-indexed
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        const expirationDate = new Date(year, month, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expirationDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return "red";      // expired
        if (diffDays <= 30) return "orange"; // within 1 month
        return "green";                      // more than 1 month
      }
      return "gray";
    } catch {
      return "gray";
    }
  };

  // Status based on expiration date (for "In Use" column)
  const getExpirationStatus = (expiration) => {
    if (!expiration) return { color: "gray", text: "Unknown", className: "status-unknown" };
    try {
      // Since backend now sends MM/DD/YYYY format, use it directly
      const dateString = expiration;
      // Parse MM/DD/YYYY format
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[0]) - 1; // Month is 0-indexed
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        const expirationDate = new Date(year, month, day);
        const today = new Date();
        
        // Set both dates to start of day for accurate comparison
        today.setHours(0, 0, 0, 0);
        expirationDate.setHours(0, 0, 0, 0);
        
        // Calculate days difference
        const diffTime = expirationDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          // Expired (past due) - Red
          return { color: "red", text: "Expired", className: "status-expired" };
        } else if (diffDays <= 30) {
          // Within 30 days - Yellow
          return { color: "orange", text: "Near to Expire", className: "status-near" };
        } else {
          // More than 30 days - Green
          return { color: "green", text: "OK", className: "status-ok" };
        }
      }
      return { color: "gray", text: "Unknown", className: "status-unknown" }; // Invalid format
    } catch (error) {
      return { color: "gray", text: "Unknown", className: "status-unknown" }; // if date parsing fails, show gray
    }
  };

  // Sorting logic
  let sorted = [...cranes];
  
  if (filter === "unit") sorted.sort((a, b) => (a["Unit #"] || "").localeCompare(b["Unit #"] || ""));
  if (filter === "expiration") {
    sorted.sort((a, b) => {
      try {
        return new Date(a["Expiration"] || 0) - new Date(b["Expiration"] || 0);
      } catch (error) {
        return 0; // if date parsing fails, maintain original order
      }
    });
  }
  if (filter === "active") sorted.sort((a, b) => (b.active === true) - (a.active === true));



  return (
    <table className="crane-table">
      <thead>
        <tr>
          <th>Unit #</th>
          <th>Year</th>
          <th>Make & Model</th>
          <th>Ton</th>
          <th>Serial #</th>
          <th>Expiration</th>
          <th>In Use</th>
          <th>Active</th>
          <th className="actions-header">
            <div className="actions-header-content">
              <span>Actions</span>
              <div className="page-size-header">
                <input
                  type="number"
                  min="1"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                  }}
                  onBlur={(e) => {
                    // When user leaves the field, validate and set value
                    const value = parseInt(e.target.value);
                    if (value && value >= 1) {
                      setItemsPerPage(value);
                      setCurrentPage(1);
                    } else {
                      // If empty or invalid, set back to 8
                      setItemsPerPage(8);
                      setCurrentPage(1);
                      setInputValue('8');
                    }
                  }}
                  onKeyPress={(e) => {
                    // Accept change when user presses Enter
                    if (e.key === 'Enter') {
                      const value = parseInt(e.target.value);
                      if (value && value >= 1) {
                        setItemsPerPage(value);
                        setCurrentPage(1);
                      } else {
                        // If empty or invalid, set back to 8
                        setItemsPerPage(8);
                        setCurrentPage(1);
                        setInputValue('8');
                      }
                      e.target.blur(); // Remove focus
                    }
                  }}
                  className="page-size-header-input"
                  placeholder="8"
                  title="Enter number of cranes per page"
                />
                <span className="page-size-header-text">per page</span>
              </div>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((crane) => {
          return (
            <tr key={crane._id}>
                          <td>{crane["Unit #"]}</td>
            <td>{crane["Year"]}</td>
            <td>{crane["Make and Model"]}</td>
            <td>{crane["Ton"]}</td>
            <td>{crane["Serial #"]}</td>
            <td style={{ color: getExpirationColor(crane["Expiration"]) }}>
              {(() => {
                                 // Helper function to convert Excel date serial numbers
                 const convertExcelDate = (dateValue) => {
                   if (!dateValue) return "";
                   
                   // If it's already a string, check if it's a number string
                   if (typeof dateValue === 'string') {
                     // Check if it's a string number that looks like Excel date serial
                     if (/^\d{5,}$/.test(dateValue)) {
                       try {
                         const excelDate = new Date((parseInt(dateValue) - 25569) * 86400 * 1000);
                         const day = String(excelDate.getDate()).padStart(2, '0');
                         const month = String(excelDate.getMonth() + 1).padStart(2, '0');
                         const year = excelDate.getFullYear();
                         return `${month}/${day}/${year}`; // Format as MM/DD/YYYY
                       } catch (error) {
                         return dateValue; // Return original if conversion fails
                       }
                     }
                     return dateValue; // Return as is if it's not a number string
                   }
                   
                   // If it's a number and looks like an Excel date serial number
                   if (typeof dateValue === 'number' && dateValue > 1000) {
                     try {
                       const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
                       const day = String(excelDate.getDate()).padStart(2, '0');
                       const month = String(excelDate.getMonth() + 1).padStart(2, '0');
                       const year = excelDate.getFullYear();
                       return `${month}/${day}/${year}`; // Format as MM/DD/YYYY
                     } catch (error) {
                       return dateValue.toString(); // Fallback to string if conversion fails
                     }
                   }
                   
                   return dateValue.toString();
                 };
                
                return convertExcelDate(crane["Expiration"]);
              })()}
            </td>
                    <td className={getExpirationStatus(crane["Expiration"]).className}>
          {getExpirationStatus(crane["Expiration"]).text}
        </td>
            <td style={{
              color: crane.active ? "#10b981" : "#ef4444",
              fontWeight: "bold",
              textAlign: "center"
            }}>
              {crane.active ? "✅ Active" : "❌ Inactive"}
            </td>
            <td className="actions-cell">
              <button className="action-btn edit-btn" onClick={() => onEdit(crane)}>✏️ Edit</button>
              <button className="action-btn delete-btn" onClick={() => {
                console.log("Delete clicked for crane:", crane);
                console.log("Crane keys:", Object.keys(crane));
                console.log("Crane _id:", crane._id);
                console.log("Crane id:", crane.id);
                
                // Try different ID field names
                const craneId = crane._id || crane.id || crane.ID;
                if (!craneId) {
                  alert("Error: Crane ID not found. Available fields: " + Object.keys(crane).join(', '));
                  return;
                }
                onDelete(craneId);
              }}>🗑️ Delete</button>
              <button 
                className={`action-btn email-btn ${crane.alertEmail ? 'has-email' : 'no-email'}`}
                onClick={() => {
                  console.log("🔍 Email clicked for crane:", crane);
                  console.log("🔍 Crane keys:", Object.keys(crane));
                  console.log("🔍 Crane _id:", crane._id);
                  console.log("🔍 Crane id:", crane.id);
                  console.log("🔍 Crane alertEmail:", crane.alertEmail);
                  
                  // Try different ID field names
                  const craneId = crane._id || crane.id || crane.ID;
                  if (!craneId) {
                    alert("Error: Crane ID not found. Available fields: " + Object.keys(crane).join(', '));
                    return;
                  }
                  onEmailAlert(craneId, crane["Expiration"]);
                }}
                title={crane.alertEmail ? `Email configured: ${crane.alertEmail}` : "No email configured"}
              >
                {crane.alertEmail ? "📧 Email" : "📧 Add Email"}
              </button>
            </td>
          </tr>
        );
        })}
      </tbody>
    </table>
  );
}