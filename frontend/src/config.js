// config.js
const config = {
  API_URL: (process.env.REACT_APP_API_URL || 'http://hunter.sumerudigital.com'),
  FALLBACK_API_URL: 'https://hunter.sumerudigital.com',
  // Production environment check
  isProduction: window.location.hostname === 'hunter.sumerudigital.com'
};

export default config;