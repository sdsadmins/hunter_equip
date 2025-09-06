import React from 'react';
import './UserManual.css';

export default function UserManual() {
  return (
    <div className="user-manual">
      <div className="manual-header">
        <h2>User Manual</h2>
        <p>Quick guide to use the Crane Management System.</p>
      </div>

      <div className="manual-content">
        {/* Getting Started Section */}
        <div className="section">
          <h3>🚀 Getting Started</h3>
          <p>Steps to start using the system.</p>
          <ol>
            <li><strong>Register:</strong> Create an account</li>
            <li><strong>Login:</strong> Access your dashboard</li>
            <li><strong>Upload Data:</strong> Import cranes via Excel</li>
            <li><strong>Configure:</strong> Set email alerts</li>
          </ol>
        </div>

        {/* Dashboard Overview Section */}
        <div className="section">
          <h3>📊 Dashboard Overview</h3>
          <p>Control center to view and manage cranes.</p>
          <ul>
            <li><strong>Alerts:</strong> Expiry notifications</li>
            <li><strong>Status:</strong> Crane overview</li>
            <li><strong>Search:</strong> Find cranes easily</li>
            <li><strong>Quick Actions:</strong> Add, import, print</li>
          </ul>
          <h4>Status Colors</h4>
          <ul>
            <li><strong>Red:</strong> Expired</li>
            <li><strong>Orange:</strong> Expiring soon</li>
            <li><strong>Green:</strong> OK</li>
          </ul>
        </div>

        {/* Crane Management Section */}
        <div className="section">
          <h3>🏗️ Crane Management</h3>
          <p>Add, edit, or delete cranes.</p>
          <ol>
            <li>Click “+ Add Crane”</li>
            <li>Fill details & expiry date and click save</li>
            <li>Click the edit icon to update the crane details and expiry date then click Update Crane</li>
            <li>Click the delete icon to delete the crane</li>
          </ol>
        </div>

        {/* Excel Import Section */}
        <div className="section">
          <h3>📁 Excel Import</h3>
          <p>Upload cranes in bulk.</p>
          <ul>
            <li>Required: Unit #, Year, Model, Ton, Serial, Expiration</li>
          </ul>
          <ol>
            <li>Click “Excel Import”</li>
            <li>Select file</li>
            <li>Review results</li>
          </ol>
        </div>

        {/* Email Alert Section */}
        <div className="section">
          <h3>📧 Email Alerts</h3>
          <p>System auto-checks daily at 9 AM.</p>
          <ul>
            <li><strong>Expired:</strong> Urgent</li>
            <li><strong>7 Days:</strong> High</li>
            <li><strong>14 Days:</strong> Medium</li>
            <li><strong>30 Days:</strong> Low</li>
          </ul>
        </div>

        {/* Status Section */}
        <div className="section">
          <h3>🚨 Status & Alerts</h3>
          <ul>
            <li>30+ Days: OK (Green)</li>
            <li>15-30 Days: Plan (Orange)</li>
            <li>1-14 Days: Urgent (Orange)</li>
            <li>Expired: Stop use (Red)</li>
          </ul>
        </div>
      </div>

      <div className="manual-footer">
        <p><strong>Tip:</strong> Bookmark this page for quick access!</p>
      </div>
    </div>
  );
}
