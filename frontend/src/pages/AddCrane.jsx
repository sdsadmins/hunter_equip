import React, { useState } from "react";
import API from "../api";
import axios from "axios";
import config from "../config";

export default function AddCrane({ onAdded }) {
  const [form, setForm] = useState({
    unit: "",
    year: "",
    makeModel: "",
    ton: "",
    serial: "",
    expiration: "",
    inUse: "O"
  });
  const [checkingUnit, setCheckingUnit] = useState(false);
  const [unitExists, setUnitExists] = useState(false);
  const [existingCrane, setExistingCrane] = useState(null);

  const handleChange = (e) => {
    let value = e.target.value;
    
    // For Unit # field, remove spaces and normalize
    if (e.target.name === "unit") {
      value = value.replace(/\s+/g, ''); // Remove all spaces
    }
    
    setForm({ ...form, [e.target.name]: value });
    
    // Check for duplicate Unit # when unit field changes
    if (e.target.name === "unit" && value.trim()) {
      checkUnitExists(value.trim());
    }
  };

  const checkUnitExists = async (unitNumber) => {
    if (!unitNumber) {
      setUnitExists(false);
      setExistingCrane(null);
      return;
    }
    
    setCheckingUnit(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }
      
      const response = await axios.get(`${config.API_URL}/api/cranes/check-unit/${unitNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.exists) {
        setUnitExists(true);
        setExistingCrane(response.data.crane);
      } else {
        setUnitExists(false);
        setExistingCrane(null);
      }
    } catch (error) {
      console.error("Error checking unit number:", error);
      setUnitExists(false);
      setExistingCrane(null);
    } finally {
      setCheckingUnit(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if Unit # already exists before submitting
    if (unitExists) {
      alert(`❌ Cannot add crane: Unit # "${form.unit}" already exists!\n\nExisting crane details:\n- Make & Model: ${existingCrane.makeModel}\n- Serial #: ${existingCrane.serial}\n- Year: ${existingCrane.year}\n\nPlease use a different Unit #.`);
      return;
    }
    
          try {
        // Map frontend field names to backend field names
        const craneData = {
          "Unit #": form.unit,
          "Year": form.year,
          "Make and Model": form.makeModel,
          "Ton": form.ton,
          "Serial #": form.serial,
          "Expiration": form.expiration,
          "Currently In Use": form.inUse,
          active: form.inUse === "O"
        };
        
        console.log("📤 Sending crane data:", craneData);
        await API.post("/cranes", craneData);
        alert("✅ Crane added successfully!");
        onAdded();
      } catch (error) {
      if (error.response?.data?.error === "Crane with this Unit # already exists") {
        alert(`❌ Error: ${error.response.data.error}\n\nExisting crane details:\n- Unit #: ${error.response.data.existingCrane.unitNumber}\n- Make & Model: ${error.response.data.existingCrane.makeModel}\n- Serial #: ${error.response.data.existingCrane.serial}`);
      } else {
        alert(`❌ Error adding crane: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
      <div style={{ marginBottom: 15 }}>
        <input 
          name="unit" 
          placeholder="Unit #" 
          onChange={handleChange} 
          required 
          style={{ 
            border: unitExists ? '2px solid #ff4444' : '1px solid #ccc',
            backgroundColor: unitExists ? '#fff5f5' : 'white'
          }}
        />
        {checkingUnit && <span style={{ marginLeft: 10, color: '#666' }}>🔍 Checking...</span>}
        {unitExists && existingCrane && (
          <div style={{ 
            marginTop: 5, 
            padding: 10, 
            backgroundColor: '#fff5f5', 
            border: '1px solid #ff4444', 
            borderRadius: 4,
            color: '#d32f2f'
          }}>
            ⚠️ Unit # "{form.unit}" already exists!<br/>
            Existing crane: {existingCrane.makeModel} (Serial: {existingCrane.serial}, Year: {existingCrane.year})
          </div>
        )}
      </div>
      
      <input name="year" placeholder="Year" onChange={handleChange} required />
      <input name="makeModel" placeholder="Make & Model" onChange={handleChange} required />
      <input name="ton" placeholder="Ton" onChange={handleChange} required />
      <input name="serial" placeholder="Serial #" onChange={handleChange} required />
      <input type="date" name="expiration" onChange={handleChange} required />
      <select name="inUse" onChange={handleChange}>
        <option value="O">O (Active)</option>
        <option value="X">X (Inactive)</option>
      </select>
      <button 
        type="submit" 
        disabled={unitExists}
        style={{ 
          backgroundColor: unitExists ? '#ccc' : '#007bff',
          cursor: unitExists ? 'not-allowed' : 'pointer'
        }}
      >
        {unitExists ? '❌ Unit # Already Exists' : 'Add Crane'}
      </button>
    </form>
  );
}
