// config.js
const config = {
  API_URL: (process.env.REACT_APP_API_URL || 'http://localhost:5000'),
  FALLBACK_API_URL: 'https://hunter.sumerudigital.com'
};

export default config;