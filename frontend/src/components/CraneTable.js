import React from "react";
import dayjs from "dayjs";
import axios from "axios";
import config from "../config";
import "./CraneTable.css";

export default function CraneTable({ cranes, filter, onEdit, onRefresh }) {

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

  // Delete crane
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this crane?")) return;
    await axios.delete(`${config.API_URL}/api/cranes/${id}`);
    onRefresh();
  };

  // Send email alert
  const handleSendEmail = async (id, expiration) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in. Please log in again.");
      return;
    }

    // Calculate days until expiration
    let diffDays = 0;
    let expirationStatus = "";
    try {
      // Enhanced date conversion function
      const convertExcelDate = (dateValue) => {
        if (!dateValue) return null;
        
        console.log("Converting date value:", dateValue, "Type:", typeof dateValue);
        
        // If it's already a Date object
        if (dateValue instanceof Date) {
          return dateValue;
        }
        
        // If it's a string
        if (typeof dateValue === 'string') {
          // Check if it's a string number that looks like Excel date serial
          if (/^\d{5,}$/.test(dateValue)) {
            console.log("Converting Excel serial string:", dateValue);
            const excelDate = new Date((parseInt(dateValue) - 25569) * 86400 * 1000);
            console.log("Converted Excel date:", excelDate);
            return excelDate;
          }
          
          // Check if it's DD/MM/YYYY format
          if (dateValue.includes('/')) {
            const parts = dateValue.split('/');
            if (parts.length === 3) {
              console.log("Converting DD/MM/YYYY format:", dateValue);
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1; // Month is 0-indexed
              const year = parseInt(parts[2]);
              const date = new Date(year, month, day);
              console.log("Converted DD/MM/YYYY date:", date);
              return date;
            }
          }
          
          // Try parsing as regular date string
          const parsedDate = new Date(dateValue);
          if (!isNaN(parsedDate.getTime())) {
            console.log("Parsed as regular date:", parsedDate);
            return parsedDate;
          }
        }
        
        // If it's a number (Excel serial number)
        if (typeof dateValue === 'number' && dateValue > 1000) {
          console.log("Converting Excel serial number:", dateValue);
          const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
          console.log("Converted Excel number date:", excelDate);
          return excelDate;
        }
        
        console.log("Could not convert date value:", dateValue);
        return null;
      };

      const expirationDate = convertExcelDate(expiration);
      if (!expirationDate || isNaN(expirationDate.getTime())) {
        console.error("Invalid expiration date:", expiration);
        alert("Invalid expiration date. Cannot send email alert.");
        return;
      }

      const today = new Date();
      // Reset time to start of day for accurate calculation
      today.setHours(0, 0, 0, 0);
      expirationDate.setHours(0, 0, 0, 0);
      
      diffDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log("Date calculation:", {
        expiration: expiration,
        expirationDate: expirationDate,
        today: today,
        diffDays: diffDays
      });
      
      // Determine status based on current date
      if (diffDays < 0) {
        expirationStatus = "EXPIRED";
      } else if (diffDays <= 30) {
        expirationStatus = "NEAR TO EXPIRE";
      } else {
        expirationStatus = "OK";
      }
    } catch (error) {
      console.error("Date calculation error:", error);
      alert("Invalid date format. Cannot calculate expiration days.");
      return;
    }

    // Show appropriate message based on current status
    let alertMessage = "";
    if (expirationStatus === "EXPIRED") {
      alertMessage = `🚨 CRANE EXPIRED!\n\nThis crane expired ${Math.abs(diffDays)} days ago.\n\nSend urgent expired crane alert?`;
    } else if (expirationStatus === "NEAR TO EXPIRE") {
      alertMessage = `⚠️ CRANE EXPIRING SOON!\n\nThis crane will expire in ${diffDays} days.\n\nSend expiration warning alert?`;
    } else {
      alertMessage = `✅ CRANE STATUS: OK\n\nThis crane expires in ${diffDays} days (more than 30 days away).\n\nSend alert anyway?`;
    }

    const confirmSend = window.confirm(alertMessage);
    if (!confirmSend) return;

    const recipientEmail = prompt("Enter recipient email address:");
    if (!recipientEmail) {
      alert("No email entered. Email not sent.");
      return;
    }

    try {
      const res = await axios.post(
        `${config.API_URL}/api/cranes/${id}/send-alert`,
        { recipientEmail },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      // Show success message based on actual status
      let successMessage = "";
      if (expirationStatus === "EXPIRED") {
        successMessage = `🚨 URGENT: Expired crane alert sent to ${recipientEmail}`;
      } else if (expirationStatus === "NEAR TO EXPIRE") {
        successMessage = `⚠️ Warning: Expiration alert sent to ${recipientEmail}`;
      } else {
        successMessage = `✅ Info: Crane status alert sent to ${recipientEmail}`;
      }
      
      alert(successMessage);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to send email";
      const errorDetails = err.response?.data?.details || "";
      const errorCode = err.response?.data?.code || "";
      
      let fullErrorMessage = `❌ Email Error: ${errorMessage}`;
      
      if (errorCode === 'EAUTH') {
        fullErrorMessage += "\n\n🔧 Solution: Update your Gmail credentials in the .env file.";
        fullErrorMessage += "\n• Use Gmail App Password instead of regular password";
        fullErrorMessage += "\n• Enable 2-factor authentication on your Gmail account";
        fullErrorMessage += "\n• Generate an App Password for this application";
      } else if (errorDetails) {
        fullErrorMessage += `\n\nDetails: ${errorDetails}`;
      }
      
      alert(fullErrorMessage);
    }
  };



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
              <button className="action-btn delete-btn" onClick={() => handleDelete(crane._id)}>🗑️ Delete</button>
              <button className="action-btn email-btn" onClick={() => handleSendEmail(crane._id, crane["Expiration"])}>📧 Email</button>
            </td>
          </tr>
        );
        })}
      </tbody>
    </table>
  );
}