import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
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
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    );
  }
} catch (error) {
  console.error('Error rendering app:', error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '<div style="padding: 20px; color: red; max-width: 600px; margin: 0 auto;"><h2 style="color: red;">Error loading app</h2><p>Please check the browser console (F12) for details.</p><p style="font-size: 12px; margin-top: 10px;">Error: ' + (error.message || 'Unknown error') + '</p><button onclick="window.location.reload()" style="margin-top: 10px; padding: 10px 20px; background: #2C3E50; color: white; border: none; border-radius: 5px; cursor: pointer;">Reload Page</button></div>';
  }
}

