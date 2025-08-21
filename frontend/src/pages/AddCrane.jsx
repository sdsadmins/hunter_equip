import React, { useState } from "react";
import API from "../api";

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await API.post("/cranes/add", form);
    onAdded();
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
      <input name="unit" placeholder="Unit #" onChange={handleChange} required />
      <input name="year" placeholder="Year" onChange={handleChange} required />
      <input name="makeModel" placeholder="Make & Model" onChange={handleChange} required />
      <input name="ton" placeholder="Ton" onChange={handleChange} required />
      <input name="serial" placeholder="Serial #" onChange={handleChange} required />
      <input type="date" name="expiration" onChange={handleChange} required />
      <select name="inUse" onChange={handleChange}>
        <option value="O">O (Active)</option>
        <option value="X">X (Inactive)</option>
      </select>
      <button type="submit">Add Crane</button>
    </form>
  );
}
