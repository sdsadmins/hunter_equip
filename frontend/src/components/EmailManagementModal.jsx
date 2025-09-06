import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import "./EmailManagementModal.css";

export default function EmailManagementModal({ crane: initialCrane, onClose, onEmailUpdated }) {
  const [crane, setCrane] = useState(initialCrane);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [action, setAction] = useState(""); // "add", "edit", or "send"
  const [showEmailInput, setShowEmailInput] = useState(false);

  useEffect(() => {
    if (initialCrane && initialCrane.alertEmail && initialCrane.alertEmail.trim()) {
      setCrane(initialCrane);
      setEmail(initialCrane.alertEmail);
      setAction("edit");
      setShowEmailInput(false);
    } else {
      setCrane(initialCrane);
      setEmail("");
      setAction("add");
      setShowEmailInput(true);
    }
  }, [initialCrane]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage("Please enter a valid email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage("Please enter a valid email format");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("❌ You are not logged in. Please login first.");
        return;
      }

      console.log("🔍 Submitting email:", email.trim());
      console.log("🔍 Crane ID:", crane._id);
      console.log("🔍 Action:", action);

      if (action === "add" || action === "edit") {
        // Add or update email
        const response = await axios.post(
          `${config.API_URL}/api/cranes/${crane._id}/email`,
          { email: email.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("✅ Email response:", response.data);
        console.log("✅ Email updated successfully:", response.data);
        setMessage(`✅ ${response.data.message}`);
        
        // Update local crane state
        const updatedCrane = { 
          ...crane, 
          alertEmail: email.trim(),
          id: crane._id,  // Ensure ID is properly set
          _id: crane._id  // Ensure _id is properly set
        };
        setCrane(updatedCrane);
        setAction("edit");
        
        // Force a small delay to ensure state is updated before calling callback
        setTimeout(() => {
          if (onEmailUpdated) {
            console.log("🔍 Calling onEmailUpdated with:", updatedCrane);
            onEmailUpdated(updatedCrane);
          }
        }, 100);
      }
    } catch (error) {
      console.error("❌ Error managing email:", error);
      console.error("❌ Error response:", error.response?.data);
      setMessage(`❌ ${error.response?.data?.error || "Failed to manage email"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAlert = async () => {
    const emailToSend = email.trim() || crane.alertEmail;
    
    if (!emailToSend) {
      setMessage("❌ No email configured for this crane");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("❌ You are not logged in. Please login first.");
        return;
      }

      console.log("🔍 Sending alert to:", emailToSend);
      console.log("🔍 Crane ID:", crane._id);

      const response = await axios.post(
        `${config.API_URL}/api/cranes/${crane._id}/send-alert`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Alert response:", response.data);
      setMessage(`✅ Alert sent successfully to ${emailToSend}!`);
    } catch (error) {
      console.error("❌ Error sending alert:", error);
      console.error("❌ Error response:", error.response?.data);
      setMessage(`❌ ${error.response?.data?.error || "Failed to send alert"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!email.trim()) {
      setMessage("❌ Please enter a valid email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage("❌ Please enter a valid email format");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("❌ You are not logged in. Please login first.");
        return;
      }

      console.log("🔍 Saving email:", email.trim());
      console.log("🔍 Crane ID:", crane._id);

      // Save the email to the database
      const response = await axios.post(
        `${config.API_URL}/api/cranes/${crane._id}/email`,
        { email: email.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Save email response:", response.data);
      setMessage(`✅ Email saved successfully!`);
      
      // Update the crane object with the new email
      const updatedCrane = { 
        ...crane, 
        alertEmail: email.trim(),
        id: crane._id,  // Ensure ID is properly set
        _id: crane._id  // Ensure _id is properly set
      };
      
      // Update the local crane state to reflect the new email
      setCrane(updatedCrane);
      
      // Update the action to edit mode
      setAction("edit");
      setShowEmailInput(false);
      
      // Force a small delay to ensure state is updated before calling callback
      setTimeout(() => {
        if (onEmailUpdated) {
          console.log("🔍 Calling onEmailUpdated with saved email:", updatedCrane);
          onEmailUpdated(updatedCrane);
        }
      }, 100);
      
      // Update the local email state
      setEmail(email.trim());
      
    } catch (error) {
      console.error("❌ Error saving email:", error);
      console.error("❌ Error response:", error.response?.data);
      setMessage(`❌ ${error.response?.data?.error || "Failed to save email"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClick = () => {
    setShowEmailInput(true);
  };

  const handleRemoveEmail = async () => {
    if (!crane.alertEmail) {
      setMessage("❌ No email to remove");
      return;
    }

    if (!window.confirm(`Are you sure you want to remove the email for crane ${crane["Unit #"]}?`)) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("❌ You are not logged in. Please login first.");
        return;
      }

      console.log("🔍 Removing email for crane:", crane["Unit #"]);
      console.log("🔍 Crane ID:", crane._id);

      const response = await axios.post(
        `${config.API_URL}/api/cranes/${crane._id}/email`,
        { email: "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Remove email response:", response.data);
      setMessage(`✅ Email removed successfully`);
      setEmail("");
      setAction("add");
      setShowEmailInput(true);
      
      // Update local crane state
      const updatedCrane = { 
        ...crane, 
        alertEmail: "",
        id: crane._id,  // Ensure ID is properly set
        _id: crane._id  // Ensure _id is properly set
      };
      setCrane(updatedCrane);
      
      // Force a small delay to ensure state is updated before calling callback
      setTimeout(() => {
        if (onEmailUpdated) {
          onEmailUpdated(updatedCrane);
        }
      }, 100);
    } catch (error) {
      console.error("❌ Error removing email:", error);
      console.error("❌ Error response:", error.response?.data);
      setMessage(`❌ ${error.response?.data?.error || "Failed to remove email"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-modal-overlay">
      <div className="email-modal-content">
        <div className="email-modal-header">
          <h3>📧 Email Management - {crane["Unit #"]}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="email-modal-body">
          {message && (
            <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="email-status">
            <strong>Current Status:</strong>
            <div className="status-info">
              <span>Unit #: {crane["Unit #"]}</span>
              <span>Make: {crane["Make and Model"]}</span>
              <span>Expiration: {crane["Expiration"]}</span>
              <span>Email: {crane.alertEmail || "Not configured"}</span>
            </div>
          </div>

          <div className="email-form">
            {showEmailInput && (
              <div className="form-group">
                <label htmlFor="email">Alert Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., operator@company.com"
                  disabled={loading}
                />
                <small>Enter the email address for sending expiration alerts</small>
              </div>
            )}

            <div className="form-actions">
              {/* Show Save Email button when input is visible */}
              {showEmailInput && (
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={handleSaveEmail}
                  disabled={loading}
                >
                  {loading ? "⏳ Saving..." : "💾 Save Email"}
                </button>
              )}
              
              {/* Show Update button when email exists and input is hidden */}
              {crane.alertEmail && !showEmailInput && (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleUpdateClick}
                  disabled={loading}
                >
                  💾 Update
                </button>
              )}
              
              {/* Show Send Alert button when email exists */}
              {crane.alertEmail && (
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={handleSendAlert}
                  disabled={loading}
                >
                  {loading ? "⏳ Sending..." : "📧 Send Alert"}
                </button>
              )}
              
              {/* Show Remove Email button when email exists */}
              {crane.alertEmail && (
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleRemoveEmail}
                  disabled={loading}
                >
                  🗑️ Remove Email
                </button>
              )}
              
              {/* Close button */}
              <button 
                type="button" 
                className="btn btn-secondary btn-small" 
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
