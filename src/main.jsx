import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('Main.jsx loaded');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found!');
  } else {
    console.log('Root element found, rendering App...');
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
} catch (error) {
  console.error('Error rendering app:', error);
  document.getElementById('root').innerHTML = '<div style="padding: 20px; color: red;">Error loading app: ' + error.message + '</div>';
}

