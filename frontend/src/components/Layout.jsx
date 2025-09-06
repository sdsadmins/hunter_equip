import React from 'react';
import './Layout.css';
import InteractiveHelp from './InteractiveHelp';

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
              <li><a href="#user-manual" onClick={(e) => { e.preventDefault(); document.querySelector('.user-manual-section')?.scrollIntoView({ behavior: 'smooth' }); }}>📖 User Manual</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>📞 Contact Us</h4>
            <p>📍 2829 Texas Ave -
            Texas City, TX 77590-8259</p>
            <p>📞 (409) 945-2382 -
            Press “3” for rentals</p>
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
            />
          </div>
        </div>
      </footer>
      
      {/* Interactive Help Chat - appears on all pages */}
      <InteractiveHelp />
    </div>
  );
};

export default Layout;
