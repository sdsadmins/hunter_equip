// Configuration for different environments
const config = {
  // API URL - will work on any host/port
  API_URL: process.env.REACT_APP_API_URL || 
           (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 
            `${window.location.protocol}//${window.location.hostname}:5000`),
  
  // Fallback to localhost if the above doesn't work
  FALLBACK_API_URL: 'http://localhost:5000'
};

export default config;

