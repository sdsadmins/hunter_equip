import React from 'react';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>🏗️ Crane Inspection Tracker</h4>
            <p>Efficient crane inspection management system for tracking and managing crane inspections with modern technology. Monitor expiration dates and ensure compliance through our digital platform.</p>
            <div className="social-icons">
              <a href="#" className="social-icon">📘</a>
              <a href="#" className="social-icon">🐦</a>
              <a href="#" className="social-icon">💼</a>
            </div>
          </div>
          <div className="footer-section">
            <h4>🔗 Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/login">Login</a></li>
              <li><a href="/register">Register</a></li>
              <li><a href="/cranes">View Cranes</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>📞 Contact Us</h4>
            <p>📍 123 Business St, City, Country</p>
            <p>📞 +1 (555) 123-4567</p>
            <p>✉️ support@craneinspection.com</p>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="developer-info">
            <span>Developed by</span>
            <img
              src="/images/sumeru-logo.png"
              alt="Sumeru Digital"
              className="dev-logo"
              onError={(e) => {
                console.log('Logo failed to load:', e.target.src);
                e.target.style.display = 'none';
              }}
              onLoad={() => {
                console.log('Logo loaded successfully');
              }}
              style={{ maxWidth: '100px', height: 'auto' }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
