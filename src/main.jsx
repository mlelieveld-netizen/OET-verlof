import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AdminPage from './pages/AdminPage.jsx'
import ICSDownloadPage from './pages/ICSDownloadPage.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

console.log('Main.jsx loaded');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found!');
  } else {
    console.log('Root element found, checking URL parameters...');
    
    const params = new URLSearchParams(window.location.search);
    const isAdminMode = params.get('admin') === 'true';
    const token = params.get('token');
    const requestId = params.get('id');
    const icsToken = params.get('ics');
    
    let RootComponent;
    
    if (icsToken) {
      // /?ics=token → ICS download page
      console.log('ICS download mode detected, rendering ICSDownloadPage');
      RootComponent = <ICSDownloadPage />;
    } else if (isAdminMode) {
      // /?admin=true → admin overview
      console.log('Admin mode detected, rendering AdminPage with overview token');
      RootComponent = <AdminPage token="overview" />;
    } else if (token) {
      // /?token=... → admin page with specific token
      console.log('Token detected, rendering AdminPage with token:', token);
      RootComponent = <AdminPage token={token} />;
    } else {
      // normale app
      console.log('Normal app mode, rendering App');
      RootComponent = <App requestId={requestId} />;
    }
    
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          {RootComponent}
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
