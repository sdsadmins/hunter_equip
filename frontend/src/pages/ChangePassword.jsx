import React, { useState } from "react";
import API from "../api";

export default function ChangePassword({ username }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/change-password", { username, oldPassword, newPassword });
      setMessage("Password updated successfully");
    } catch {
      setMessage("Error updating password");
    }
  };

  return (
    <form onSubmit={handleChangePassword} style={{ marginTop: 20 }}>
      <input
        type="password"
        placeholder="Old Password"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      <button type="submit">Change Password</button>
      {message && <p>{message}</p>}
    </form>
  );
}
