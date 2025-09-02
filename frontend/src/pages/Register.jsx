import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import config from "../config";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [message, setMessage] = useState("");
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  const [passwordMatch, setPasswordMatch] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDuplicateUser, setIsDuplicateUser] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password) => {
    const validations = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordValidation(validations);
    return Object.values(validations).every(Boolean);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    if (name === "password") {
      validatePassword(value);
      // Check if passwords match when password changes
      if (form.confirmPassword) {
        setPasswordMatch(value === form.confirmPassword);
      }
    }
    
    if (name === "confirmPassword") {
      setPasswordMatch(value === form.password);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Validate password before submission
    if (!validatePassword(form.password)) {
      setMessage("❌ Please ensure your password meets all requirements.");
      return;
    }

    // Check if passwords match
    if (form.password !== form.confirmPassword) {
      setMessage("❌ Passwords do not match. Please try again.");
      return;
    }

    try {
      const res = await axios.post(`${config.API_URL}/api/auth/register`, {
        name: form.name,
        email: form.email,
        password: form.password
      });
      
      // Store token + user details (same as login)
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user.id);
      localStorage.setItem("userRole", "supervisor"); // New users are supervisors
      localStorage.setItem("email", res.data.user.email);
      localStorage.setItem("name", res.data.user.name);

      // Show success message briefly then redirect
      setMessage("✅ Registration successful! Redirecting to dashboard...");
      
      // Redirect to supervisor dashboard after a short delay
      setTimeout(() => {
        navigate("/supervisor-dashboard");
      }, 1500);
      
    } catch (err) {
      console.error("Registration error:", err.response?.data || err);
              console.error("API URL used:", `${config.API_URL}/api/auth/register`);
      console.error("Response status:", err.response?.status);
      console.error("Response data:", err.response?.data);
      
      if (err.response?.status === 404) {
        setMessage("❌ Server not found. Please contact administrator.");
        setIsDuplicateUser(false);
      } else if (err.code === 'ERR_NETWORK') {
        setMessage("❌ Network error. Please check your connection.");
        setIsDuplicateUser(false);
      } else if (err.response?.status === 409) {
        setMessage("❌ User already exists with this email address. Please go to login or use a different email.");
        setIsDuplicateUser(true);
      } else if (err.response?.data?.error) {
        setMessage(`❌ ${err.response.data.error}`);
        setIsDuplicateUser(false);
      } else if (err.response?.data?.msg) {
        setMessage(`❌ ${err.response.data.msg}`);
        setIsDuplicateUser(false);
      } else if (err.message && err.message.includes("already exists")) {
        setMessage("❌ User already exists with this email address. Please go to login or use a different email.");
        setIsDuplicateUser(true);
      } else {
        setMessage("❌ Registration failed. Please check your details.");
        setIsDuplicateUser(false);
      }
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Register</h2>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={styles.input}
        />

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

        <div style={styles.passwordContainer}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            style={{
              ...styles.passwordInput,
              borderColor: form.confirmPassword ? (passwordMatch ? "#4CAF50" : "#ff6b6b") : "#555"
            }}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeButton}
          >
            {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>

        {/* Password match indicator */}
        {form.confirmPassword && (
          <div style={styles.matchIndicator}>
            <span style={{ color: passwordMatch ? "#4CAF50" : "#ff6b6b" }}>
              {passwordMatch ? "✓" : "✗"}
            </span>
            {passwordMatch ? "Passwords match" : "Passwords do not match"}
          </div>
        )}

        {/* Password validation indicators */}
        {form.password && (
          <div style={styles.validationContainer}>
            <h4 style={styles.validationTitle}>Password Requirements:</h4>
            <div style={styles.validationItem}>
              <span style={{ color: passwordValidation.length ? "#4CAF50" : "#ff6b6b" }}>
                {passwordValidation.length ? "✓" : "✗"}
              </span>
              At least 8 characters
            </div>
            <div style={styles.validationItem}>
              <span style={{ color: passwordValidation.uppercase ? "#4CAF50" : "#ff6b6b" }}>
                {passwordValidation.uppercase ? "✓" : "✗"}
              </span>
              One uppercase letter (A-Z)
            </div>
            <div style={styles.validationItem}>
              <span style={{ color: passwordValidation.lowercase ? "#4CAF50" : "#ff6b6b" }}>
                {passwordValidation.lowercase ? "✓" : "✗"}
              </span>
              One lowercase letter (a-z)
            </div>
            <div style={styles.validationItem}>
              <span style={{ color: passwordValidation.number ? "#4CAF50" : "#ff6b6b" }}>
                {passwordValidation.number ? "✓" : "✗"}
              </span>
              One number (0-9)
            </div>
            <div style={styles.validationItem}>
              <span style={{ color: passwordValidation.special ? "#4CAF50" : "#ff6b6b" }}>
                {passwordValidation.special ? "✓" : "✗"}
              </span>
              One special character (!@#$%^&*)
            </div>
          </div>
        )}

        <button type="submit" style={styles.button}>
          Register
        </button>

        {/* Forgot Password Link */}
        <div style={styles.forgotPasswordContainer}>
          <span style={styles.forgotPasswordText}>Already have an account? </span>
          <button 
            type="button" 
            onClick={() => navigate("/forgot-password")}
            style={styles.forgotPasswordLink}
          >
            Forgot Password?
          </button>
        </div>

        {message && <p style={styles.message}>{message}</p>}
        
        {isDuplicateUser && (
          <div style={styles.duplicateUserActions}>
            <button 
              type="button" 
              onClick={() => navigate("/login")}
              style={styles.loginButton}
            >
              🔐 Go to Login
            </button>
            <button 
              type="button" 
              onClick={() => {
                setForm({ ...form, email: "" });
                setMessage("");
                setIsDuplicateUser(false);
              }}
              style={styles.tryAgainButton}
            >
              ✏️ Try Different Email
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
  matchIndicator: {
    width: "100%",
    marginBottom: "15px",
    padding: "8px",
    backgroundColor: "#333",
    borderRadius: "5px",
    border: "1px solid #555",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#fff"
  },
  validationContainer: {
    width: "100%",
    marginBottom: "15px",
    padding: "10px",
    backgroundColor: "#333",
    borderRadius: "5px",
    border: "1px solid #555"
  },
  validationTitle: {
    color: "#ffcc00",
    margin: "0 0 10px 0",
    fontSize: "14px"
  },
  validationItem: {
    color: "#fff",
    fontSize: "12px",
    marginBottom: "5px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
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
  forgotPasswordText: {
    color: "#ccc",
    fontSize: "14px"
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
  duplicateUserActions: {
    marginTop: "15px",
    display: "flex",
    gap: "10px",
    justifyContent: "center"
  },
  loginButton: {
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
  tryAgainButton: {
    backgroundColor: "#ff9800",
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
