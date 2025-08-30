import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import config from "../config";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    if (!email) {
      setMessage("❌ Please enter your email address.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${config.API_URL}/api/auth/forgot-password`, {
        email: email
      });
      setMessage("✅ Password reset link has been sent to your email. Please check your inbox.");
      
      // Redirect to login page after a delay
      setTimeout(() => {
        navigate("/login");
      }, 3000);
      
    } catch (err) {
      console.error("Forgot password error:", err.response?.data || err);
      console.error("API URL used:", `${config.API_URL}/api/auth/forgot-password`);
      
      if (err.response?.status === 404) {
        setMessage("❌ This email is not registered with our system. Please check your email or register as a new user.");
      } else if (err.code === 'ERR_NETWORK') {
        setMessage("❌ Network error. Please check your connection.");
      } else {
        setMessage("❌ " + (err.response?.data?.message || "Failed to send reset email. Please try again."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Forgot Password</h2>
        <p style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />

        <button 
          type="submit" 
          style={styles.button}
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </button>

        {/* Back to Login Link */}
        <div style={styles.backToLoginContainer}>
          <button 
            type="button" 
            onClick={() => navigate("/login")}
            style={styles.backToLoginLink}
          >
            ← Back to Login
          </button>
        </div>

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
    marginBottom: "20px",
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
    fontSize: "16px",
    opacity: (props) => props.disabled ? 0.6 : 1
  },
  backToLoginContainer: {
    marginTop: "20px",
    textAlign: "center"
  },
  backToLoginLink: {
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
  }
};
