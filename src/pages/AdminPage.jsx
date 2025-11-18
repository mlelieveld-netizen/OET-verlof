import { useState, useEffect } from 'react';
import { getLeaveRequestByToken, updateLeaveRequest } from '../utils/storage';
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

  useEffect(() => {
    if (!token) {
      setError('Geen token opgegeven');
      setLoading(false);
      return;
    }

    // Debug logging
    console.log('AdminPage: Looking for token:', token);
    const allRequests = JSON.parse(localStorage.getItem('verlof-aanvragen') || '[]');
    console.log('AdminPage: All requests:', allRequests);
    console.log('AdminPage: All tokens:', allRequests.map(r => r.adminToken));

    const leaveRequest = getLeaveRequestByToken(token);
    if (!leaveRequest) {
      console.error('AdminPage: Request not found for token:', token);
      setError(`Verlofaanvraag niet gevonden voor token: ${token}`);
      setLoading(false);
      return;
    }

    console.log('AdminPage: Found request:', leaveRequest);
    setRequest(leaveRequest);
    setLoading(false);
  }, [token]);

  const handleApprove = async () => {
    if (!request) return;
    
    updateLeaveRequest(request.id, { status: 'approved' });
    setActionTaken(true);
    
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

  const handleReject = async () => {
    if (!request) return;
    
    updateLeaveRequest(request.id, { status: 'rejected' });
    setActionTaken(true);
    
    // Update GitHub Issue if exists
    if (request.githubIssueNumber) {
      try {
        await updateLeaveRequestIssue(request.githubIssueNumber, 'rejected');
        await addIssueComment(request.githubIssueNumber, '❌ **Afgewezen**\n\nDe verlofaanvraag is afgewezen.');
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

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Fout</h1>
          <p className="text-gray-600">{error || 'Verlofaanvraag niet gevonden'}</p>
        </div>
      </div>
    );
  }

  if (actionTaken) {
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
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex justify-center items-center mb-4">
            <img 
              src="/OET-verlof/logo.jpg" 
              alt="OET Logo" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-center">Verlofaanvraag Beoordelen</h1>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">
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
                  onClick={handleReject}
                  className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-md hover:bg-red-700 transition-colors"
                >
                  Afwijzen
                </button>
              </div>
            </div>
          )}

          {request.status !== 'pending' && (
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <p className="text-gray-700">
                  Deze aanvraag is al {request.status === 'approved' ? 'goedgekeurd' : 'afgewezen'}.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

