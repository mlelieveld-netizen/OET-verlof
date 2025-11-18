import { useState } from 'react';
import LeaveRequestForm from './components/LeaveRequestForm';
import LeaveRequestList from './components/LeaveRequestList';
import CalendarView from './components/CalendarView';

function App() {
  const [activeTab, setActiveTab] = useState('form');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('list');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo Banner */}
      <header className="bg-oet-blue text-white shadow-md">
        <div className="max-w-md mx-auto">
          {/* Logo Banner */}
          <div className="flex justify-center items-center py-3 px-4">
            <img 
              src="/OET-verlof/logo.jpg" 
              alt="OET Logo" 
              className="h-12 object-contain"
              onError={(e) => {
                console.error('Logo failed to load, trying alternative path');
                e.target.src = '/logo.jpg';
              }}
            />
          </div>
          {/* Navigation Header */}
          <div className="px-4 pb-3 flex items-center">
            {activeTab !== 'form' && (
              <button
                onClick={() => setActiveTab('form')}
                className="mr-4 p-2 -ml-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-xl font-bold flex-1 text-center">
              {activeTab === 'form' ? 'Verlof aanvragen' : activeTab === 'list' ? 'Overzicht' : 'Kalender'}
            </h1>
            {activeTab === 'form' && <div className="w-10"></div>}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'form'
                ? 'text-oet-blue border-b-2 border-oet-blue'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Aanvragen
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'list'
                ? 'text-oet-blue border-b-2 border-oet-blue'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Overzicht
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
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
      <div className="max-w-md mx-auto bg-white min-h-[calc(100vh-120px)]">
        {activeTab === 'form' && (
          <LeaveRequestForm onSuccess={handleFormSuccess} />
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
    </div>
  );
}

export default App;

