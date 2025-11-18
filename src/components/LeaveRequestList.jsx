import { useState, useEffect } from 'react';
import { getLeaveRequests, updateLeaveRequest, deleteLeaveRequest } from '../utils/storage';
import { format, parseISO, differenceInDays } from 'date-fns';
import nl from 'date-fns/locale/nl';

const LeaveRequestList = ({ refreshTrigger }) => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRequests();
  }, [refreshTrigger]);

  const loadRequests = () => {
    const allRequests = getLeaveRequests();
    setRequests(allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  };

  const handleStatusChange = (id, newStatus) => {
    updateLeaveRequest(id, { status: newStatus });
    loadRequests();
  };

  const handleDelete = (id) => {
    if (window.confirm('Weet u zeker dat u deze aanvraag wilt verwijderen?')) {
      deleteLeaveRequest(id);
      loadRequests();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Goedgekeurd';
      case 'rejected':
        return 'Afgewezen';
      default:
        return 'In behandeling';
    }
  };

  const getTypeText = (type) => {
    const types = {
      verlof: 'Verlof',
      ziekte: 'Ziekte',
      persoonlijk: 'Persoonlijk',
      vakantie: 'Vakantie',
      ander: 'Ander',
    };
    return types[type] || type;
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  const calculateDays = (startDate, endDate) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return differenceInDays(end, start) + 1;
  };

  return (
    <div className="bg-white">
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-oet-blue text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === 'pending'
                ? 'bg-oet-blue text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            In behandeling
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === 'approved'
                ? 'bg-oet-blue text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Goedgekeurd
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === 'rejected'
                ? 'bg-oet-blue text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Afgewezen
          </button>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Geen verlofaanvragen gevonden.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {request.employeeName}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                    <span className="px-3 py-1 bg-oet-blue-light text-oet-blue-dark rounded-full text-xs font-medium">
                      {getTypeText(request.type)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Periode:</span>{' '}
                      {format(parseISO(request.startDate), 'd MMMM yyyy', { locale: nl })} -{' '}
                      {format(parseISO(request.endDate), 'd MMMM yyyy', { locale: nl })}
                    </p>
                    <p>
                      <span className="font-medium">Aantal dagen:</span>{' '}
                      {calculateDays(request.startDate, request.endDate)} dag(en)
                    </p>
                    <p className="mt-2 text-gray-700">{request.reason}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Aangemaakt op: {format(parseISO(request.createdAt), 'd MMMM yyyy HH:mm', { locale: nl })}
                    </p>
                  </div>
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(request.id, 'approved')}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium active:bg-green-700"
                    >
                      Goedkeuren
                    </button>
                    <button
                      onClick={() => handleStatusChange(request.id, 'rejected')}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium active:bg-red-700"
                    >
                      Afwijzen
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(request.id)}
                    className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-medium active:bg-gray-300"
                  >
                    Verwijderen
                  </button>
                </div>
              )}

              {request.status !== 'pending' && (
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleStatusChange(request.id, 'pending')}
                    className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-medium active:bg-gray-300"
                  >
                    Terugzetten
                  </button>
                  <button
                    onClick={() => handleDelete(request.id)}
                    className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-medium active:bg-gray-300"
                  >
                    Verwijderen
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaveRequestList;

