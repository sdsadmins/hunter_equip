import React from "react";
import axios from "axios";
import AddEditCraneModal from "./AddEditCraneModal";
import config from "../config";

export default function AddCranePage() {
  const handleSaveCrane = async (craneData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You are not logged in. Please log in again.");
        return;
      }

      // ✅ Call backend to add new crane
      await axios.post(`${config.API_URL}/api/cranes`, craneData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("✅ New crane added successfully!");
      // 🔄 Optionally notify opener window (SupervisorDashboard) to refresh
      if (window.opener) {
        window.opener.location.reload();
      }
      window.close(); // close tab after success
    } catch (error) {
      console.error("Error saving crane:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to save crane. Please try again.";
      alert(`❌ Error: ${errorMessage}`);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>➕ Add New Crane</h2>
      <AddEditCraneModal
        crane={null}                // start with empty form
        onSave={handleSaveCrane}    // ✅ real API save
        onClose={() => window.close()}
      />
    </div>
  );
}
