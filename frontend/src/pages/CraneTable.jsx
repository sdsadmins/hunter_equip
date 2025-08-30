// src/components/CraneTable.js
import React from "react";

export default function CraneTable({ cranes, onEdit, onDelete, onEmailAlert }) {
  return (
    <table
      border="1"
      cellPadding="5"
      cellSpacing="0"
      style={{
        width: "100%",
        borderCollapse: "collapse",
        backgroundColor: "#2b2b2b",
        color: "white"
      }}
    >
      <thead>
        <tr>
          <th style={{ fontWeight: "bold", color: "#ffcc00" }}>Unit #</th>
          <th style={{ fontWeight: "bold", color: "#ffcc00" }}>Year</th>
          <th style={{ fontWeight: "bold", color: "#ffcc00" }}>Make and Model</th>
          <th style={{ fontWeight: "bold", color: "#ffcc00" }}>Ton</th>
          <th style={{ fontWeight: "bold", color: "#ffcc00" }}>Serial #</th>
          <th style={{ fontWeight: "bold", color: "#ffcc00" }}>Expiration</th>
          <th style={{ fontWeight: "bold", color: "#ffcc00" }}>Currently In Use</th>
          <th style={{ fontWeight: "bold", color: "#ffcc00" }}>Status</th> {/* ✅ Added */}
          <th style={{ fontWeight: "bold", color: "#ffcc00" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {cranes.length === 0 ? (
          <tr>
            <td colSpan="9" style={{ textAlign: "center" }}>No cranes found</td>
          </tr>
        ) : (
          cranes.map((crane) => (
            <tr key={crane._id}>
              <td>{crane["Unit #"]}</td>
              <td>{crane["Year"]}</td>
              <td>{crane["Make and Model"]}</td>
              <td>{crane["Ton"]}</td>
              <td>{crane["Serial #"]}</td>
                             <td>
                 {(() => {
                                       // Helper function to convert Excel date serial numbers
                    const convertExcelDate = (dateValue) => {
                      if (!dateValue) return "N/A";
                      
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
                   
                   return convertExcelDate(crane.Expiration);
                 })()}
               </td>
              <td>{crane["Currently In Use"]}</td>
              <td
                style={{
                  color:
                    crane.status === "Expired"
                      ? "red"
                      : crane.status === "Near to Expire"
                      ? "orange"
                      : crane.status === "OK"
                      ? "lightgreen"
                      : "gray",
                  fontWeight: "bold"
                }}
              >
                {crane.status}
              </td>
              <td>
                <button onClick={() => onEdit(crane)}>Edit</button>
                <button onClick={() => {
                  console.log("Delete clicked for crane:", crane);
                  console.log("Crane ID:", crane._id);
                  if (!crane._id) {
                    alert("Error: Crane ID not found. Please refresh the page and try again.");
                    return;
                  }
                  onDelete(crane._id);
                }}>Delete</button>
                <button onClick={() => {
                  console.log("Email clicked for crane:", crane);
                  console.log("Crane ID:", crane._id);
                  if (!crane._id) {
                    alert("Error: Crane ID not found. Please refresh the page and try again.");
                    return;
                  }
                  onEmailAlert(crane._id, crane.Expiration);
                }}>Email</button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
