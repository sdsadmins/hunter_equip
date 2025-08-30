import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./HomePage.css"; // ✅ Import CSS
import config from "../config";

export default function HomePage() {
  const [cranes, setCranes] = useState([]);
  const [showCranes, setShowCranes] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

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

  // Function to get expiration status and priority for sorting
  const getExpirationStatus = (expiration) => {
    if (!expiration) return { status: "unknown", priority: 3, color: "gray" };
    
    try {
      // Convert DD/MM/YYYY to Date object for comparison
      const parts = expiration.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const year = parseInt(parts[2]);
        const expirationDate = new Date(year, month, day);
        const today = new Date();
        
        if (expirationDate < today) {
          return { status: "expired", priority: 3, color: "red" }; // Expired - lowest priority
        } else if (expirationDate.getTime() - today.getTime() <= 30 * 24 * 60 * 60 * 1000) {
          return { status: "within_month", priority: 2, color: "orange" }; // Within 30 days - medium priority
        } else {
          return { status: "above_month", priority: 1, color: "green" }; // More than 30 days - highest priority
        }
      }
      return { status: "unknown", priority: 3, color: "gray" }; // Invalid format
    } catch (error) {
      return { status: "unknown", priority: 3, color: "gray" }; // Error parsing date
    }
  };

  // Function to sort cranes by expiration status
  const sortCranesByExpiration = (cranesList) => {
    return cranesList.sort((a, b) => {
      const statusA = getExpirationStatus(a.expiration);
      const statusB = getExpirationStatus(b.expiration);
      
      // First sort by priority (1 = above month, 2 = within month, 3 = expired)
      if (statusA.priority !== statusB.priority) {
        return statusA.priority - statusB.priority;
      }
      
      // If same priority, sort by expiration date (earliest first)
      try {
        const partsA = a.expiration.split('/');
        const partsB = b.expiration.split('/');
        if (partsA.length === 3 && partsB.length === 3) {
          const dateA = new Date(parseInt(partsA[2]), parseInt(partsA[1]) - 1, parseInt(partsA[0]));
          const dateB = new Date(parseInt(partsB[2]), parseInt(partsB[1]) - 1, parseInt(partsB[0]));
          return dateA - dateB;
        }
      } catch (error) {
        // If date parsing fails, keep original order
      }
      
      return 0;
    });
  };

  const fetchCranes = async () => {
    if (showCranes) {
      // If already showing, hide it
      setShowCranes(false);
      return;
    }

    try {
      const res = await axios.get(`${config.API_URL}/api/cranes/public`);
      // Cranes data loaded successfully
      
      // Sort cranes by expiration status
      const sortedCranes = sortCranesByExpiration(res.data);
      setCranes(sortedCranes);
      setShowCranes(true);

      // Check for expiring cranes and create web alerts
      const today = new Date();
      const newAlerts = [];
      res.data.forEach((crane) => {
        try {
          const expDate = new Date(crane.expiration);
          const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
          if (diffDays > 0 && diffDays <= 4) {
            newAlerts.push({
              id: crane._id || Math.random(),
              message: `⚠️ Crane ${crane.unit} expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
              type: diffDays <= 1 ? 'critical' : 'warning',
              unit: crane.unit,
              expiration: crane.expiration,
              color: getExpirationStatus(crane.expiration).color
            });
          }
        } catch (error) {
          console.warn(`Invalid date format for crane ${crane.unit}: ${crane.expiration}`);
        }
      });
      setAlerts(newAlerts);
    } catch (err) {
      console.error("Error fetching cranes:", err);
      console.error("API URL used:", `${config.API_URL}/api/cranes/public`);
      
      if (err.response?.status === 404) {
        alert("Crane data not found. Please contact administrator.");
      } else if (err.code === 'ERR_NETWORK') {
        alert("Network error. Please check your internet connection.");
      } else {
        alert("Failed to load cranes. Please try again later.");
      }
    }
  };

  const handleCraneClick = () => {
    navigate("/login");
  };

  return (
    <div className="home-container">
      <h1 className="home-title">Crane Inspection Tracker</h1>
      <p className="home-subtitle">
        Manage crane inspections efficiently and keep track of expiration dates.
      </p>

      {/* Web Alerts - positioned absolutely in top-right */}
      {alerts.length > 0 && (
        <div className="web-alerts-home">
          <div className="alert-icon">🔔</div>
          <div className="alert-count">{alerts.length}</div>
          <div className="alert-dropdown">
            {alerts.map((alert) => (
              <div key={alert.id} className={`alert-item ${alert.type}`}>
                <div className="alert-content">
                  <span className="alert-message">{alert.message}</span>
                  <span className="alert-expiration" style={{ color: alert.color }}>
                    ({alert.expiration})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Login/Register */}
      <div className="button-group">
        <button className="btn btn-green" onClick={() => navigate("/login")}>
          Existing User Login
        </button>
        <button className="btn btn-blue" onClick={() => navigate("/register")}>
          New User Register
        </button>
      </div>

      {/* View Available Cranes */}
      <div className="view-cranes">
        <button className="btn btn-orange" onClick={fetchCranes}>
          {showCranes ? "Hide Crane Details" : "View Available Cranes"}
        </button>
      </div>

      {/* Crane List */}
      {showCranes && cranes.length > 0 && (
        <div className="table-container">
          <h2 style={{backgroundColor: "#222", color: "#ffaa00ef", fontWeight: "bold"}}>Available Cranes</h2>
          <table className="crane-table">
            <thead>
              <tr>
                <th style={{ backgroundColor: "#222", color: "#ffcc00", fontWeight: "bold", padding: "8px", textAlign: "center" }}>
                  UNIT #
                </th>
                <th style={{ backgroundColor: "#222", color: "#ffcc00", fontWeight: "bold", padding: "8px", textAlign: "center" }}>
                  MAKE & MODEL
                </th>
                <th style={{ backgroundColor: "#222", color: "#ffcc00", fontWeight: "bold", padding: "8px", textAlign: "center" }}>
                  EXPIRATION
                </th>
              </tr>
            </thead>
            <tbody>
              {cranes.map((crane, index) => {
                const expirationStatus = getExpirationStatus(crane.expiration);
                return (
                  <tr key={index} onClick={handleCraneClick}>
                    <td>{crane.unit}</td>
                    <td>{crane.makeModel}</td>
                    <td style={{ 
                      color: expirationStatus.color,
                      fontWeight: "bold"
                    }}>
                      {crane.expiration}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCranes && cranes.length === 0 && (
        <p className="no-cranes">No cranes available. Please upload an Excel file from the supervisor dashboard.</p>
      )}


    </div>
  );
}


