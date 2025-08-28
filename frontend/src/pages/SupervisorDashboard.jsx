// src/pages/SupervisorDashboard.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import CraneTable from "../components/CraneTable";
import { useNavigate } from "react-router-dom";
import ExcelUpload from "../components/ExcelUpload";

import config from "../config";
import "./SupervisorDashboard.css";

export default function SupervisorDashboard() {
  const [cranes, setCranes] = useState([]);
  const [filterValue, setFilterValue] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [alertSummary, setAlertSummary] = useState({ expired: 0, expiring: 0 });
  const navigate = useNavigate();

  const fetchCranes = async () => {
    try {
      const token = localStorage.getItem("token");
            const res = await axios.get(`${config.API_URL}/api/cranes/supervisor`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setCranes(res.data);

      // Calculate alert summary
      const today = new Date();
      let expiredCount = 0;
      let expiringCount = 0;
      
      res.data.forEach((crane) => {
        try {
          // Convert Excel date if needed
          const expirationDate = convertExcelDate(crane.Expiration);
          const expDate = new Date(expirationDate);
          const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
          
          console.log(`Crane ${crane["Unit #"]}: Original=${crane.Expiration}, Converted=${expirationDate}, DiffDays=${diffDays}`);
          
          if (diffDays < 0) {
            expiredCount++;
          } else if (diffDays > 0 && diffDays <= 30) {
            expiringCount++;
          }
        } catch (error) {
          console.warn(`Invalid date format for crane ${crane["Unit #"]}: ${crane.Expiration}`);
        }
      });
      
      setAlertSummary({ expired: expiredCount, expiring: expiringCount });
      console.log(`Alert Summary: ${expiredCount} expired, ${expiringCount} expiring within 30 days`);
      console.log(`Loaded ${res.data.length} cranes successfully`);
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
    
    // Set up auto-refresh every 30 seconds for real-time alerts
    const interval = setInterval(() => {
      fetchCranes();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleEdit = (crane) => {
    // Open edit page in new tab with crane data
    const craneData = encodeURIComponent(JSON.stringify(crane));
    window.open(`/edit-crane?data=${craneData}`, '_blank');
  };



  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this crane?")) return;
    const token = localStorage.getItem("token");
    await axios.delete(`${config.API_URL}/api/cranes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchCranes();
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

  const handleEmailAlertClick = () => {
    // This prevents the dropdown from closing when clicking the email icon
  };

  const handleSendEmailAlert = async () => {
    // Show crane selection dialog
    const craneOptions = cranes.map(crane => `${crane["Unit #"]} - ${crane["Make and Model"]}`).join('\n');
    const selectedCrane = prompt(`Select a crane to send email alert:\n\n${craneOptions}\n\nEnter the Unit # of the crane:`);
    
    if (!selectedCrane) return;
    
    const crane = cranes.find(c => c["Unit #"] === selectedCrane.trim());
    if (!crane) {
      alert("❌ Crane not found. Please enter a valid Unit #.");
      return;
    }
    
    // Get recipient email
    const recipientEmail = prompt(`Enter recipient email for crane ${crane["Unit #"]}:`);
    if (!recipientEmail) return;
    
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${config.API_URL}/api/cranes/${crane._id}/send-alert`,
        { recipientEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`✅ Email alert sent successfully for crane ${crane["Unit #"]}!`);
    } catch (error) {
      console.error("Error sending email alert:", error);
      alert(`❌ Failed to send email alert: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSendSummaryReport = async () => {
    const recipientEmail = prompt("Enter recipient email for summary report:");
    if (!recipientEmail) return;
    
    try {
      const token = localStorage.getItem("token");
      const reportData = {
        recipientEmail,
        totalCranes: cranes.length,
        expiredCount: alertSummary.expired,
        expiringCount: alertSummary.expiring,
        summary: `Crane Management Summary:\n- Total Cranes: ${cranes.length}\n- Expired: ${alertSummary.expired}\n- Expiring This Month: ${alertSummary.expiring}`
      };
      
      await axios.post(
        `${config.API_URL}/api/cranes/send-summary-report`,
        reportData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Summary report sent successfully!");
    } catch (error) {
      console.error("Error sending summary report:", error);
      alert(`❌ Failed to send summary report: ${error.response?.data?.error || error.message}`);
    }
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
          <div className="header-left">
            <h1> Crane Management System</h1>
            <p>📊 Monitor inspections • ⏰ Track expirations • 📧 Send alerts</p>
          </div>
          <div className="header-right">
            <div className="header-alerts">
              {(alertSummary.expired > 0 || alertSummary.expiring > 0) && (
                <div className="web-alerts">
                  <div className="alert-icon">🔔</div>
                  <div className="alert-count">{alertSummary.expired + alertSummary.expiring}</div>
                  <div className="alert-dropdown">
                    <div className="alert-summary">
                      <div className="summary-item">
                        <span className="summary-icon">🚨</span>
                        <span className="summary-text">{alertSummary.expired} Expired</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-icon">⚠️</span>
                        <span className="summary-text">{alertSummary.expiring} Expiring This Month</span>
                      </div>
                      <div className="summary-footer">
                        Total Cranes: {cranes.length}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="email-alerts" onClick={handleEmailAlertClick}>
                <div className="email-icon">📧</div>
                <div className="email-dropdown">
                  <div className="email-summary">
                    <div className="summary-item clickable" onClick={(e) => { e.stopPropagation(); handleSendEmailAlert(); }}>
                      <span className="summary-icon">📧</span>
                      <span className="summary-text">Send Email Alert</span>
                    </div>
                    <div className="summary-item clickable" onClick={(e) => { e.stopPropagation(); handleSendSummaryReport(); }}>
                      <span className="summary-icon">📊</span>
                      <span className="summary-text">Send Summary Report</span>
                    </div>
                    <div className="summary-footer">
                      Email notifications
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      <div className="dashboard-content">
        <div className="controls-section">
          <div className="upload-section">
            <div className="upload-header" onClick={() => setUploadOpen(!uploadOpen)}>
              <h3>📁 Excel Data Import</h3>
              <span className="dropdown-arrow">{uploadOpen ? '▼' : '▶'}</span>
            </div>
            {uploadOpen && (
              <div className="upload-content">
                <ExcelUpload onUploadComplete={fetchCranes} />
              </div>
            )}
          </div>
          
          <div className="search-controls">
            <input
              type="text"
              placeholder="🔍 Search cranes by unit, model, or serial..."
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="search-input"
            />
            <a 
    href="/add-crane" 
    target="_blank" 
    rel="noopener noreferrer" 
    className="btn btn-primary"
  >
    ➕ Add New Crane
  </a>
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

        {/* Modal removed - editing now opens in new tab */}
      </div>
    </div>
    </div>
  );
}
