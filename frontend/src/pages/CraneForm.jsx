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
    "active": true
  });

  // Helper function to convert Excel date to YYYY-MM-DD format for input
  const convertExcelDateToInputFormat = (dateValue) => {
    if (!dateValue) return "";
    
    try {
      let date;
      if (typeof dateValue === 'number' && dateValue > 1000) {
        // Excel serial number
        date = new Date((dateValue - 25569) * 86400 * 1000);
      } else if (typeof dateValue === 'string') {
        if (/^\d{5,}$/.test(dateValue)) {
          // String Excel serial number
          date = new Date((parseInt(dateValue) - 25569) * 86400 * 1000);
        } else if (dateValue.includes('/')) {
          // DD/MM/YYYY format
          const parts = dateValue.split('/');
          if (parts.length === 3) {
            date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          } else {
            date = new Date(dateValue);
          }
        } else {
          date = new Date(dateValue);
        }
      } else {
        date = new Date(dateValue);
      }
      
      // Format as YYYY-MM-DD for input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Date conversion error:", error);
      return "";
    }
  };

  // Helper function to convert YYYY-MM-DD to DD/MM/YYYY for storage
  const convertInputDateToStorageFormat = (inputDate) => {
    if (!inputDate) return "";
    try {
      const date = new Date(inputDate);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Date conversion error:", error);
      return inputDate;
    }
  };

  useEffect(() => {
    if (crane) {
      // Convert the crane data for editing
      const editForm = {
        "Unit #": crane["Unit #"] || "",
        "Year": crane["Year"] || "",
        "Make and Model": crane["Make and Model"] || "",
        "Ton": crane["Ton"] || "",
        "Serial #": crane["Serial #"] || "",
        "Expiration": convertExcelDateToInputFormat(crane["Expiration"]),
        "Currently In Use": crane["Currently In Use"] || "O",
        "active": crane.active !== undefined ? Boolean(crane.active) : true
      };
      
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
        "active": true
      });
    }
  }, [crane]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
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
            <label htmlFor="unit">Unit # *</label>
            <input
              id="unit"
              name="Unit #"
              type="text"
              placeholder="e.g., C-157"
              value={form["Unit #"]}
              onChange={handleChange}
              required
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
            <label htmlFor="expiration">Expiration Date</label>
            <input
              id="expiration"
              name="Expiration"
              type="date"
              value={form["Expiration"]}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
            />
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
