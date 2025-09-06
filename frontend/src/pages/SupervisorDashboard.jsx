// src/pages/SupervisorDashboard.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import CraneTable from "../components/CraneTable";
import { useNavigate } from "react-router-dom";
import ExcelUpload from "../components/ExcelUpload";
import EmailManagementModal from "../components/EmailManagementModal";

import config from "../config";
import "./SupervisorDashboard.css";

export default function SupervisorDashboard() {
  const [cranes, setCranes] = useState([]);
  const [filterValue, setFilterValue] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedCrane, setSelectedCrane] = useState(null);
  const [alertSummary, setAlertSummary] = useState({ expired: 0, expiring: 0, ok: 0 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [backendConnected, setBackendConnected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const navigate = useNavigate();

  const showSuccessMessage = (message) => {
    // Create a success message overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;
    
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
      background: linear-gradient(135deg, #4CAF50, #45a049);
      color: white;
      padding: 30px 40px;
      border-radius: 15px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      font-size: 18px;
      font-weight: 600;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;
    
    messageBox.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 10px;">✅</div>
      <div>${message}</div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    overlay.appendChild(messageBox);
    document.body.appendChild(overlay);
    
    // Remove overlay after 2 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 2000);
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
        
        showSuccessMessage("Crane deleted successfully from database!");
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
    console.log("🔍 Email alert clicked for ID:", id);
    console.log("🔍 Available cranes:", cranes.map(c => ({ id: c._id, unit: c["Unit #"] })));
    
    // Find the crane by ID
    const crane = cranes.find(c => c._id === id || c.id === id);
    if (!crane) {
      console.error("❌ Crane not found for ID:", id);
      alert("Crane not found");
      return;
    }
    
    console.log("✅ Found crane:", crane);
    console.log("🔍 Opening email modal for:", crane["Unit #"]);
    
    // Open email management modal
    setSelectedCrane(crane);
    setEmailModalOpen(true);
  };

  const handleEmailUpdated = (updatedCrane) => {
    console.log("🔍 Updating crane email in local state:", updatedCrane);
    console.log("🔍 Current cranes state:", cranes.map(c => ({ id: c._id, unit: c["Unit #"], email: c.alertEmail })));
    
    // Find the specific crane that was updated
    const targetCraneId = updatedCrane.id || updatedCrane._id;
    console.log("🔍 Target crane ID to update:", targetCraneId);
    
    // Update the crane in the local state
    setCranes(prevCranes => {
      const updatedCranes = prevCranes.map(c => {
        // Check if this is the crane we need to update
        if (c._id === targetCraneId || c.id === targetCraneId) {
          console.log("✅ Updating crane:", c["Unit #"], "with email:", updatedCrane.alertEmail);
          return { ...c, alertEmail: updatedCrane.alertEmail };
        }
        return c;
      });
      
      console.log("🔍 Updated cranes state:", updatedCranes.map(c => ({ id: c._id, unit: c["Unit #"], email: c.alertEmail })));
      return updatedCranes;
    });
    
    // Also update the selected crane if it's the same one
    if (selectedCrane && (selectedCrane._id === targetCraneId || selectedCrane.id === targetCraneId)) {
      setSelectedCrane(prev => ({ ...prev, alertEmail: updatedCrane.alertEmail }));
    }
    
    // Don't refresh all cranes - just keep the local state updated
    console.log("✅ Email updated successfully for crane:", updatedCrane.unitNumber || updatedCrane["Unit #"]);
    console.log("✅ Local state updated - no need to refresh from database");
  };

  const handleTriggerAutoEmail = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("❌ You are not logged in. Please login again.");
        navigate("/login");
        return;
      }
      
      console.log("🔔 Triggering auto-email service...");
      
      // Try local backend first
      let response;
      try {
        response = await axios.post(
          `${config.API_URL}/api/cranes/trigger-auto-email`,
          {},
          { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
        );
      } catch (localError) {
        // If local fails, try remote
        console.log("Local backend failed, trying remote...");
        response = await axios.post(
          `${config.FALLBACK_API_URL}/api/cranes/trigger-auto-email`,
          {},
          { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
        );
      }
      
      const result = response.data.result;
      if (result && result.success) {
        alert(`✅ Auto-email service completed successfully!\n\n📊 Results:\n• Total cranes processed: ${result.totalProcessed}\n• Emails sent: ${result.alertsSent}\n• Errors: ${result.errors}\n• Timestamp: ${new Date(result.timestamp).toLocaleString()}\n\nCheck your email inbox for alerts!`);
      } else {
        alert(`⚠️ Auto-email service completed with issues!\n\n📊 Results:\n• Total cranes processed: ${result?.totalProcessed || 0}\n• Emails sent: ${result?.alertsSent || 0}\n• Errors: ${result?.errors || 1}\n• Error: ${result?.error || 'Unknown error'}\n\nCheck the backend console for detailed logs.`);
      }
      console.log("✅ Auto-email response:", response.data);
      
    } catch (error) {
      console.error("❌ Error triggering auto-email service:", error);
      alert(`❌ Failed to trigger auto-email service: ${error.response?.data?.error || error.message}`);
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

  // Handle alert summary item clicks for filtering
  const handleAlertClick = (status) => {
    if (status === "all") {
      setStatusFilter("all");
    } else if (status === "expired") {
      setStatusFilter("Expired");
    } else if (status === "expiring") {
      setStatusFilter("Near to Expire");
    } else if (status === "ok") {
      setStatusFilter("OK");
    }
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
    
    // Open email management modal for the selected crane
    setSelectedCrane(crane);
    setEmailModalOpen(true);
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
      // Status filtering
      if (statusFilter !== "all" && crane.status !== statusFilter) {
        return false;
      }
      
      // Month filter
      if (monthFilter) {
        try {
          const craneExpiration = convertExcelDate(crane.Expiration);
          if (!craneExpiration) return false;
          
          const monthValue = monthFilter.toLowerCase().trim();
          const monthNames = {
            'jan': '01', 'january': '01',
            'feb': '02', 'february': '02',
            'mar': '03', 'march': '03',
            'apr': '04', 'april': '04',
            'may': '05',
            'jun': '06', 'june': '06',
            'jul': '07', 'july': '07',
            'aug': '08', 'august': '08',
            'sep': '09', 'september': '09',
            'oct': '10', 'october': '10',
            'nov': '11', 'november': '11',
            'dec': '12', 'december': '12'
          };
          
          let monthNumber = null;
          
          // Check if it's a month name (full or short)
          if (monthNames[monthValue]) {
            monthNumber = monthNames[monthValue];
          }
          // Check if it's a month number (1-12)
          else if (/^(0?[1-9]|1[0-2])$/.test(monthValue)) {
            monthNumber = monthValue.padStart(2, '0');
          }
          
          // Apply the filter if we found a valid month
          if (monthNumber) {
            if (!craneExpiration.includes(`/${monthNumber}/`)) {
              return false;
            }
          }
        } catch (error) {
          console.error('Error filtering by month:', error);
          return false;
        }
      }

      // Year filter
      if (yearFilter) {
        try {
          const craneExpiration = convertExcelDate(crane.Expiration);
          if (!craneExpiration) return false;
          
          const yearValue = yearFilter.trim();
          
          // Check if it's a year (4 digits)
          if (/^\d{4}$/.test(yearValue)) {
            if (!craneExpiration.includes(`/${yearValue}`)) {
              return false;
            }
          }
        } catch (error) {
          console.error('Error filtering by year:', error);
          return false;
        }
      }
      
      // Search filtering
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
      const otherFieldMatch = (
        makeModel.includes(search) ||
        serialNumber.includes(search) ||
        year.includes(search) ||
        ton.includes(search)
      );
      
      if (otherFieldMatch) return true;
      
      // 5. Date searching - check if search term looks like a date
      if (search.includes('/') && search.length >= 8) {
        try {
          const searchDate = search.trim();
          const craneExpiration = convertExcelDate(crane.Expiration);
          
          // Check if the search date matches the crane's expiration date
          if (craneExpiration && craneExpiration.includes(searchDate)) {
            return true;
          }
          
          // Also check if the search date is contained within the expiration date
          if (craneExpiration && craneExpiration.includes(searchDate.substring(0, 5))) {
            return true;
          }
          
          // Check for year-only search (e.g., "2025")
          if (search.length === 4 && /^\d{4}$/.test(search)) {
            if (craneExpiration && craneExpiration.includes(search)) {
              return true;
            }
          }
        } catch (error) {
          // If date parsing fails, continue with other search criteria
        }
      }
      
      return false;
    })
    .sort((a, b) => {
      // First sort by active status (active cranes first)
      if (a.active !== b.active) {
        return a.active ? -1 : 1; // Active cranes come first
      }
      
      // Then sort by status order
      const order = { "OK": 1, "Near to Expire": 2, "Expired": 3, "Inactive": 4 };
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
      }
      
      // If same status, sort by expiration date (earliest first - ascending)
      try {
        const partsA = a.Expiration ? convertExcelDate(a.Expiration).split('/') : [];
        const partsB = b.Expiration ? convertExcelDate(b.Expiration).split('/') : [];
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

  // Pagination logic
  const totalPages = Math.ceil(filteredCranes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCranes = filteredCranes.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterValue, statusFilter, monthFilter, yearFilter]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

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
                    <div className="summary-item clickable" onClick={() => handleAlertClick("expired")} style={{cursor: 'pointer', transition: 'background-color 0.2s'}} onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                      <span className="summary-icon">🚨</span>
                      <span className="summary-text">{alertSummary.expired} Expired</span>
                    </div>
                    <div className="summary-item clickable" onClick={() => handleAlertClick("expiring")} style={{cursor: 'pointer', transition: 'background-color 0.2s'}} onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                      <span className="summary-icon">⚠️</span>
                      <span className="summary-text">{alertSummary.expiring} Expiring This Month</span>
                    </div>
                    <div className="summary-item clickable" onClick={() => handleAlertClick("ok")} style={{cursor: 'pointer', transition: 'background-color 0.2s'}} onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                      <span className="summary-icon">✅</span>
                      <span className="summary-text">{alertSummary.ok} OK</span>
                    </div>
                    <div className="summary-footer clickable" onClick={() => handleAlertClick("all")} style={{cursor: 'pointer', transition: 'background-color 0.2s'}} onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
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
              
              <button className="header-logout-btn" onClick={handleLogout}>
                🚪 Logout
              </button>
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
          
          
          {/* Filter Section */}
          <div className="filter-section">
            <div className="filter-container">
              <div className="filter-buttons">
                <div className="filter-input-group filter-column">
                  <span className="filter-label">Month:</span>
                  <input
                    type="text"
                    placeholder="Jan, Feb, Mar, 1, 2, 3..."
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="filter-input-small"
                    title="Enter month name (Jan, Feb, Mar) or number (1, 2, 3, etc.)"
                  />
                </div>
                <div className="filter-input-group filter-column">
                  <span className="filter-label">Year:</span>
                <input
                  type="text"
                    placeholder="2025, 2026..."
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="filter-input-small"
                    title="Enter year (2025, 2026, etc.)"
                  />
            </div>
                {(monthFilter || yearFilter) && (
                  <button
                    onClick={() => {
                      setMonthFilter('');
                      setYearFilter('');
                    }}
                    className="clear-all-btn"
                    title="Clear all filters"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Search and Action Controls */}
          <div className="search-controls">
            <div className="search-container">
              <div className="search-row">
                {/* Search Input */}
                <div className="search-input-container">
                <input
                  type="text"
                    placeholder="🔍 Search..."
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                    className="search-input-small"
                    title="Search by Unit #, Model, Serial, Year..."
                />
                {filterValue && (
                  <button
                    onClick={() => setFilterValue('')}
                      className="clear-search-btn"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
              </div>
              {(filterValue || monthFilter || yearFilter) && (
                <div className="search-help">
                  <small>
                    Showing {filteredCranes.length} of {cranes.length} cranes
                    {totalPages > 1 && (
                      <span style={{color: '#3b82f6'}}> • Page {currentPage} of {totalPages}</span>
                    )}
                    {filterValue && filterValue.length < 3 && filteredCranes.length > 10 && (
                      <span style={{color: '#ff9800'}}> • Tip: Type 3+ characters for better results</span>
                    )}
                    {filterValue && filterValue.length >= 3 && (
                      <span style={{color: '#4caf50'}}> • Search: "{filterValue}"</span>
                    )}
                    {monthFilter && (
                      <span style={{color: '#ffaa00'}}> • Month: {monthFilter}</span>
                    )}
                    {yearFilter && (
                      <span style={{color: '#ffaa00'}}> • Year: {yearFilter}</span>
                    )}
                  </small>
                </div>
              )}
            </div>
            <a 
    href="/add-crane" 
    target="_blank" 
    rel="noopener noreferrer" 
    className="btn btn-primary btn-wide"
  >
    ➕ Add New Crane
  </a>
            <button 
    onClick={handlePrintAllCranes}
    className="btn btn-secondary btn-wide"
  >
    📄 Print All Cranes
  </button>

            <button 
              className="btn btn-warning btn-wide" 
              onClick={handleTriggerAutoEmail}
              title="Manually trigger auto-email service for testing"
            >
              🔔 Trigger Auto-Email
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
            cranes={currentCranes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onEmailAlert={handleEmailAlert}
          />
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              <span>
                Showing {startIndex + 1} to {Math.min(endIndex, filteredCranes.length)} of {filteredCranes.length} cranes
              </span>
            </div>
            <div className="pagination-controls">
              <button 
                className="pagination-btn"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                title="Previous page"
              >
                ← Previous
              </button>
              
              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current page
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                        title={`Go to page ${page}`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return <span key={page} className="pagination-ellipsis">...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button 
                className="pagination-btn"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                title="Next page"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Modal removed - editing now opens in new tab */}
      </div>
    </div>

    {/* Email Management Modal */}
    {emailModalOpen && selectedCrane && (
      <EmailManagementModal
        crane={selectedCrane}
        onClose={() => {
          setEmailModalOpen(false);
          setSelectedCrane(null);
        }}
        onEmailUpdated={handleEmailUpdated}
      />
    )}
    </div>
  );
}
