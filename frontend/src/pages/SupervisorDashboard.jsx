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
  const [alertSummary, setAlertSummary] = useState({ expired: 0, expiring: 0, ok: 0 });
  const [backendConnected, setBackendConnected] = useState(false);
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

  const fetchCranes = async () => {
    try {
      let token = localStorage.getItem("token");
      
      if (!token) {
        console.log("❌ No token found in localStorage");
        alert("❌ You are not logged in. Please login first.");
        navigate("/login");
        return;
      }
      
      // Ensure token has Bearer prefix
      if (!token.startsWith('Bearer ')) {
        token = `Bearer ${token}`;
      }
      
      console.log("🔍 Fetching cranes from backend...");
      console.log("📍 API URL:", `${config.API_URL}/api/cranes/supervisor`);
      console.log("🔑 Token:", token.substring(0, 20) + "...");
      
      // Try local backend first
      let res;
      try {
        console.log("🌐 Trying local backend...");
        res = await axios.get(`${config.API_URL}/api/cranes/supervisor`, {
          headers: { Authorization: token },
          timeout: 5000
        });
        console.log("✅ Local backend success, cranes received:", res.data.length);
      } catch (localError) {
        console.log("❌ Local backend failed, trying remote...");
        // If local fails, try remote
        res = await axios.get(`${config.FALLBACK_API_URL}/api/cranes/supervisor`, {
          headers: { Authorization: token },
          timeout: 5000
        });
        console.log("✅ Remote backend success, cranes received:", res.data.length);
      }
      
      // Cranes data loaded successfully
      
      console.log("📊 Processing cranes data:", res.data);
      setCranes(res.data);

      // Calculate alert summary using the same logic as getStatus function
      let expiredCount = 0;
      let expiringCount = 0;
      let okCount = 0;
      
      res.data.forEach((crane) => {
        try {
          const status = getStatus(crane.Expiration);
          if (status === "Expired") {
            expiredCount++;
          } else if (status === "Near to Expire") {
            expiringCount++;
          } else if (status === "OK") {
            okCount++;
          }
        } catch (error) {
          console.warn(`Error calculating status for crane ${crane["Unit #"]}: ${crane.Expiration}`);
        }
      });
      
      console.log("🚨 Alert summary calculated:", { expired: expiredCount, expiring: expiringCount, ok: okCount });
      setAlertSummary({ expired: expiredCount, expiring: expiringCount, ok: okCount });
      // Alert summary calculated successfully
    } catch (err) {
      console.error("Error fetching cranes", err);
      console.error("API URL used:", `${config.API_URL}/api/cranes/supervisor`);
      
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        alert("❌ Network error. Please check your internet connection.");
        setCranes([]);
        setAlertSummary({ expired: 0, expiring: 0, ok: 0 });
        return;
      }
      
      if (err.response?.status === 401) {
        alert("❌ Unauthorized. Please login again.");
        navigate("/login");
      } else if (err.response?.status === 404) {
        alert("❌ API endpoint not found. Please contact administrator.");
        setCranes([]);
        setAlertSummary({ expired: 0, expiring: 0, ok: 0 });
      } else {
        alert(`❌ Error loading cranes: ${err.response?.data?.error || err.message}`);
        setCranes([]);
        setAlertSummary({ expired: 0, expiring: 0, ok: 0 });
      }
    }
  };

  useEffect(() => {
    // Always try to fetch from backend first
    fetchCranes();
  }, []);

  const handleEdit = (crane) => {
    // Open edit page in new tab with crane data
    const craneData = encodeURIComponent(JSON.stringify(crane));
    window.open(`/edit-crane?data=${craneData}`, '_blank');
  };



  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this crane?")) return;
    
    // Ask for secret code - this is the only requirement
    const secretCode = prompt("Enter secret code to delete this crane:");
    if (!secretCode) {
      alert("No secret code entered. Delete cancelled.");
      return;
    }
    
    if (secretCode !== "admin@123") {
      alert("❌ Wrong secret code! Delete cancelled.");
      return;
    }
    
    // Secret code is correct - proceed with delete
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("❌ You are not logged in. Please login again.");
        navigate("/login");
        return;
      }
      
      // Try local backend first
      let response;
      try {
        response = await axios.delete(
          `${config.API_URL}/api/cranes/${id}`,
          { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
        );
      } catch (localError) {
        // If local fails, try remote
        console.log("Local backend failed, trying remote...");
        response = await axios.delete(
          `${config.FALLBACK_API_URL}/api/cranes/${id}`,
          { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
        );
      }
      
      if (response.status === 200 || response.status === 204) {
        // Remove the crane from the local state
        const updatedCranes = cranes.filter(crane => crane._id !== id);
        setCranes(updatedCranes);
        
        // Update alert summary
        let expiredCount = 0;
        let expiringCount = 0;
        let okCount = 0;
        
        updatedCranes.forEach((crane) => {
          try {
            const status = getStatus(crane.Expiration);
            if (status === "Expired") {
              expiredCount++;
            } else if (status === "Near to Expire") {
              expiringCount++;
            } else if (status === "OK") {
              okCount++;
            }
          } catch (error) {
            console.warn(`Error calculating status for crane ${crane["Unit #"]}: ${crane.Expiration}`);
          }
        });
        
        setAlertSummary({ expired: expiredCount, expiring: expiringCount, ok: okCount });
        
        alert("✅ Crane deleted successfully from database!");
      } else {
        alert("❌ Failed to delete crane from database. Please try again.");
      }
      
    } catch (err) {
      console.error("Delete error:", err);
      if (err.response?.status === 404) {
        alert("❌ Crane not found in database.");
      } else if (err.response?.status === 403) {
        alert("❌ Access denied. You don't have permission to delete cranes.");
      } else {
        alert(`❌ Failed to delete crane: ${err.response?.data?.error || err.message}`);
      }
    }
  };


