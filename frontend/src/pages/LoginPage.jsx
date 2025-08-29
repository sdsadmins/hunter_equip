// src/pages/Login.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/auth/login", {
        email,
        password
      });

      // Store token + user details
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user.id);
      localStorage.setItem("userRole", res.data.user.role);

      navigate("/supervisor-dashboard");
    } catch (err) {
      alert(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.form}>
        <h2 style={styles.title}>Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Login
        </button>
        
        {/* Forgot Password Link */}
        <div style={styles.forgotPasswordContainer}>
          <button 
            type="button" 
            onClick={() => navigate("/forgot-password")}
            style={styles.forgotPasswordLink}
          >
            Forgot Password?
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    backgroundColor: "#1a1a1a", // dark background
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  form: {
    backgroundColor: "#2a2a2a",
    padding: "30px",
    borderRadius: "10px",
    width: "300px",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  title: {
    color: "#ffcc00", // gold title
    marginBottom: "20px"
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "5px",
    border: "1px solid #555",
    backgroundColor: "#333",
    color: "#fff",
    outline: "none"
  },
  button: {
    backgroundColor: "#ff9800",
    color: "#fff",
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    width: "100%",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px"
  },
  forgotPasswordContainer: {
    marginTop: "15px",
    textAlign: "center"
  },
  forgotPasswordLink: {
    background: "none",
    border: "none",
    color: "#ffcc00",
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: "14px"
  }
};
