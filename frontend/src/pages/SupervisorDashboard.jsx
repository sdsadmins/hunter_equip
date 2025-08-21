// src/pages/SupervisorDashboard.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import CraneTable from "../components/CraneTable";
import AddEditCraneModal from "./AddEditCraneModal";
import { useNavigate } from "react-router-dom";
import ExcelUpload from "../components/ExcelUpload";

import config from "../config";
import "./SupervisorDashboard.css";

export default function SupervisorDashboard() {
  const [cranes, setCranes] = useState([]);
  const [filterValue, setFilterValue] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCrane, setEditingCrane] = useState(null);
  const navigate = useNavigate();

  const fetchCranes = async () => {
    try {
      const token = localStorage.getItem("token");
            const res = await axios.get(`${config.API_URL}/api/cranes/supervisor`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setCranes(res.data);

      // Auto send alerts for expiring cranes (<= 4 days)
      const today = new Date();
      res.data.forEach(async (crane) => {
        try {
          const expDate = new Date(crane.Expiration);
          const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
          if (diffDays > 0 && diffDays <= 4) {
          try {
                         await axios.post(
               `${config.API_URL}/api/cranes/${crane._id}/send-alert`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
                      } catch (err) {
              console.warn(`Auto email failed for ${crane["Unit #"]}`);
            }
          }
        } catch (error) {
          console.warn(`Invalid date format for crane ${crane["Unit #"]}: ${crane.Expiration}`);
        }
      });
    } catch (err) {
      console.error("Error fetching cranes", err);
      if (err.response?.status === 401) {
        alert("Unauthorized. Please login again.");
        navigate("/");
      }
    }
  };

  useEffect(() => {
    fetchCranes();
  }, []);

  const handleEdit = (crane) => {
    setEditingCrane(crane);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this crane?")) return;
    const token = localStorage.getItem("token");
    await axios.delete(`${config.API_URL}/api/cranes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchCranes();
  };

  const handleSaveCrane = async (craneData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You are not logged in. Please log in again.");
        return;
      }

      if (editingCrane) {
        // Update existing crane
        await axios.put(`${config.API_URL}/api/cranes/${editingCrane._id}`, craneData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        alert("✅ Crane updated successfully!");
      } else {
        // Add new crane
        await axios.post(`${config.API_URL}/api/cranes`, craneData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("✅ New crane added successfully!");
      }
      
      // Add a small delay to ensure the database update is complete
      setTimeout(() => {
        fetchCranes();
      }, 100);
      setShowModal(false);
      setEditingCrane(null);
    } catch (error) {
      console.error("Error saving crane:", error);
      const errorMessage = error.response?.data?.error || "Failed to save crane. Please try again.";
      alert(`❌ Error: ${errorMessage}`);
    }
  };
const handleEmailAlert = async (id, expiration) => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    alert("You are not logged in. Please log in again.");
    return;
  }

  // Check expiration days
  let diffDays = 0;
  try {
    const today = new Date();
    const expDate = new Date(expiration);
    diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  } catch (error) {
    alert("Invalid date format. Cannot calculate expiration days.");
    return;
  }

  if (diffDays > 4) {
    alert("Email alerts can only be sent within 4 days of expiration.");
    return;
  }

  let recipientEmail = prompt("Enter recipient email address:");
  if (!recipientEmail) {
    alert("No email entered. Cancelled.");
    return;
  }

  try {
         await axios.post(
       `${config.API_URL}/api/cranes/${id}/send-alert`,
      { recipientEmail },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    alert(`Email sent to ${recipientEmail}`);
  } catch (err) {
    console.error("Error sending email", err.response?.data || err);
    alert("Failed to send email.");
  }
};



  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/");
  };

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

  // === Status Calculation ===
  const getStatus = (expiration) => {
    if (!expiration) return "Inactive";
    try {
      const convertedExpiration = convertExcelDate(expiration);
      // Parse DD/MM/YYYY format
      const parts = convertedExpiration.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const year = parseInt(parts[2]);
        const expDate = new Date(year, month, day);
        const today = new Date();
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return "Expired";
        if (diffDays <= 30) return "Near to Expire";
        return "OK";
      }
      return "Inactive";
    } catch (error) {
      return "Inactive"; // if date parsing fails, show as inactive
    }
  };

  // Apply filter + status + sort
  const filteredCranes = cranes
    .map((crane) => ({
      ...crane,
      status: getStatus(crane.Expiration),
      active: Boolean(crane.active) // Ensure active is boolean
    }))
    .filter((crane) => {
      if (!filterValue.trim()) return true;
      const search = filterValue.toLowerCase();
      return (
        crane["Unit #"]?.toLowerCase().includes(search) ||
        crane["Make and Model"]?.toLowerCase().includes(search) ||
        crane.Expiration?.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      // First sort by active status (active cranes first)
      if (a.active !== b.active) {
        return a.active ? -1 : 1; // Active cranes come first
      }
      
      // Then sort by status order
      const order = { "OK": 1, "Near to Expire": 2, "Expired": 3, "Inactive": 4 };
      return order[a.status] - order[b.status];
    });

  return (
    <div className="supervisor-dashboard-wrapper">
      <div className="supervisor-dashboard">
        <div className="dashboard-header">
          <h1>🏗️ Crane Management System</h1>
          <p>📊 Monitor inspections • ⏰ Track expirations • 📧 Send alerts</p>
        </div>

      <div className="dashboard-content">
        <div className="upload-section">
          <h3>📁 Excel Data Import</h3>
          <ExcelUpload onUploadComplete={fetchCranes} />
        </div>

        <div className="controls-section">
          <div className="search-controls">
            <input
              type="text"
              placeholder="🔍 Search cranes by unit, model, or serial..."
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="search-input"
            />
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              ➕ Add New Crane
            </button>
            <button className="btn btn-danger" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>

        <div className="table-section">
          <CraneTable
            cranes={filteredCranes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onEmailAlert={handleEmailAlert}
          />
        </div>

        {showModal && (
          <AddEditCraneModal
            crane={editingCrane}
            onSave={handleSaveCrane}
            onClose={() => {
              setShowModal(false);
              setEditingCrane(null);
            }}
          />
        )}
      </div>
    </div>
    </div>
  );
}
