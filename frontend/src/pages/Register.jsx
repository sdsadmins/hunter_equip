import React, { useState } from "react";
import axios from "axios";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await axios.post("http://localhost:5000/api/auth/register", form);
      setMessage("✅ Registration successful! You can now log in.");
    } catch (err) {
      console.error("Registration error:", err.response?.data || err);
      setMessage("❌ Registration failed. Please check your details.");
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

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <button type="submit" style={styles.button}>
          Register
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
    width: "320px",
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
