import { useState, useEffect } from 'react';
import LeaveRequestForm from './components/LeaveRequestForm';
import LeaveRequestList from './components/LeaveRequestList';
import CalendarView from './components/CalendarView';
import SickLeaveForm from './components/SickLeaveForm';
import AdminPage from './pages/AdminPage';
import PendingRequestsPage from './pages/PendingRequestsPage';

function App() {
  const [activeTab, setActiveTab] = useState('form');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [adminToken, setAdminToken] = useState(null);
  const [showPendingPage, setShowPendingPage] = useState(false);

  useEffect(() => {
    // Check if we're on admin page or pending page
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const page = urlParams.get('page');
    
    if (token) {
      setAdminToken(token);
    }
    
    if (page === 'pending') {
      setShowPendingPage(true);
    }
    
    // Test if React is working
    console.log('App component loaded');
  }, []);

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('list');
  };

  // Show pending requests page if page=pending
  if (showPendingPage) {
    return <PendingRequestsPage />;
  }

  // Show admin page if token is present
  if (adminToken) {
    return <AdminPage token={adminToken} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Logo Banner */}
      <header className="bg-oet-blue text-white shadow-md relative">
        <div className="max-w-md mx-auto">
          {/* Logo Banner - Centered and larger */}
          <div className="flex justify-center items-center py-5 px-4">
            <img 
              src="/OET-verlof/logo.jpg" 
              alt="OET Logo" 
              className="h-28 w-auto object-contain mx-auto"
            />
          </div>
          {/* Navigation Header */}
          <div className="px-4 pb-3 flex items-center justify-center relative">
            {(activeTab !== 'form' && activeTab !== 'sick') && (
              <button
                onClick={() => setActiveTab('form')}
                className="absolute left-4 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-xl font-bold text-center">
              {activeTab === 'form' ? 'Verlof aanvragen' : 
               activeTab === 'sick' ? 'Ziek melden' : 
               activeTab === 'list' ? 'Overzicht' : 'Kalender'}
            </h1>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-3 text-center font-medium transition-colors text-xs sm:text-sm ${
              activeTab === 'form'
                ? 'text-oet-blue border-b-2 border-oet-blue'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Aanvragen
          </button>
          <button
            onClick={() => setActiveTab('sick')}
            className={`flex-1 py-3 text-center font-medium transition-colors text-xs sm:text-sm ${
              activeTab === 'sick'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Ziekmelden
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 text-center font-medium transition-colors text-xs sm:text-sm ${
              activeTab === 'list'
                ? 'text-oet-blue border-b-2 border-oet-blue'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Overzicht
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-3 text-center font-medium transition-colors text-xs sm:text-sm ${
              activeTab === 'calendar'
                ? 'text-oet-blue border-b-2 border-oet-blue'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Kalender
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto bg-white flex-1 pb-4">
        {activeTab === 'form' && (
          <LeaveRequestForm onSuccess={handleFormSuccess} />
        )}

        {activeTab === 'sick' && (
          <SickLeaveForm onSuccess={handleFormSuccess} />
        )}

        {activeTab === 'list' && (
          <div className="p-4">
            <LeaveRequestList refreshTrigger={refreshTrigger} />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="p-4">
            <CalendarView refreshTrigger={refreshTrigger} />
          </div>
        )}
      </div>

      {/* Footer - Fixed at bottom */}
      <footer className="max-w-md mx-auto py-3 px-4 text-center bg-white border-t border-gray-200 mt-auto">
        <p className="text-xs text-gray-600">
          Last build {new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })} By MLelieveld
        </p>
      </footer>
    </div>
  );
}

export default App;

