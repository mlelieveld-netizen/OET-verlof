import { useState, useEffect } from 'react';
import { getLeaveRequestByToken, updateLeaveRequest, getLeaveRequests } from '../utils/storage';
import { getEmployeeEmail } from '../data/employees';
import { generateICSFile, downloadICSFile, sendApprovalEmail } from '../utils/email';
import { updateLeaveRequestIssue, addIssueComment } from '../utils/github';
import { format, parseISO, differenceInDays } from 'date-fns';
import nl from 'date-fns/locale/nl';

const AdminPage = ({ token }) => {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionTaken, setActionTaken] = useState(false);
  const [activeTab, setActiveTab] = useState('review'); // 'review', 'overview', 'rejected', or 'sick'
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [sickRequests, setSickRequests] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Safety: ensure token is provided
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Fout</h1>
          <p className="text-gray-600 mb-4">Geen token opgegeven</p>
          <button
            onClick={() => window.location.href = 'https://mlelieveld-netizen.github.io/OET-verlof/'}
            className="w-full bg-oet-blue text-white py-2 px-4 rounded-lg font-medium hover:bg-oet-blue-dark transition-colors"
          >
            Terug naar hoofdpagina
          </button>
        </div>
      </div>
    );
  }

  const [pendingRequests, setPendingRequests] = useState([]);

  const loadPendingRequests = () => {
    const allRequests = getLeaveRequests();
    const pending = allRequests
      .filter(r => r && r.status === 'pending')
      .sort((a, b) => {
        try {
          return new Date(a.createdAt) - new Date(b.createdAt);
        } catch {
          return 0;
        }
      });
    setPendingRequests(pending);
  };

  const loadApprovedRequests = () => {
    const allRequests = getLeaveRequests();
    const approved = allRequests
      .filter(r => r && r.status === 'approved')
      .sort((a, b) => {
        try {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } catch {
          return 0;
        }
      });
    setApprovedRequests(approved);
  };

  const loadRejectedRequests = () => {
    const allRequests = getLeaveRequests();
    const rejected = allRequests
      .filter(r => r && r.status === 'rejected')
      .sort((a, b) => {
        try {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } catch {
          return 0;
        }
      });
    setRejectedRequests(rejected);
  };

  const loadSickRequests = () => {
    const allRequests = getLeaveRequests();
    const sick = allRequests
      .filter(r => r && r.status === 'sick')
      .sort((a, b) => {
        try {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } catch {
          return 0;
        }
      });
    setSickRequests(sick);
  };

  useEffect(() => {
    try {
      if (!token) {
        setError('Geen token opgegeven');
        setLoading(false);
        return;
      }

      // Debug logging
      console.log('AdminPage: Looking for token:', token);
      
      // Check if localStorage is available
      if (typeof Storage === 'undefined') {
        setError('LocalStorage is niet beschikbaar in deze browser.');
        setLoading(false);
        return;
      }

      const allRequests = JSON.parse(localStorage.getItem('verlof-aanvragen') || '[]');
      console.log('AdminPage: All requests:', allRequests);
      console.log('AdminPage: All tokens:', allRequests.map(r => r.adminToken));

      // Special case: if token is 'overview', show overview page without specific request
      if (token === 'overview') {
        setRequest(null); // No specific request to review
        setLoading(false);
        loadPendingRequests();
        loadApprovedRequests();
        loadRejectedRequests();
        loadSickRequests();
        
        // Check if there are sick requests, if so, show ZIEK tab first
        const allRequests = getLeaveRequests();
        const hasSickRequests = allRequests.some(r => r && r.status === 'sick');
        if (hasSickRequests) {
          setActiveTab('sick');
        } else {
          setActiveTab('review'); // Start with review tab to show pending requests
        }
        return;
      }

      const leaveRequest = getLeaveRequestByToken(token);
      if (!leaveRequest) {
        console.error('AdminPage: Request not found for token:', token);
        
        // Check if there are any sick requests - if so, show overview page with ZIEK tab
        const allRequests = getLeaveRequests();
        const hasSickRequests = allRequests.some(r => r && r.status === 'sick');
        
        if (hasSickRequests) {
          // Show overview page with ZIEK tab active instead of error
          setRequest(null);
          setLoading(false);
          setActiveTab('sick');
          loadPendingRequests();
          loadApprovedRequests();
          loadRejectedRequests();
          loadSickRequests();
          return;
        }
        
        setError('Verlofaanvraag niet gevonden. Mogelijke oorzaken: De aanvraag is verwijderd, je gebruikt een andere browser/device, of de link is verlopen.');
        setLoading(false);
        return;
      }

      console.log('AdminPage: Found request:', leaveRequest);
      setRequest(leaveRequest);
      setLoading(false);
      
      // If it's a sick leave request, automatically switch to the ZIEK tab
      if (leaveRequest.status === 'sick') {
        setActiveTab('sick');
      }
      
      // Load approved, rejected, and sick requests for overview tabs
      loadApprovedRequests();
      loadRejectedRequests();
      loadSickRequests();
    } catch (error) {
      console.error('AdminPage: Error loading request:', error);
      setError(`Fout bij het laden: ${error.message}`);
      setLoading(false);
    }
  }, [token]);

  // Auto-refresh pending, approved, rejected, and sick requests every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (token === 'overview' || !token) {
        loadPendingRequests();
      }
      loadApprovedRequests();
      loadRejectedRequests();
      loadSickRequests();
    }, 5000);

    return () => clearInterval(interval);
  }, [token]);

  const handleApprove = async () => {
    if (!request) return;
    
    updateLeaveRequest(request.id, { status: 'approved' });
    
    // Reload the request to get updated status
    const updatedRequest = getLeaveRequestByToken(token);
    if (updatedRequest) {
      setRequest(updatedRequest);
    }
    
    setActionTaken(true);
    loadApprovedRequests(); // Refresh overview
    loadRejectedRequests(); // Refresh rejected overview
    
    // Update GitHub Issue if exists
    if (request.githubIssueNumber) {
      try {
        await updateLeaveRequestIssue(request.githubIssueNumber, 'approved');
        await addIssueComment(request.githubIssueNumber, '✅ **Goedgekeurd**\n\nDe verlofaanvraag is goedgekeurd.');
      } catch (error) {
        console.error('Error updating GitHub issue:', error);
      }
    }
    
    // Generate ICS file and send email to admin
    const icsContent = generateICSFile(request);
    
    // Send email via EmailJS (ICS is included in email)
    try {
      const emailResult = await sendApprovalEmail(request, icsContent);
      if (emailResult.success) {
        // Also download ICS file locally for backup
        downloadICSFile(request);
        alert('Email is verzonden naar werkplaats@vandenoetelaar-metaal.nl\n\nHet agenda item (ICS bestand) is bijgevoegd in de email.');
      } else {
        console.warn('Email kon niet worden verzonden:', emailResult.error);
        // Fallback: download ICS file
        downloadICSFile(request);
        alert('Email kon niet automatisch worden verzonden. Het ICS bestand is gedownload.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      // Fallback: download ICS file
      downloadICSFile(request);
      alert('Email kon niet automatisch worden verzonden. Het ICS bestand is gedownload.');
    }
  };

  const handleRejectClick = (requestId = null) => {
    if (requestId) {
      // If requestId is provided, find the request and set it
      const allRequests = getLeaveRequests();
      const foundRequest = allRequests.find(r => r && r.id === requestId);
      if (foundRequest) {
        setRequest(foundRequest);
        // Update the URL to include the token
        const newUrl = `https://mlelieveld-netizen.github.io/OET-verlof/?token=${foundRequest.adminToken}`;
        window.history.pushState({}, '', newUrl);
      }
    }
    setShowRejectModal(true);
  };

  const handleApproveFromOverview = async (requestId) => {
    if (!requestId) return;
    
    const allRequests = getLeaveRequests();
    const foundRequest = allRequests.find(r => r && r.id === requestId);
    if (!foundRequest) return;
    
    // Update the request status
    updateLeaveRequest(requestId, { status: 'approved' });
    
    // Update GitHub Issue if exists
    if (foundRequest.githubIssueNumber) {
      try {
        await updateLeaveRequestIssue(foundRequest.githubIssueNumber, 'approved');
        await addIssueComment(foundRequest.githubIssueNumber, '✅ **Goedgekeurd**\n\nDe verlofaanvraag is goedgekeurd.');
      } catch (error) {
        console.error('Error updating GitHub issue:', error);
      }
    }
    
    // Generate ICS file and send email to admin
    const icsContent = generateICSFile(foundRequest);
    
    // Send email via EmailJS (ICS is included in email)
    try {
      const emailResult = await sendApprovalEmail(foundRequest, icsContent);
      if (emailResult.success) {
        downloadICSFile(foundRequest);
        alert('Email is verzonden naar werkplaats@vandenoetelaar-metaal.nl\n\nHet agenda item (ICS bestand) is bijgevoegd in de email.');
      } else {
        console.warn('Email kon niet worden verzonden:', emailResult.error);
        downloadICSFile(foundRequest);
        alert('Email kon niet automatisch worden verzonden. Het ICS bestand is gedownload.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      downloadICSFile(foundRequest);
      alert('Email kon niet automatisch worden verzonden. Het ICS bestand is gedownload.');
    }
    
    // Refresh the lists
    loadApprovedRequests();
    loadRejectedRequests();
    loadPendingRequests();
  };

  const handleReject = async (requestId = null) => {
    // If requestId is provided, use that instead of the current request
    let requestToReject = request;
    if (requestId) {
      const allRequests = getLeaveRequests();
      requestToReject = allRequests.find(r => r && r.id === requestId);
    }
    
    if (!requestToReject) return;
    
    if (!rejectionReason.trim()) {
      alert('Geef alstublieft een reden op voor de afwijzing.');
      return;
    }
    
    updateLeaveRequest(requestToReject.id, { 
      status: 'rejected',
      rejectionReason: rejectionReason.trim()
    });
    
    // Reload the request to get updated status
    if (token && token !== 'overview') {
      const updatedRequest = getLeaveRequestByToken(token);
      if (updatedRequest) {
        setRequest(updatedRequest);
      }
    } else if (requestId) {
      // If we're in overview mode, just refresh the lists
      const allRequests = getLeaveRequests();
      const updatedRequest = allRequests.find(r => r && r.id === requestId);
      if (updatedRequest) {
        setRequest(updatedRequest);
      }
    }
    
    setActionTaken(true);
    setShowRejectModal(false);
    setRejectionReason(''); // Clear rejection reason
    loadRejectedRequests(); // Refresh rejected overview
    loadApprovedRequests(); // Refresh approved overview
    loadPendingRequests(); // Refresh pending requests
    
    // Update GitHub Issue if exists
    if (requestToReject.githubIssueNumber) {
      try {
        await updateLeaveRequestIssue(requestToReject.githubIssueNumber, 'rejected');
        await addIssueComment(requestToReject.githubIssueNumber, `❌ **Afgewezen**\n\nReden: ${rejectionReason.trim()}`);
      } catch (error) {
        console.error('Error updating GitHub issue:', error);
      }
    }
  };

  const getTypeText = (type) => {
    const types = {
      verlof: 'Verlof/Vakantie',
      ziekte: 'ZIEK',
      persoonlijk: 'Bijzonder verlof',
    };
    return types[type] || type;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-oet-blue border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  // Error state or no request found
  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="text-red-600 text-5xl mb-4 text-center">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Fout</h1>
          <div className="text-gray-600 mb-4 text-center">
            {error ? <p>{error}</p> : <p>Verlofaanvraag niet gevonden</p>}
          </div>
          <div className="text-sm text-gray-500 mb-4 p-3 bg-gray-50 rounded">
            <p className="font-medium mb-2">Mogelijke oplossingen:</p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>Open de link in dezelfde browser waar je de aanvraag hebt ingediend</li>
              <li>Controleer of de link correct is gekopieerd</li>
              <li>Probeer de link opnieuw te openen</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.href = 'https://mlelieveld-netizen.github.io/OET-verlof/'}
            className="w-full bg-oet-blue text-white py-2 px-4 rounded-lg font-medium hover:bg-oet-blue-dark transition-colors"
          >
            Terug naar hoofdpagina
          </button>
        </div>
      </div>
    );
  }

  // Action taken state
  if (actionTaken) {
    const statusText = request.status === 'approved' ? 'goedgekeurd' : 'afgewezen';
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Actie uitgevoerd</h1>
          <p className="text-gray-600">
            De verlofaanvraag is {statusText}.
          </p>
          {request.status === 'approved' && (
            <p className="text-sm text-gray-500 mt-2">
              Het agenda item is gedownload. Voeg deze toe aan uw email.
            </p>
          )}
        </div>
      </div>
    );
  }

  const calculateDays = (startDate, endDate) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    let days = 0;
    let currentDate = new Date(start);
    
    // Helper function to check if date is a holiday
    const isHoliday = (date) => {
      const month = date.getMonth(); // 0 = January, 11 = December
      const day = date.getDate();
      
      // 25 December (Christmas)
      if (month === 11 && day === 25) return true;
      // 26 December (Boxing Day)
      if (month === 11 && day === 26) return true;
      // 1 January (New Year's Day)
      if (month === 0 && day === 1) return true;
      
      return false;
    };
    
    // Count only weekdays (Monday-Friday, excluding weekends and holidays)
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday(currentDate)) { // Skip weekends and holidays
        days++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const employeeEmail = getEmployeeEmail(request.employeeNumber);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-oet-blue text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-center items-center mb-4">
            <img 
              src="/OET-verlof/logo.jpg" 
              alt="OET Logo" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-center">Beheerderspagina</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('review')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'review'
                ? 'border-b-2 border-oet-blue text-oet-blue'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Openstaand
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-b-2 border-oet-blue text-oet-blue'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Overzicht Goedgekeurd ({approvedRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'rejected'
                ? 'border-b-2 border-oet-blue text-oet-blue'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Overzicht Afgekeurd ({rejectedRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('sick')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'sick'
                ? 'border-b-2 border-red-600 text-red-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ZIEK ({sickRequests.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {activeTab === 'review' ? (
          <ReviewTab 
            request={request} 
            pendingRequests={pendingRequests}
            employeeEmail={employeeEmail}
            handleApprove={handleApprove}
            handleRejectClick={handleRejectClick}
            getTypeText={getTypeText}
            calculateDays={calculateDays}
            getEmployeeEmail={getEmployeeEmail}
            token={token}
            setActiveTab={setActiveTab}
          />
        ) : activeTab === 'overview' ? (
          <OverviewTab 
            approvedRequests={approvedRequests}
            getTypeText={getTypeText}
            calculateDays={calculateDays}
            getEmployeeEmail={getEmployeeEmail}
            handleRejectClick={handleRejectClick}
            handleApproveFromOverview={handleApproveFromOverview}
          />
        ) : activeTab === 'rejected' ? (
          <RejectedOverviewTab 
            rejectedRequests={rejectedRequests}
            getTypeText={getTypeText}
            calculateDays={calculateDays}
            getEmployeeEmail={getEmployeeEmail}
            handleRejectClick={handleRejectClick}
            handleApproveFromOverview={handleApproveFromOverview}
          />
        ) : (
          <SickOverviewTab 
            sickRequests={sickRequests}
            getTypeText={getTypeText}
            calculateDays={calculateDays}
            getEmployeeEmail={getEmployeeEmail}
          />
        )}
      </div>

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Reden voor afwijzing</h2>
            <p className="text-sm text-gray-600 mb-4">
              Geef een reden op waarom deze verlofaanvraag wordt afgewezen. Deze reden wordt getoond aan de aanvrager.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Bijv. Te veel verlofaanvragen in deze periode, onvoldoende personeel beschikbaar, etc."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Afwijzen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Review Tab Component
const ReviewTab = ({ request, pendingRequests, employeeEmail, handleApprove, handleRejectClick, getTypeText, calculateDays, getEmployeeEmail, token, setActiveTab }) => {
  // If no specific request (overview mode), show list of pending requests
  if (!request) {
    // Filter out sick requests from pending requests
    const filteredPendingRequests = pendingRequests.filter(req => req && req.status !== 'sick');
    
    if (filteredPendingRequests.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6 text-center py-12">
          <p className="text-gray-500 text-lg">Geen openstaande verlofaanvragen gevonden.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredPendingRequests.map((req) => {
          if (!req) return null;
          const empEmail = req.employeeNumber ? getEmployeeEmail(req.employeeNumber) : null;
          const adminLink = `https://mlelieveld-netizen.github.io/OET-verlof/?token=${req.adminToken}`;
          
          return (
            <div key={req.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 text-xl font-bold">
                  {req.employeeName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{req.employeeName}</h3>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      In behandeling
                    </span>
                    <span className="px-3 py-1 bg-oet-blue-light text-oet-blue-dark rounded-full text-xs font-medium">
                      {getTypeText(req.type)}
                    </span>
                  </div>
                  {empEmail && (
                    <p className="text-sm text-gray-600 mb-3">{empEmail}</p>
                  )}
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Periode:</span>{' '}
                      {format(parseISO(req.startDate), 'd MMMM yyyy', { locale: nl })}
                      {req.endDate !== req.startDate && 
                        ' - ' + format(parseISO(req.endDate), 'd MMMM yyyy', { locale: nl })
                      }
                    </p>
                    <p>
                      <span className="font-medium">Aantal dagen:</span>{' '}
                      {calculateDays(req.startDate, req.endDate)} dag(en)
                    </p>
                    {req.reason && (
                      <p className="mt-2 text-gray-700">
                        <span className="font-medium">Reden:</span> {req.reason}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Aangemaakt op: {format(parseISO(req.createdAt), 'd MMMM yyyy HH:mm', { locale: nl })}
                    </p>
                  </div>
                  
                  {/* Link to review this specific request */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <a
                      href={adminLink}
                      className="w-full block text-center bg-oet-blue text-white py-2 px-4 rounded-lg font-medium hover:bg-oet-blue-dark transition-colors"
                    >
                      Beoordelen
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // If request is a sick leave, redirect to ZIEK tab (should not happen as it's handled in useEffect, but just in case)
  if (request.status === 'sick') {
    // Automatically switch to ZIEK tab
    if (setActiveTab) {
      setActiveTab('sick');
    }
    return null; // Don't render anything, the tab switch will handle it
  }

  // If request is no longer pending, show message
  if (request.status !== 'pending') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center py-12">
        <div className="mb-4">
          <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-4 ${
            request.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {request.status === 'approved' ? '✓ Goedgekeurd' : '✗ Afgewezen'}
          </div>
        </div>
        <p className="text-gray-600 mb-2">
          Deze aanvraag is al {request.status === 'approved' ? 'goedgekeurd' : 'afgewezen'}.
        </p>
        <p className="text-sm text-gray-500">
          Bekijk deze aanvraag in het tabblad "{request.status === 'approved' ? 'Overzicht Goedgekeurd' : 'Overzicht Afgekeurd'}".
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
          {/* Employee Info */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-oet-blue flex items-center justify-center text-white text-2xl font-bold">
                {request.employeeName.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{request.employeeName}</h2>
                {employeeEmail && (
                  <p className="text-sm text-gray-600">{employeeEmail}</p>
                )}
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-oet-blue-light text-oet-blue-dark rounded-full text-sm font-medium">
                {getTypeText(request.type)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {request.status === 'approved' ? 'Goedgekeurd' :
                 request.status === 'rejected' ? 'Afgewezen' :
                 'In behandeling'}
              </span>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Periode:</span>
                  <p className="text-gray-800">
                    {format(parseISO(request.startDate), 'd MMMM yyyy', { locale: nl })}
                    {request.endDate !== request.startDate && 
                      ' - ' + format(parseISO(request.endDate), 'd MMMM yyyy', { locale: nl })
                    }
                  </p>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-600">Aantal dagen:</span>
                  <p className="text-gray-800">{calculateDays(request.startDate, request.endDate)} dag(en)</p>
                </div>

                {request.startTime && request.endTime && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Tijd:</span>
                    <p className="text-gray-800">{request.startTime} - {request.endTime}</p>
                  </div>
                )}

                {request.reason && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Reden:</span>
                    <p className="text-gray-800">{request.reason}</p>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium text-gray-600">Aangemaakt op:</span>
                  <p className="text-gray-800">
                    {format(parseISO(request.createdAt), 'd MMMM yyyy HH:mm', { locale: nl })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {request.status === 'pending' && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleApprove}
                  className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-md hover:bg-green-700 transition-colors"
                >
                  Goedkeuren
                </button>
                <button
                  onClick={handleRejectClick}
                  className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-md hover:bg-red-700 transition-colors"
                >
                  Afwijzen
                </button>
              </div>
            </div>
          )}

          {request.status !== 'pending' && (
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-gray-700 text-center mb-2">
                  Deze aanvraag is al {request.status === 'approved' ? 'goedgekeurd' : 'afgewezen'}.
                </p>
                {request.status === 'rejected' && request.rejectionReason && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-sm font-medium text-gray-700 mb-1">Reden voor afwijzing:</p>
                    <p className="text-sm text-gray-600">{request.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ approvedRequests, getTypeText, calculateDays, getEmployeeEmail, handleRejectClick, handleApproveFromOverview }) => {
  if (approvedRequests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center py-12">
        <p className="text-gray-500 text-lg">Geen goedgekeurde verlofaanvragen gevonden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {approvedRequests.map((req) => {
        const empEmail = getEmployeeEmail(req.employeeNumber);
        return (
          <div key={req.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xl font-bold">
                {req.employeeName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{req.employeeName}</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Goedgekeurd
                  </span>
                  <span className="px-3 py-1 bg-oet-blue-light text-oet-blue-dark rounded-full text-xs font-medium">
                    {getTypeText(req.type)}
                  </span>
                </div>
                {empEmail && (
                  <p className="text-sm text-gray-600 mb-3">{empEmail}</p>
                )}
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Periode:</span>{' '}
                    {format(parseISO(req.startDate), 'd MMMM yyyy', { locale: nl })}
                    {req.endDate !== req.startDate && 
                      ' - ' + format(parseISO(req.endDate), 'd MMMM yyyy', { locale: nl })
                    }
                  </p>
                  <p>
                    <span className="font-medium">Aantal dagen:</span>{' '}
                    {calculateDays(req.startDate, req.endDate)} dag(en)
                  </p>
                  {req.startTime && req.endTime && (
                    <p>
                      <span className="font-medium">Tijd:</span> {req.startTime} - {req.endTime}
                    </p>
                  )}
                  {req.reason && (
                    <p className="mt-2 text-gray-700">
                      <span className="font-medium">Reden:</span> {req.reason}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Goedgekeurd op: {format(parseISO(req.createdAt), 'd MMMM yyyy HH:mm', { locale: nl })}
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <button
                    onClick={() => handleRejectClick(req.id)}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Alsnog Afwijzen
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Rejected Overview Tab Component
const RejectedOverviewTab = ({ rejectedRequests, getTypeText, calculateDays, getEmployeeEmail, handleRejectClick, handleApproveFromOverview }) => {
  if (rejectedRequests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center py-12">
        <p className="text-gray-500 text-lg">Geen afgewezen verlofaanvragen gevonden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rejectedRequests.map((req) => {
        const empEmail = getEmployeeEmail(req.employeeNumber);
        return (
          <div key={req.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-xl font-bold">
                {req.employeeName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{req.employeeName}</h3>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    Afgewezen
                  </span>
                  <span className="px-3 py-1 bg-oet-blue-light text-oet-blue-dark rounded-full text-xs font-medium">
                    {getTypeText(req.type)}
                  </span>
                </div>
                {empEmail && (
                  <p className="text-sm text-gray-600 mb-3">{empEmail}</p>
                )}
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Periode:</span>{' '}
                    {format(parseISO(req.startDate), 'd MMMM yyyy', { locale: nl })}
                    {req.endDate !== req.startDate && 
                      ' - ' + format(parseISO(req.endDate), 'd MMMM yyyy', { locale: nl })
                    }
                  </p>
                  <p>
                    <span className="font-medium">Aantal dagen:</span>{' '}
                    {calculateDays(req.startDate, req.endDate)} dag(en)
                  </p>
                  {req.startTime && req.endTime && (
                    <p>
                      <span className="font-medium">Tijd:</span> {req.startTime} - {req.endTime}
                    </p>
                  )}
                  {req.reason && (
                    <p className="mt-2 text-gray-700">
                      <span className="font-medium">Reden (origineel):</span> {req.reason}
                    </p>
                  )}
                  {req.rejectionReason && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-sm font-medium text-red-800 mb-1">Reden voor afwijzing:</p>
                      <p className="text-sm text-red-700">{req.rejectionReason}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Afgewezen op: {format(parseISO(req.createdAt), 'd MMMM yyyy HH:mm', { locale: nl })}
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <button
                    onClick={() => handleApproveFromOverview(req.id)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors mb-2"
                  >
                    Alsnog Goedkeuren
                  </button>
                  <button
                    onClick={() => handleRejectClick(req.id)}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Reden Wijzigen
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Sick Overview Tab Component
const SickOverviewTab = ({ sickRequests, getTypeText, calculateDays, getEmployeeEmail }) => {
  if (sickRequests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center py-12">
        <p className="text-gray-500 text-lg">Geen ziekmeldingen gevonden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sickRequests.map((req) => {
        if (!req) return null;
        const empEmail = req.employeeNumber ? getEmployeeEmail(req.employeeNumber) : null;
        return (
          <div key={req.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-xl font-bold">
                {req.employeeName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{req.employeeName}</h3>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium font-bold">
                    ZIEK
                  </span>
                </div>
                {empEmail && (
                  <p className="text-sm text-gray-600 mb-3">{empEmail}</p>
                )}
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Periode:</span>{' '}
                    {format(parseISO(req.startDate), 'd MMMM yyyy', { locale: nl })}
                    {req.endDate !== req.startDate && 
                      ' - ' + format(parseISO(req.endDate), 'd MMMM yyyy', { locale: nl })
                    }
                  </p>
                  <p>
                    <span className="font-medium">Aantal dagen:</span>{' '}
                    {calculateDays(req.startDate, req.endDate)} dag(en)
                  </p>
                  {req.reason && (
                    <p className="mt-2 text-gray-700">
                      <span className="font-medium">Opmerking:</span> {req.reason}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Gemeld op: {format(parseISO(req.createdAt), 'd MMMM yyyy HH:mm', { locale: nl })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminPage;

