import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./HomePage.css"; // ✅ Import CSS
import config from "../config";

export default function HomePage() {
  const [cranes, setCranes] = useState([]);
  const [showCranes, setShowCranes] = useState(false);
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

  // Function to get expiration color
  const getExpirationColor = (expiration) => {
    if (!expiration) return "gray";
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
          return "red"; // Expired
        } else if (expirationDate.getTime() - today.getTime() <= 30 * 24 * 60 * 60 * 1000) {
          return "orange"; // Within 30 days
        } else {
          return "green"; // More than 30 days
        }
      }
      return "gray"; // Invalid format
    } catch (error) {
      return "gray"; // Error parsing date
    }
  };

  const fetchCranes = async () => {
    if (showCranes) {
      // If already showing, hide it
      setShowCranes(false);
      return;
    }

    try {
      const res = await axios.get(`${config.API_URL}/api/cranes/public`);
      console.log("Fetched cranes:", res.data); // Debug log
      setCranes(res.data);
      setShowCranes(true);
    } catch (err) {
      console.error("Error fetching cranes:", err);
      alert("Failed to load cranes. Please check if the backend server is running.");
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
                <th style={{ backgroundColor: "#222", color: "#ffcc00", fontWeight: "bold", padding: "8px" }}>
                  Unit #
                </th>
                <th style={{ backgroundColor: "#222", color: "#ffcc00", fontWeight: "bold", padding: "8px" }}>
                  Make & Model
                </th>
                <th style={{ backgroundColor: "#222", color: "#ffcc00", fontWeight: "bold", padding: "8px" }}>
                  Expiration
                </th>
              </tr>
            </thead>
            <tbody>
              {cranes.map((crane, index) => (
                <tr key={index} onClick={handleCraneClick}>
                  <td>{crane.unit}</td>
                  <td>{crane.makeModel}</td>
                  <td style={{ 
                    color: getExpirationColor(crane.expiration),
                    fontWeight: "bold"
                  }}>
                    {crane.expiration}
                  </td>
                </tr>
              ))}
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
