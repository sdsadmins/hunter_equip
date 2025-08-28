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
            <p>Efficient crane inspection management system</p>
          </div>
          <div className="footer-section">
            <h4>📞 Contact</h4>
            <p>Email: support@craneinspection.com</p>
            <p>Phone: (555) 123-4567</p>
          </div>
          <div className="footer-section">
            <h4>🔗 Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/login">Login</a></li>
              <li><a href="/register">Register</a></li>
            </ul>
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
    </div>
  );
};

export default Layout;
