// config.js
const config = {
  API_URL: process.env.REACT_APP_API_URL || 
           (window.location.hostname === 'localhost' 
              ? 'http://localhost:5000' 
              : `${window.location.protocol}//${window.location.hostname}`),

  FALLBACK_API_URL: 'http://localhost:5000'
};

export default config;