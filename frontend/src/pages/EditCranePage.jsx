import React, { useState, useEffect } from "react";
import axios from "axios";
import AddEditCraneModal from "./AddEditCraneModal";

export default function EditCranePage() {
  const [crane, setCrane] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get crane data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const craneData = urlParams.get('data');

    if (craneData) {
      try {
        const parsedCrane = JSON.parse(decodeURIComponent(craneData));
        setCrane(parsedCrane);
      } catch (error) {
        console.error("Error parsing crane data:", error);
        alert("❌ Error loading crane data. Please try again.");
        window.close();
      }
    } else {
      alert("❌ No crane data provided.");
      window.close();
    }
    setLoading(false);
  }, []);

  const handleSaveCrane = async (craneData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You are not logged in. Please log in again.");
        return;
      }

      // Update existing crane
      await axios.put(`/api/cranes/${crane._id}`, craneData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("✅ Crane updated successfully!");
      // 🔄 Optionally notify opener window (SupervisorDashboard) to refresh
      if (window.opener) {
        window.opener.location.reload();
      }
      window.close(); // close tab after success
    } catch (error) {
      console.error("Error updating crane:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to update crane. Please try again.";
      alert(`❌ Error: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Loading crane data...</h2>
      </div>
    );
  }

  if (!crane) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>❌ Error: No crane data found</h2>
        <button onClick={() => window.close()}>Close Tab</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>✏️ Edit Crane - {crane["Unit #"]}</h2>
      <AddEditCraneModal
        crane={crane}           // pass the crane data to edit
        onSave={handleSaveCrane} // ✅ real API update
        onClose={() => window.close()}
      />
    </div>
  );
}

