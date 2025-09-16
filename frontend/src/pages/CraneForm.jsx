import React, { useState, useEffect } from "react";
import "./CraneForm.css";

export default function CraneForm({ crane, onSave, onClose }) {
  const [form, setForm] = useState({
    "Unit #": "",
    "Year": "",
    "Make and Model": "",
    "Ton": "",
    "Serial #": "",
    "Expiration": "",
    "Currently In Use": "O",
    "active": true,
    alertEmail: ""
  });

  // SMART date normalization - detects DD/MM/YYYY and converts to MM/DD/YYYY
  const normalizeDate = (dateValue) => {
    console.log("🔍 NORMALIZE DATE - Input:", dateValue, "Type:", typeof dateValue);
    if (!dateValue) return "";

    // If already in MM/DD/YYYY format, keep it
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
      const [p1, p2, year] = dateValue.split("/");
      const month = parseInt(p1, 10);
      const day = parseInt(p2, 10);

      console.log("🔍 NORMALIZE - Parsed parts:", { p1, p2, year, month, day });

      // If p1 > 12, it must be DD/MM/YYYY → swap to MM/DD/YYYY
      if (month > 12 && day <= 12) {
        const normalized = `${p2.padStart(2, "0")}/${p1.padStart(2, "0")}/${year}`;
        console.log("🔄 NORMALIZE - DD/MM/YYYY detected, swapping to MM/DD/YYYY:", dateValue, "→", normalized);
        return normalized;
      }
      
      console.log("✅ NORMALIZE - Already valid MM/DD/YYYY:", dateValue);
      return dateValue; // already valid MM/DD/YYYY
    }

    // Fallback parse for other formats
    console.log("⚠️ NORMALIZE - Not MM/DD/YYYY format, attempting fallback parse...");
    try {
      let date;
      if (typeof dateValue === 'number' && dateValue > 1000) {
        // Excel serial number
        console.log("🔍 NORMALIZE - Processing as Excel serial number");
        date = new Date((dateValue - 25569) * 86400 * 1000);
      } else {
        date = new Date(dateValue);
      }
      
      if (isNaN(date.getTime())) {
        console.log("❌ NORMALIZE - Invalid date");
        return "";
      }

      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      const result = `${month}/${day}/${year}`;
      console.log("🔄 NORMALIZE - Fallback converted to MM/DD/YYYY:", result);
      return result;
    } catch (error) {
      console.error("NORMALIZE - Date conversion error:", error);
      return "";
    }
  };

  // FOOLPROOF storage format - NEVER changes MM/DD/YYYY dates
  const convertInputDateToStorageFormat = (inputDate) => {
    console.log("🔍 FOOLPROOF STORAGE - Input:", inputDate);
    if (!inputDate) return "";
    
    // CRITICAL: If already in MM/DD/YYYY format, return EXACTLY as-is - NO CONVERSION EVER
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(inputDate)) {
      console.log("✅ FOOLPROOF STORAGE - MM/DD/YYYY format detected, returning EXACTLY as-is:", inputDate);
      console.log("✅ FOOLPROOF STORAGE - NO CONVERSION - Date will remain stable:", inputDate);
      
      // Additional validation
      const parts = inputDate.split('/');
      const month = parseInt(parts[0]);
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
        console.log("✅ FOOLPROOF STORAGE - Valid MM/DD/YYYY date confirmed:", inputDate);
        return inputDate; // ABSOLUTELY NO CHANGES
      } else {
        console.log("⚠️ FOOLPROOF STORAGE - Invalid date detected, but keeping format:", inputDate);
        return inputDate; // Still return as-is to maintain format
      }
    }
    
    // Only convert if it's NOT in MM/DD/YYYY format
    console.log("⚠️ FOOLPROOF STORAGE - NOT MM/DD/YYYY format, attempting conversion...");
    try {
      const date = new Date(inputDate);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
      }
      
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      const result = `${month}/${day}/${year}`;
      console.log("🔄 FOOLPROOF STORAGE - Converted to MM/DD/YYYY:", result);
      return result;
    } catch (error) {
      console.error("FOOLPROOF STORAGE - Conversion error:", error);
      return inputDate;
    }
  };
  
  useEffect(() => {
    if (crane) {
      // SMART date handling - normalize DD/MM/YYYY to MM/DD/YYYY
      const originalExpiration = crane["Expiration"];
      const normalizedExpiration = normalizeDate(originalExpiration);
      
      console.log("🔍 SMART EDIT - Original expiration:", originalExpiration);
      console.log("🔍 SMART EDIT - Normalized expiration:", normalizedExpiration);
      console.log("🔍 SMART EDIT - Crane Unit #:", crane["Unit #"]);
      console.log("🔍 SMART EDIT - Date changed?", originalExpiration !== normalizedExpiration);
      
      if (originalExpiration !== normalizedExpiration) {
        console.log("🔄 SMART EDIT - Date was normalized:", originalExpiration, "→", normalizedExpiration);
      } else {
        console.log("✅ SMART EDIT - Date was already in correct format:", originalExpiration);
      }
      
      const editForm = {
        "Unit #": crane["Unit #"] || "",
        "Year": crane["Year"] || "",
        "Make and Model": crane["Make and Model"] || "",
        "Ton": crane["Ton"] || "",
        "Serial #": crane["Serial #"] || "",
        "Expiration": normalizedExpiration,
        "Currently In Use": crane["Currently In Use"] || "O",
        "active": crane.active !== undefined ? Boolean(crane.active) : true,
        alertEmail: crane.alertEmail || ""
      };
      
      console.log("🔍 ULTRA-STABLE EDIT - Final form data:", editForm);
      setForm(editForm);
    } else {
      // Reset form for new crane
      setForm({
        "Unit #": "",
        "Year": "",
        "Make and Model": "",
        "Ton": "",
        "Serial #": "",
        "Expiration": "",
        "Currently In Use": "O",
        "active": true,
        alertEmail: ""
      });
    }
  }, [crane]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for expiration date formatting
    if (name === "Expiration" && type === "text") {
      // Remove any non-numeric characters except forward slashes
      let formattedValue = value.replace(/[^\d/]/g, '');
      
      // Auto-format as MM/DD/YYYY
      if (formattedValue.length >= 2 && !formattedValue.includes('/')) {
        formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2);
      }
      if (formattedValue.length >= 5 && formattedValue.split('/').length === 2) {
        const parts = formattedValue.split('/');
        if (parts[1].length >= 2) {
          formattedValue = parts[0] + '/' + parts[1].substring(0, 2) + '/' + parts[1].substring(2);
        }
      }
      
      // Limit to MM/DD/YYYY format (10 characters)
      if (formattedValue.length > 10) {
        formattedValue = formattedValue.substring(0, 10);
      }
      
      // Prevent invalid characters and ensure proper format
      const parts = formattedValue.split('/');
      if (parts.length >= 1 && parts[0].length === 2) {
        const month = parseInt(parts[0]);
        if (month > 12) {
          // If month > 12, it might be DD/MM format, so don't auto-correct
          // Let user decide or show error on submit
        }
      }
      
      setForm(prev => ({
        ...prev,
        [name]: formattedValue
      }));
      return;
    }
    
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!form["Unit #"] || !form["Make and Model"]) {
      alert("Unit # and Make & Model are required fields.");
      return;
    }

    // Validate date format if provided
    if (form["Expiration"]) {
      const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!datePattern.test(form["Expiration"])) {
        alert("❌ Invalid date format! Please use MM/DD/YYYY format (e.g., 12/31/2025)");
        return;
      }
      
      // Additional date validation
      const parts = form["Expiration"].split('/');
      const month = parseInt(parts[0]);
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      
      if (month < 1 || month > 12) {
        alert("❌ Invalid month! Month must be between 01 and 12.");
        return;
      }
      
      if (day < 1 || day > 31) {
        alert("❌ Invalid day! Day must be between 01 and 31.");
        return;
      }
      
      if (year < 1900 || year > 2100) {
        alert("❌ Invalid year! Year must be between 1900 and 2100.");
        return;
      }
      
      // Check if date is valid (e.g., not 02/30/2025)
      const testDate = new Date(year, month - 1, day);
      if (testDate.getMonth() !== month - 1 || testDate.getDate() !== day || testDate.getFullYear() !== year) {
        alert("❌ Invalid date! Please check the date (e.g., February doesn't have 30 days).");
        return;
      }
    }

    // Convert date format for storage and ensure active is boolean
    const craneData = {
      ...form,
      "Expiration": convertInputDateToStorageFormat(form["Expiration"]),
      active: Boolean(form.active)
    };

    onSave(craneData);
  };

  return (
    <div className="crane-form-container">
      <div className="crane-form-content">
        <div className="crane-form-header">
          <h2>{crane ? "✏️ Edit Crane" : "➕ Add New Crane"}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="crane-form">
          <div className="form-group">
            <label htmlFor="unit">
              Unit # * 
              {crane && <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '8px' }}>(Read-only)</span>}
            </label>
            <input
              id="unit"
              name="Unit #"
              type="text"
              placeholder="e.g., C-157"
              value={form["Unit #"]}
              onChange={handleChange}
              required
             
              style={{ 
                border: '1px solid #ccc',
                backgroundColor: crane ? '#f8f9fa' : '#e8f5e8',
                color: crane ? '#495057' : '#2c5aa0',
                fontWeight: '600',
             
              }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="year">Year</label>
            <input
              id="year"
              name="Year"
              type="number"
              placeholder="e.g., 2011"
              value={form["Year"]}
              onChange={handleChange}
              min="1900"
              max="2030"
            />
          </div>

          <div className="form-group">
            <label htmlFor="makeModel">Make & Model *</label>
            <input
              id="makeModel"
              name="Make and Model"
              type="text"
              placeholder="e.g., TADANO GR1000XL"
              value={form["Make and Model"]}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="ton">Ton</label>
            <input
              id="ton"
              name="Ton"
              type="text"
              placeholder="e.g., 100 TON"
              value={form["Ton"]}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="serial">Serial #</label>
            <input
              id="serial"
              name="Serial #"
              type="text"
              placeholder="e.g., 547285"
              value={form["Serial #"]}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="expiration">Expiration Date (MM/DD/YYYY)</label>
            <input
              id="expiration"
              name="Expiration"
              type="text"
              placeholder="MM/DD/YYYY"
              value={form["Expiration"]}
              onChange={handleChange}
              pattern="\d{2}/\d{2}/\d{4}"
              title="Please enter date in MM/DD/YYYY format"
              style={{
                border: '2px solid #007bff',
                backgroundColor: '#ffffff',
                color: '#000000',
                fontSize: '16px',
                padding: '8px 12px',
                borderRadius: '4px'
              }}
            />
            <small style={{ color: '#666', fontSize: '0.8em', display: 'block', marginTop: '4px' }}>
              ✅ Format: MM/DD/YYYY (e.g., 12/31/2025) - FIXED VERSION
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="inUse">Currently In Use</label>
            <select
              id="inUse"
              name="Currently In Use"
              value={form["Currently In Use"]}
              onChange={handleChange}
            >
              <option value="O">O (Active)</option>
              <option value="X">X (Inactive)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="alertEmail">Alert Email</label>
            <input
              id="alertEmail"
              name="alertEmail"
              type="email"
              placeholder="e.g., operator@company.com"
              value={form.alertEmail}
              onChange={handleChange}
              style={{ 
                border: '1px solid #ccc',
                backgroundColor: '#f8f9fa',
                color: '#495057'
              }}
            />
            <small style={{ color: '#666', fontSize: '0.8em' }}>
              Optional: Email address for sending expiration alerts
            </small>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                name="active"
                type="checkbox"
                checked={form.active}
                onChange={handleChange}
              />
              Active Status
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn">
              {crane ? "💾 Update Crane" : "➕ Add Crane"}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              ❌ Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}