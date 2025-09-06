import React from "react";
import axios from "axios";
import CraneForm from "./CraneForm";
import config from "../config";

export default function AddCranePage() {
  const showSuccessMessage = (message) => {
    // Create a success message overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;
    
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
      background: linear-gradient(135deg, #4CAF50, #45a049);
      color: white;
      padding: 30px 40px;
      border-radius: 15px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      font-size: 18px;
      font-weight: 600;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;
    
    messageBox.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 10px;">✅</div>
      <div>${message}</div>
      <div style="font-size: 14px; margin-top: 10px; opacity: 0.9;">Redirecting to dashboard...</div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    overlay.appendChild(messageBox);
    document.body.appendChild(overlay);
    
    // Remove overlay after 2 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 2000);
  };

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

      // Show success message and redirect
      showSuccessMessage("New crane added successfully!");
      
      // Redirect to supervisor dashboard after 2 seconds
      setTimeout(() => {
        // Always redirect parent window to supervisor dashboard and close current tab
        if (window.opener) {
          window.opener.location.href = "/supervisor-dashboard";
        }
        window.close();
      }, 2000);
    } catch (error) {
      console.error("Error saving crane:", error);
      console.error("API URL used:", `${config.API_URL}/api/cranes`);
      
      if (error.response?.status === 401) {
        alert("❌ Unauthorized. Please login again.");
        window.close();
      } else if (error.response?.status === 404) {
        alert("❌ Server not found. Please contact administrator.");
      } else if (error.code === 'ERR_NETWORK') {
        alert("❌ Network error. Please check your connection.");
      } else {
        const errorMessage = error.response?.data?.error || "Failed to save crane. Please try again.";
        alert(`❌ Error: ${errorMessage}`);
      }
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 200px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <CraneForm
        crane={null}                // start with empty form
        onSave={handleSaveCrane}    // ✅ real API save
        onClose={() => window.close()}
      />
    </div>
  );
}
