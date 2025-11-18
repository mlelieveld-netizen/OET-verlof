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
  const [activeTab, setActiveTab] = useState('review'); // 'review' or 'overview'
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadApprovedRequests = () => {
    const allRequests = getLeaveRequests();
    const approved = allRequests
      .filter(r => r.status === 'approved')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setApprovedRequests(approved);
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

      const leaveRequest = getLeaveRequestByToken(token);
      if (!leaveRequest) {
        console.error('AdminPage: Request not found for token:', token);
        setError(`Verlofaanvraag niet gevonden voor token: ${token}\n\nMogelijke oorzaken:\n- De aanvraag is verwijderd\n- Je gebruikt een andere browser/device\n- De link is verlopen`);
        setLoading(false);
        return;
      }

      console.log('AdminPage: Found request:', leaveRequest);
      setRequest(leaveRequest);
      setLoading(false);
      
      // Load approved requests for overview tab
      loadApprovedRequests();
    } catch (error) {
      console.error('AdminPage: Error loading request:', error);
      setError(`Fout bij het laden: ${error.message}`);
      setLoading(false);
    }
  }, [token]);

  // Auto-refresh approved requests every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadApprovedRequests();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleApprove = async () => {
    if (!request) return;
    
    updateLeaveRequest(request.id, { status: 'approved' });
    setActionTaken(true);
    loadApprovedRequests(); // Refresh overview
    
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

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!request) return;
    
    if (!rejectionReason.trim()) {
      alert('Geef alstublieft een reden op voor de afwijzing.');
      return;
    }
    
    updateLeaveRequest(request.id, { 
      status: 'rejected',
      rejectionReason: rejectionReason.trim()
    });
    setActionTaken(true);
    setShowRejectModal(false);
    
    // Update GitHub Issue if exists
    if (request.githubIssueNumber) {
      try {
        await updateLeaveRequestIssue(request.githubIssueNumber, 'rejected');
        await addIssueComment(request.githubIssueNumber, `❌ **Afgewezen**\n\nReden: ${rejectionReason.trim()}`);
      } catch (error) {
        console.error('Error updating GitHub issue:', error);
      }
    }
  };

  const getTypeText = (type) => {
    const types = {
      verlof: 'Verlof/Vakantie',
      ziekte: 'Dokter/Tandarts',
      persoonlijk: 'Bijzonder verlof',
    };
    return types[type] || type;
  };

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

  if (error || (!request && !loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="text-red-600 text-5xl mb-4 text-center">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Fout</h1>
          <div className="text-gray-600 mb-4">
            {error ? (
              <div className="whitespace-pre-line">{error}</div>
            ) : (
              <p>Verlofaanvraag niet gevonden</p>
            )}
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

  if (actionTaken && request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Actie uitgevoerd</h1>
          <p className="text-gray-600">
            De verlofaanvraag is {request.status === 'approved' ? 'goedgekeurd' : 'afgewezen'}.
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

  // Safety check: if no request after loading, show error
  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="text-red-600 text-5xl mb-4 text-center">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Fout</h1>
          <p className="text-gray-600 text-center mb-4">Verlofaanvraag niet gevonden</p>
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

  const calculateDays = (startDate, endDate) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return differenceInDays(end, start) + 1;
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
            Beoordelen
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
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {activeTab === 'review' ? (
          <ReviewTab 
            request={request} 
            employeeEmail={employeeEmail}
            handleApprove={handleApprove}
            handleRejectClick={handleRejectClick}
            getTypeText={getTypeText}
            calculateDays={calculateDays}
          />
        ) : (
          <OverviewTab 
            approvedRequests={approvedRequests}
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
const ReviewTab = ({ request, employeeEmail, handleApprove, handleRejectClick, getTypeText, calculateDays }) => {
  if (!request) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center py-12">
        <p className="text-gray-500">Geen aanvraag gevonden.</p>
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
const OverviewTab = ({ approvedRequests, getTypeText, calculateDays, getEmployeeEmail }) => {
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
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminPage;

