import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { CraneProvider } from './context/CraneContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <CraneProvider>
    <App />
  </CraneProvider>
);


