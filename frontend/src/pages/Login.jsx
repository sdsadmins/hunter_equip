// src/pages/Login.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle login submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email: form.email,
        password: form.password,
      });

      // Store user details in localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user.id);
      localStorage.setItem("email", res.data.user.email);
      localStorage.setItem("name", res.data.user.name);

      alert(`Welcome ${res.data.user.name}!`);
      navigate("/supervisor-dashboard"); // Redirect to dashboard
    } catch (err) {
      alert(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        {/* Name input */}
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          required
          style={{ display: "block", marginBottom: "10px", width: "100%", padding: "8px" }}
        />

        {/* Email input */}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{ display: "block", marginBottom: "10px", width: "100%", padding: "8px" }}
        />

        {/* Password input */}
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={{ display: "block", marginBottom: "10px", width: "100%", padding: "8px" }}
        />

        <button
          type="submit"
          style={{
            backgroundColor: "#4CAF50",
            color: "white",
            padding: "10px",
            width: "100%",
            border: "none",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}
