// src/pages/Login.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorType, setErrorType] = useState(""); // "not_registered" or "wrong_credentials"
  const navigate = useNavigate();

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Handle login submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

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

      setMessage("✅ Login successful! Redirecting to dashboard...");
      setTimeout(() => {
        navigate("/supervisor-dashboard");
      }, 1500);
    } catch (err) {
      console.error("Login error:", err.response?.data || err);
      
      // Use the specific error type from backend
      if (err.response?.data?.errorType === "not_registered") {
        setMessage("❌ You're not registered yet. Please register first.");
        setErrorType("not_registered");
      } else if (err.response?.data?.errorType === "wrong_credentials") {
        setMessage("❌ Email and password don't match. Please check your credentials.");
        setErrorType("wrong_credentials");
      } else {
        setMessage("❌ " + (err.response?.data?.msg || "Login failed"));
        setErrorType("");
      }
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Existing User Login</h2>
        
        {/* Email input */}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={styles.input}
        />

        {/* Password input */}
        <div style={styles.passwordContainer}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            style={styles.passwordInput}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>

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

        {message && <p style={styles.message}>{message}</p>}
        
        {/* Action buttons based on error type */}
        {errorType === "not_registered" && (
          <div style={styles.actionButtons}>
            <button 
              type="button" 
              onClick={() => navigate("/register")}
              style={styles.registerButton}
            >
              📝 Register Now
            </button>
            <button 
              type="button" 
              onClick={() => {
                setForm({ email: "", password: "" });
                setMessage("");
                setErrorType("");
              }}
              style={styles.tryAgainButton}
            >
              🔄 Try Different Email
            </button>
          </div>
        )}
        
        {errorType === "wrong_credentials" && (
          <div style={styles.actionButtons}>
            <button 
              type="button" 
              onClick={() => navigate("/forgot-password")}
              style={styles.forgotPasswordButton}
            >
              🔑 Forgot Password?
            </button>
            <button 
              type="button" 
              onClick={() => {
                setForm({ ...form, password: "" });
                setMessage("");
                setErrorType("");
              }}
              style={styles.tryAgainButton}
            >
              🔄 Try Again
            </button>
          </div>
        )}
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
    width: "380px",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  title: {
    color: "#ffcc00", // gold/yellow title
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
  passwordContainer: {
    width: "100%",
    position: "relative",
    marginBottom: "15px"
  },
  passwordInput: {
    width: "100%",
    padding: "10px",
    paddingRight: "40px",
    borderRadius: "5px",
    border: "1px solid #555",
    backgroundColor: "#333",
    color: "#fff",
    outline: "none"
  },
  eyeButton: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    color: "#ccc"
  },
  button: {
    backgroundColor: "#4CAF50",
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
  },
  message: {
    marginTop: "15px",
    textAlign: "center",
    color: "#fff"
  },
  actionButtons: {
    marginTop: "15px",
    display: "flex",
    gap: "10px",
    justifyContent: "center"
  },
  registerButton: {
    backgroundColor: "#4CAF50",
    color: "#fff",
    padding: "10px 15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    transition: "all 0.3s ease"
  },
  forgotPasswordButton: {
    backgroundColor: "#ff9800",
    color: "#fff",
    padding: "10px 15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    transition: "all 0.3s ease"
  },
  tryAgainButton: {
    backgroundColor: "#2196F3",
    color: "#fff",
    padding: "10px 15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    transition: "all 0.3s ease"
  }
};
