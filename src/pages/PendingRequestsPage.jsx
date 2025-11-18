import { useState, useEffect } from 'react';
import { getLeaveRequests, updateLeaveRequest } from '../utils/storage';
import { getEmployeeEmail } from '../data/employees';
import { generateICSFile, downloadICSFile, sendApprovalEmail } from '../utils/email';
import { updateLeaveRequestIssue, addIssueComment } from '../utils/github';
import { format, parseISO, differenceInDays } from 'date-fns';
import nl from 'date-fns/locale/nl';

const PendingRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = () => {
    const allRequests = getLeaveRequests();
    const pendingRequests = allRequests
      .filter(r => r.status === 'pending')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    setRequests(pendingRequests);
    setLoading(false);
  };

  const handleApprove = async (request) => {
    if (!request) return;
    
    updateLeaveRequest(request.id, { status: 'approved' });
    
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
    
    // Download ICS file
    downloadICSFile(request);
    
    // Send email via EmailJS
    try {
      const emailResult = await sendApprovalEmail(request, icsContent);
      if (!emailResult.success) {
        console.warn('Email kon niet worden verzonden:', emailResult.error);
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
    
    // Reload requests
    loadPendingRequests();
  };

  const handleReject = async (request) => {
    if (!request) return;
    
    updateLeaveRequest(request.id, { status: 'rejected' });
    
    // Update GitHub Issue if exists
    if (request.githubIssueNumber) {
      try {
        await updateLeaveRequestIssue(request.githubIssueNumber, 'rejected');
        await addIssueComment(request.githubIssueNumber, '❌ **Afgewezen**\n\nDe verlofaanvraag is afgewezen.');
      } catch (error) {
        console.error('Error updating GitHub issue:', error);
      }
    }
    
    // Reload requests
    loadPendingRequests();
  };

  const getTypeText = (type) => {
    const types = {
      verlof: 'Verlof/Vakantie',
      ziekte: 'Dokter/Tandarts',
      persoonlijk: 'Bijzonder verlof',
    };
    return types[type] || type;
  };

  const calculateDays = (startDate, endDate) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return differenceInDays(end, start) + 1;
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
          <h1 className="text-2xl font-bold text-center">Verlofaanvragen In Behandeling</h1>
          <p className="text-center text-oet-blue-light mt-2">
            {requests.length} {requests.length === 1 ? 'aanvraag' : 'aanvragen'} in behandeling
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">✓</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Geen aanvragen in behandeling</h2>
            <p className="text-gray-600">Alle verlofaanvragen zijn verwerkt.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                {/* Employee Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-oet-blue flex items-center justify-center text-white text-2xl font-bold">
                      {request.employeeName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{request.employeeName}</h2>
                      {getEmployeeEmail(request.employeeNumber) && (
                        <p className="text-sm text-gray-600">{getEmployeeEmail(request.employeeNumber)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-oet-blue-light text-oet-blue-dark rounded-full text-sm font-medium">
                      {getTypeText(request.type)}
                    </span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      In behandeling
                    </span>
                  </div>
                </div>

                {/* Request Details */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Periode:</span>
                      <p className="text-gray-800">
                        {format(parseISO(request.startDate), 'd MMMM yyyy', { locale: nl })}
                        {request.endDate !== request.startDate && 
                          ` - ${format(parseISO(request.endDate), 'd MMMM yyyy', { locale: nl })}`
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

                    <div>
                      <span className="text-sm font-medium text-gray-600">Aangemaakt op:</span>
                      <p className="text-gray-800">
                        {format(parseISO(request.createdAt), 'd MMMM yyyy HH:mm', { locale: nl })}
                      </p>
                    </div>
                  </div>

                  {request.reason && (
                    <div className="mt-4">
                      <span className="text-sm font-medium text-gray-600">Reden:</span>
                      <p className="text-gray-800 mt-1">{request.reason}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleApprove(request)}
                      className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold shadow-md hover:bg-green-700 transition-colors"
                    >
                      ✓ Goedkeuren
                    </button>
                    <button
                      onClick={() => handleReject(request)}
                      className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold shadow-md hover:bg-red-700 transition-colors"
                    >
                      ✗ Afwijzen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto py-4 px-4 text-center border-t border-gray-200 mt-8">
        <p className="text-xs text-gray-600">
          Last build {new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })} By MLelieveld
        </p>
      </footer>
    </div>
  );
};

export default PendingRequestsPage;

