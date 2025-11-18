import { useState, useEffect } from 'react';
import { getLeaveRequests } from '../utils/storage';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import nl from 'date-fns/locale/nl';

const CalendarView = ({ refreshTrigger }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    loadRequests();
  }, [refreshTrigger]);

  const loadRequests = () => {
    setRequests(getLeaveRequests());
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week for the month start
  const firstDayOfWeek = monthStart.getDay();
  const daysBeforeMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday = 0

  const getRequestsForDate = (date) => {
    return requests.filter(request => {
      const start = parseISO(request.startDate);
      const end = parseISO(request.endDate);
      return date >= start && date <= end;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const weekDays = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  return (
    <div className="bg-white">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={previousMonth}
          className="p-2 active:bg-gray-100 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-gray-700 text-center flex-1">
          {format(currentDate, 'MMMM yyyy', { locale: nl })}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 active:bg-gray-100 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="p-1 text-center font-semibold text-gray-700 text-xs">
            {day}
          </div>
        ))}

        {/* Empty cells before month starts */}
        {Array.from({ length: daysBeforeMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square"></div>
        ))}

        {/* Days of the month */}
        {daysInMonth.map(day => {
          const dayRequests = getRequestsForDate(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`aspect-square border border-gray-200 rounded-lg p-1 ${
                isToday ? 'bg-blue-50 border-blue-400' : ''
              }`}
            >
              <div className={`text-xs font-medium mb-0.5 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayRequests.slice(0, 1).map(request => (
                  <div
                    key={request.id}
                    className={`${getStatusColor(request.status)} text-white text-[10px] p-0.5 rounded truncate`}
                    title={`${request.employeeName}`}
                  >
                    {request.employeeName.split(' ')[0]}
                  </div>
                ))}
                {dayRequests.length > 1 && (
                  <div className="text-[10px] text-gray-500">
                    +{dayRequests.length - 1}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-3 justify-center flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span className="text-xs text-gray-700">In behandeling</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-xs text-gray-700">Goedgekeurd</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-xs text-gray-700">Afgewezen</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;

