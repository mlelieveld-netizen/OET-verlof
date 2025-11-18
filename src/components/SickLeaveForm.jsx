import { useState, useEffect, useRef } from 'react';
import { saveLeaveRequest, getLeaveRequests } from '../utils/storage';
import { getEmployeeByNumber, searchEmployees, getEmployeeEmail } from '../data/employees';
import { generateAdminLink, sendAdminNotificationEmail } from '../utils/email';
import { createLeaveRequestIssue } from '../utils/github';

const SickLeaveForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    employeeNumber: '',
    employeeName: '',
    reason: '',
  });

  const [errors, setErrors] = useState({});
  const [employeeSearchValue, setEmployeeSearchValue] = useState('');
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  const employeeInputRef = useRef(null);
  const employeeSuggestionsRef = useRef(null);

  // Lookup employee by number
  const lookupEmployee = (employeeNumber) => {
    const employee = getEmployeeByNumber(employeeNumber);
    return employee || null;
  };

  // Handle employee selection from suggestions
  const handleEmployeeSelect = (employee) => {
    setFormData(prev => ({
      ...prev,
      employeeNumber: employee.number,
      employeeName: employee.name,
    }));
    setEmployeeSearchValue(employee.name);
    setShowEmployeeSuggestions(false);
    setEmployeeSuggestions([]);
  };

  // Handle employee search input
  const handleEmployeeSearchChange = (value) => {
    setEmployeeSearchValue(value);
    
    // Check if input is numeric (employee number)
    const numericValue = value.replace(/\D/g, '');
    if (numericValue && numericValue.length >= 3) {
      const employee = lookupEmployee(numericValue);
      if (employee) {
        setFormData(prev => ({
          ...prev,
          employeeNumber: numericValue,
          employeeName: employee,
        }));
        setShowEmployeeSuggestions(false);
        setEmployeeSearchValue(employee);
        return;
      }
    }
    
    // Search by name if 3+ characters
    if (value.length >= 3) {
      const suggestions = searchEmployees(value);
      setEmployeeSuggestions(suggestions);
      setShowEmployeeSuggestions(suggestions.length > 0);
    } else {
      setEmployeeSuggestions([]);
      setShowEmployeeSuggestions(false);
    }
    
    // Update form data
    if (value.length < 3) {
      setFormData(prev => ({
        ...prev,
        employeeNumber: numericValue || '',
        employeeName: numericValue ? (lookupEmployee(numericValue) || '') : '',
      }));
    }
    
    if (errors.employeeNumber) {
      setErrors(prev => ({
        ...prev,
        employeeNumber: '',
      }));
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        employeeSuggestionsRef.current &&
        !employeeSuggestionsRef.current.contains(event.target) &&
        employeeInputRef.current &&
        !employeeInputRef.current.contains(event.target)
      ) {
        setShowEmployeeSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.employeeNumber || !formData.employeeNumber.toString().trim()) {
      newErrors.employeeNumber = 'Personeelsnummer is verplicht';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Startdatum is verplicht';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'Einddatum is verplicht';
    }
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = 'Einddatum moet na startdatum zijn';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // Create request data with type 'ziekte'
    const requestData = {
      ...formData,
      type: 'ziekte',
      duration: 'dag',
      startTime: '',
      endTime: '',
      reason: formData.reason || 'Ziek gemeld',
    };
    
    const savedRequest = saveLeaveRequest(requestData);
    
    // Generate admin link
    const adminLink = generateAdminLink(savedRequest.adminToken);
    
    // Send email notification to admin
    try {
      const emailResult = await sendAdminNotificationEmail(savedRequest, adminLink);
      if (emailResult.success) {
        alert(`Ziekmelding opgeslagen!\n\nEmail is verzonden naar werkplaats@vandenoetelaar-metaal.nl\nBeheerder link: ${adminLink}`);
      } else {
        console.warn('Email kon niet worden verzonden:', emailResult.error);
        // Fallback to GitHub Issue
        try {
          const issue = await createLeaveRequestIssue(savedRequest, adminLink);
          if (issue) {
            const requests = getLeaveRequests();
            const index = requests.findIndex(r => r.id === savedRequest.id);
            if (index !== -1) {
              requests[index].githubIssueNumber = issue.number;
              localStorage.setItem('verlof-aanvragen', JSON.stringify(requests));
            }
            alert(`Ziekmelding opgeslagen!\n\nGitHub Issue #${issue.number} is aangemaakt.\nBeheerder link: ${adminLink}`);
          } else {
            const errorDetails = emailResult.error || 'Onbekende fout';
            alert(`Ziekmelding opgeslagen!\n\nBeheerder link: ${adminLink}\n\n⚠️ Email kon niet worden verzonden.\n\nFout: ${errorDetails}\n\nOpen de browser console (F12) voor meer details.\n\nDeel de link handmatig met de beheerder.`);
          }
        } catch (error) {
          console.error('Error creating GitHub issue:', error);
          alert(`Ziekmelding opgeslagen!\n\nBeheerder link: ${adminLink}\n\nLet op: Email kon niet worden verzonden. Deel de link handmatig met de beheerder.`);
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert(`Ziekmelding opgeslagen!\n\nBeheerder link: ${adminLink}\n\nLet op: Email kon niet worden verzonden. Deel de link handmatig met de beheerder.`);
    }
    
    // Reset form
    setFormData({
      startDate: '',
      endDate: '',
      employeeNumber: '',
      employeeName: '',
      reason: '',
    });
    setEmployeeSearchValue('');
    setEmployeeSuggestions([]);
    setShowEmployeeSuggestions(false);
    setErrors({});
    
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle keyboard input for barcode scanners
  const handleEmployeeNumberKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white min-h-[calc(100vh-120px)] pb-24">
      <form onSubmit={handleSubmit} className="px-4">
        {/* Employee Selection */}
        <div className="pt-4">
          <label htmlFor="employeeNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Medewerker*
          </label>
          <div className="relative" ref={employeeInputRef}>
            <input
              id="employeeNumber"
              type="text"
              value={employeeSearchValue}
              onChange={(e) => handleEmployeeSearchChange(e.target.value)}
              onKeyDown={handleEmployeeNumberKeyDown}
              placeholder="Scan personeelsnummer of zoek op naam..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-oet-blue focus:border-transparent ${
                errors.employeeNumber ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.employeeNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.employeeNumber}</p>
            )}
            
            {/* Employee Suggestions Dropdown */}
            {showEmployeeSuggestions && employeeSuggestions.length > 0 && (
              <div
                ref={employeeSuggestionsRef}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {employeeSuggestions.map((employee) => (
                  <button
                    key={employee.number}
                    type="button"
                    onClick={() => handleEmployeeSelect(employee)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-oet-blue flex items-center justify-center text-white font-bold">
                      {employee.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-gray-800 font-medium">{employee.name}</div>
                      <div className="text-sm text-gray-500">#{employee.number}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 my-4"></div>

        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
            Startdatum ziekte*
          </label>
          <input
            id="startDate"
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            min={today}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-oet-blue focus:border-transparent ${
              errors.startDate ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
          )}
        </div>

        <div className="border-t border-gray-200 my-4"></div>

        {/* End Date */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
            Verwachtte einddatum*
          </label>
          <input
            id="endDate"
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            min={formData.startDate || today}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-oet-blue focus:border-transparent ${
              errors.endDate ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Indien onbekend, kies een geschatte datum. Deze kan later worden aangepast.
          </p>
        </div>

        <div className="border-t border-gray-200 my-4"></div>

        {/* Reason (Optional) */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
            Opmerking (optioneel)
          </label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows={3}
            placeholder="Eventuele opmerkingen over de ziekmelding..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-oet-blue focus:border-transparent"
          />
        </div>

        {/* Submit Button - Fixed at bottom */}
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto z-20">
          <button
            type="submit"
            className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-md active:bg-red-700"
          >
            Ziek Melden
          </button>
        </div>
      </form>
    </div>
  );
};

export default SickLeaveForm;