const handleEmailAlert = async (id, expiration) => {
  const token = localStorage.getItem("token");
  
        // Email alert request initiated
  
  if (!token) {
    alert("You are not logged in. Please log in again.");
    navigate("/login");
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
    // Try local backend first
    let response;
    try {
              response = await axios.post(
          `${config.API_URL}/api/cranes/${id}/send-alert`,
        { recipientEmail },
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: 5000
        }
      );
    } catch (localError) {
      // If local fails, try remote
      console.log("Local backend failed, trying remote...");
              response = await axios.post(
          `${config.FALLBACK_API_URL}/api/cranes/${id}/send-alert`,
        { recipientEmail },
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: 5000
        }
      );
    }
    console.log("Email response:", response.data);
    alert(`Email sent successfully to ${recipientEmail}`);
  } catch (err) {
    console.error("Error sending email:", err.response?.data || err);
    console.error("Error status:", err.response?.status);
    
    if (err.response?.status === 401) {
      alert("Unauthorized. Please log in again.");
      navigate("/login");
    } else if (err.response?.status === 404) {
      alert("Crane not found. It may have been deleted.");
    } else {
      alert(`Failed to send email: ${err.response?.data?.error || err.message}`);
    }
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
      // Try local backend first
      try {
        await axios.post(
          `${config.API_URL}/api/cranes/${crane._id}/send-alert`,
          { recipientEmail },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
        );
      } catch (localError) {
        // If local fails, try remote
        console.log("Local backend failed, trying remote...");
        await axios.post(
          `${config.FALLBACK_API_URL}/api/cranes/${crane._id}/send-alert`,
          { recipientEmail },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
        );
      }
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
      
      // Try local backend first
      try {
        await axios.post(
          `${config.API_URL}/api/cranes/send-summary-report`,
          reportData,
          { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
        );
      } catch (localError) {
        // If local fails, try remote
        console.log("Local backend failed, trying remote...");
        await axios.post(
          `${config.FALLBACK_API_URL}/api/cranes/send-summary-report`,
          reportData,
          { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
        );
      }
      alert("✅ Summary report sent successfully!");
    } catch (error) {
      console.error("Error sending summary report:", error);
      alert(`❌ Failed to send summary report: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleCleanUnitNumbers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("❌ You are not logged in. Please login again.");
        navigate("/login");
        return;
      }
      
      console.log("🧹 Checking for duplicates first...");
      
      // First check for duplicates
      let checkResponse;
      try {
        checkResponse = await axios.get(
          `${config.API_URL}/api/cranes/check-duplicates`,
          { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
        );
      } catch (localError) {
        // If local fails, try remote
        console.log("Local backend failed, trying remote...");
        checkResponse = await axios.get(
          `${config.FALLBACK_API_URL}/api/cranes/check-duplicates`,
          { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
        );
      }

      if (checkResponse.data.hasDuplicates) {
        const confirmMessage = `⚠️ Found ${checkResponse.data.duplicateCount} Unit #s with duplicates:\n\n${checkResponse.data.duplicateDetails.map(d => 
          `• ${d.unitNumber}: ${d.count} cranes\n  - ${d.cranes.map(c => `${c.makeModel} (${c.serial})`).join('\n  - ')}`
        ).join('\n\n')}\n\nThis is why delete operations don't work properly!\n\nDo you want to clean all duplicates? (This will keep only 1 crane per Unit #)`;
        
        if (!window.confirm(confirmMessage)) {
          return;
        }
      }
      
      console.log("🧹 Cleaning Unit #s...");
      
      // Try local backend first
      let response;
      try {
        response = await axios.post(
          `${config.API_URL}/api/cranes/clean-unit-numbers`,
          {},
          { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
        );
      } catch (localError) {
        // If local fails, try remote
        console.log("Local backend failed, trying remote...");
        response = await axios.post(
          `${config.FALLBACK_API_URL}/api/cranes/clean-unit-numbers`,
          {},
          { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
        );
      }
      
      const result = response.data;
      alert(`✅ Unit # cleaning completed!\n\nSpaces cleaned: ${result.spacesCleaned || 0}\nDuplicates resolved: ${result.duplicatesResolved || 0}\nTotal duplicates found: ${result.totalDuplicatesFound || 0}\n\nPlease refresh the page to see the updated data.`);
      
      // Refresh the cranes data
      fetchCranes();
      
    } catch (error) {
      console.error("Error cleaning Unit #s:", error);
      if (error.response?.status === 403) {
        alert("❌ Access denied. Only supervisors can clean Unit #s.");
      } else {
        alert(`❌ Error cleaning Unit #s: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  // Handle Print All Cranes
  const handlePrintAllCranes = () => {
    if (cranes.length === 0) {
      alert("No cranes available to print.");
      return;
    }

    // Create a formatted table for printing/exporting
    const tableData = cranes.map((crane, index) => ({
      'S.No': index + 1,
      'Unit #': crane["Unit #"] || '',
      'Year': crane["Year"] || '',
      'Make & Model': crane["Make and Model"] || '',
      'Ton': crane["Ton"] || '',
      'Serial #': crane["Serial #"] || '',
      'Expiration': convertExcelDate(crane["Expiration"]) || '',
      'Currently In Use': crane["Currently In Use"] || '',
      'Status': getStatus(crane["Expiration"]),
      'Active': crane.active ? 'Yes' : 'No'
    }));

    // Create CSV content
    const headers = Object.keys(tableData[0]);
    const csvContent = [
      headers.join(','),
      ...tableData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `crane_inspection_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Also open print dialog with formatted table
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Crane Inspection Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .status-ok { color: green; }
            .status-expired { color: red; }
            .status-near { color: orange; }
            .status-inactive { color: gray; }
            .summary { margin: 20px 0; padding: 10px; background-color: #f9f9f9; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Crane Inspection Report</h1>
          <div class="summary">
            <strong>Report Generated:</strong> ${new Date().toLocaleString()}<br>
            <strong>Total Cranes:</strong> ${cranes.length}<br>
            <strong>Active Cranes:</strong> ${cranes.filter(c => c.active).length}<br>
            <strong>Expired Cranes:</strong> ${cranes.filter(c => getStatus(c["Expiration"]) === "Expired").length}<br>
            <strong>Expiring This Month:</strong> ${cranes.filter(c => getStatus(c["Expiration"]) === "Near to Expire").length}
          </div>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Unit #</th>
                <th>Year</th>
                <th>Make & Model</th>
                <th>Ton</th>
                <th>Serial #</th>
                <th>Expiration</th>
                <th>Currently In Use</th>
                <th>Status</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              ${tableData.map(row => `
                <tr>
                  <td>${row['S.No']}</td>
                  <td>${row['Unit #']}</td>
                  <td>${row['Year']}</td>
                  <td>${row['Make & Model']}</td>
                  <td>${row['Ton']}</td>
                  <td>${row['Serial #']}</td>
                  <td>${row['Expiration']}</td>
                  <td>${row['Currently In Use']}</td>
                  <td class="status-${row['Status'].toLowerCase().replace(' ', '-')}">${row['Status']}</td>
                  <td>${row['Active']}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()">🖨️ Print Report</button>
            <button onclick="window.close()">❌ Close</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Helper function to check for duplicate Unit #s
  const getDuplicateUnitNumbers = () => {
    const unitCounts = {};
    cranes.forEach(crane => {
      const unit = crane["Unit #"];
      unitCounts[unit] = (unitCounts[unit] || 0) + 1;
    });
    return Object.keys(unitCounts).filter(unit => unitCounts[unit] > 1);
  };

  const duplicateUnits = getDuplicateUnitNumbers();

  // Apply filter + status + sort
  const filteredCranes = cranes
    .map((crane) => ({
      ...crane,
      status: getStatus(crane.Expiration),
      active: Boolean(crane.active), // Ensure active is boolean
      isDuplicate: duplicateUnits.includes(crane["Unit #"]) // Mark duplicate Unit #s
    }))
    .filter((crane) => {
      if (!filterValue.trim()) return true;
      
      const search = filterValue.toLowerCase().trim();
      const unitNumber = crane["Unit #"]?.toLowerCase() || '';
      const makeModel = crane["Make and Model"]?.toLowerCase() || '';
      const serialNumber = crane["Serial #"]?.toLowerCase() || '';
      const year = crane["Year"]?.toLowerCase() || '';
      const ton = crane["Ton"]?.toLowerCase() || '';
      
      // Smart search with priority matching
      // 1. Exact Unit # match (highest priority)
      if (unitNumber === search) return true;
      
      // 2. Unit # starts with search term
      if (unitNumber.startsWith(search)) return true;
      
      // 3. Unit # contains search term (but not too broad)
      if (search.length >= 3 && unitNumber.includes(search)) return true;
      
      // 4. Other field matches
      return (
        makeModel.includes(search) ||
        serialNumber.includes(search) ||
        year.includes(search) ||
        ton.includes(search)
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
              <div className="web-alerts">
                <div className="alert-icon">🔔</div>
                <div className="alert-count">{alertSummary.expired + alertSummary.expiring + alertSummary.ok}</div>
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
                    <div className="summary-item">
                      <span className="summary-icon">✅</span>
                      <span className="summary-text">{alertSummary.ok} OK</span>
                    </div>
                    <div className="summary-footer">
                      Total Cranes: {cranes.length}
                    </div>
                  </div>
                </div>
              </div>
              
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
            <div className="search-container">
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 Search: Unit #, Model, Serial, Year..."
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="search-input"
                  title="Search by Unit # (exact or starts with), Make & Model, Serial #, Year, or Ton"
                />
                {filterValue && (
                  <button
                    onClick={() => setFilterValue('')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
              {filterValue && (
                <div className="search-help">
                  <small>
                    Showing {filteredCranes.length} of {cranes.length} cranes
                    {filterValue.length < 3 && filteredCranes.length > 10 && (
                      <span style={{color: '#ff9800'}}> • Tip: Type 3+ characters for better results</span>
                    )}
                    {filterValue.length >= 3 && (
                      <span style={{color: '#4caf50'}}> • Search: "{filterValue}"</span>
                    )}
                  </small>
                </div>
              )}
            </div>
            <a 
    href="/add-crane" 
    target="_blank" 
    rel="noopener noreferrer" 
    className="btn btn-primary"
  >
    ➕ Add New Crane
  </a>
            <button 
    onClick={handlePrintAllCranes}
    className="btn btn-secondary"
  >
    📄 Print All Cranes
  </button>

            <button className="btn btn-danger" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>

        {duplicateUnits.length > 0 && (
          <div className="duplicate-warning" style={{
            background: 'linear-gradient(135deg, #ff9800, #f57c00)',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 8px 25px rgba(255, 152, 0, 0.3)'
          }}>
            <div>
              <strong>⚠️ Duplicate Unit #s Detected!</strong>
              <br />
              Found {duplicateUnits.length} Unit #s with duplicates: {duplicateUnits.join(', ')}
              <br />
              <small style={{opacity: 0.9}}>
                This is why delete operations may not work properly. Clean duplicates first!
              </small>
            </div>
            <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
              <button 
                onClick={handleCleanUnitNumbers}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                🧹 Clean Now
              </button>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
                title="Refresh to see updated data"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        )}

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
