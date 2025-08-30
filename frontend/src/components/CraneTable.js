import React from "react";
import "./CraneTable.css";

export default function CraneTable({ cranes, filter, onEdit, onRefresh, onDelete, onEmailAlert }) {

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
          return `${day}/${month}/${year}`; // Format as DD/MM/YYYY
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
        return `${day}/${month}/${year}`; // Format as DD/MM/YYYY
      } catch (error) {
        return dateValue.toString(); // Fallback to string if conversion fails
      }
    }
    
    return dateValue.toString();
  };

  // Color expiration date
  const getExpirationColor = (expiration) => {
    if (!expiration) return "gray";
    try {
      const convertedExpiration = convertExcelDate(expiration);
      // Parse DD/MM/YYYY format
      const parts = convertedExpiration.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const year = parseInt(parts[2]);
        const expirationDate = new Date(year, month, day);
        const today = new Date();
        
        if (expirationDate < today) {
          return "red"; // expired
        } else if (expirationDate.getTime() - today.getTime() <= 30 * 24 * 60 * 60 * 1000) {
          return "orange"; // within 1 month
        } else {
          return "green"; // more than 1 month
        }
      }
      return "gray"; // Invalid format
    } catch (error) {
      return "gray"; // if date parsing fails, show gray
    }
  };

  // Status based on expiration date (for "In Use" column)
  const getExpirationStatus = (expiration) => {
    if (!expiration) return { color: "gray", text: "Unknown", className: "status-unknown" };
    try {
      const convertedExpiration = convertExcelDate(expiration);
      // Parse DD/MM/YYYY format
      const parts = convertedExpiration.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const year = parseInt(parts[2]);
        const expirationDate = new Date(year, month, day);
        const today = new Date();
        
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
          <th>Actions</th>
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
                         return `${day}/${month}/${year}`; // Format as DD/MM/YYYY
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
                       return `${day}/${month}/${year}`; // Format as DD/MM/YYYY
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
              <button className="action-btn email-btn" onClick={() => {
                console.log("Email clicked for crane:", crane);
                console.log("Crane keys:", Object.keys(crane));
                console.log("Crane _id:", crane._id);
                console.log("Crane id:", crane.id);
                
                // Try different ID field names
                const craneId = crane._id || crane.id || crane.ID;
                if (!craneId) {
                  alert("Error: Crane ID not found. Available fields: " + Object.keys(crane).join(', '));
                  return;
                }
                onEmailAlert(craneId, crane["Expiration"]);
              }}>📧 Email</button>
            </td>
          </tr>
        );
        })}
      </tbody>
    </table>
  );
}