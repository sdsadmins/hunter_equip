import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import config from "../config";

export default function ResetPassword() {
  const [form, setForm] = useState({
    password: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  useEffect(() => {
    // Validate the reset token when component mounts
    if (token) {
      validateResetToken();
    } else {
      setMessage("❌ Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const validateResetToken = async () => {
    try {
      const res = await axios.get(`${config.API_URL}/api/auth/validate-reset-token?token=${token}`);
      setIsValidToken(true);
    } catch (err) {
      console.error("Token validation error:", err);
      setIsValidToken(false);
      setMessage("❌ Invalid or expired reset token. Please request a new password reset.");
    }
  };

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
    setIsLoading(true);

    if (!isValidToken) {
      setMessage("❌ Invalid reset link. Please request a new password reset.");
      setIsLoading(false);
      return;
    }

    // Validate password before submission
    if (!validatePassword(form.password)) {
      setMessage("❌ Please ensure your password meets all requirements.");
      setIsLoading(false);
      return;
    }

    // Check if passwords match
    if (form.password !== form.confirmPassword) {
      setMessage("❌ Passwords do not match. Please try again.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${config.API_URL}/api/auth/reset-password`, {
        token: token,
        password: form.password
      });
      
      setMessage("✅ Password reset successful! Redirecting to login...");
      
      // Redirect to login page after a delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (err) {
      console.error("Reset password error:", err.response?.data || err);
      setMessage("❌ " + (err.response?.data?.message || "Failed to reset password. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.form}>
          <h2 style={styles.title}>Invalid Reset Link</h2>
          <p style={styles.message}>❌ Invalid reset link. Please request a new password reset.</p>
          <button 
            onClick={() => navigate("/forgot-password")}
            style={styles.button}
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Reset Password</h2>
        <p style={styles.subtitle}>
          Enter your new password below.
        </p>

        <div style={styles.passwordContainer}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="New Password"
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
            placeholder="Confirm New Password"
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

        <button 
          type="submit" 
          style={styles.button}
          disabled={isLoading || !isValidToken}
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </button>

        {message && <p style={styles.message}>{message}</p>}
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
    marginBottom: "10px"
  },
  subtitle: {
    color: "#ccc",
    fontSize: "14px",
    textAlign: "center",
    marginBottom: "20px",
    lineHeight: "1.4"
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
  message: {
    marginTop: "15px",
    textAlign: "center",
    color: "#fff"
  }
};
