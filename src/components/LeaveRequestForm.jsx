import { useState, useEffect, useRef } from 'react';
import { saveLeaveRequest } from '../utils/storage';

const LeaveRequestForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'adv',
    duration: 'dag',
    employeeName: '',
    reason: '',
  });

  const [errors, setErrors] = useState({});
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const typeDropdownRef = useRef(null);
  const scannerRef = useRef(null);
  const employeeInputRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setShowTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle barcode scanning
  const startBarcodeScan = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      if (isScanning) {
        // Stop scanning
        if (scannerRef.current) {
          await scannerRef.current.stop();
          scannerRef.current.clear();
          setIsScanning(false);
        }
        return;
      }

      setIsScanning(true);
      const html5QrCode = new Html5Qrcode("barcode-scanner");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // Barcode scanned successfully
          setFormData(prev => ({ 
            ...prev, 
            employeeNumber: decodedText,
            employeeName: `Medewerker ${decodedText}` // You can replace this with actual lookup
          }));
          html5QrCode.stop();
          html5QrCode.clear();
          setIsScanning(false);
        },
        (errorMessage) => {
          // Ignore scanning errors (they happen frequently during scanning)
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setIsScanning(false);
      alert('Kan scanner niet starten. Controleer of camera toegang is verleend.');
    }
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear();
      }
    };
  }, []);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.employeeNumber.trim()) {
      newErrors.employeeNumber = 'Personeelsnummer is verplicht';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Datum is verplicht';
    }
    if (formData.duration === 'meerdere' && !formData.endDate) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // Set endDate to startDate if duration is not "meerdere"
    const requestData = {
      ...formData,
      endDate: formData.duration === 'meerdere' ? formData.endDate : formData.startDate,
    };
    
    saveLeaveRequest(requestData);
    
    // Reset form
    setFormData({
      startDate: '',
      endDate: '',
      type: 'adv',
      duration: 'dag',
      employeeNumber: '',
      employeeName: '',
      reason: '',
    });
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

  const leaveTypes = [
    { id: 'adv', name: 'ADV-dagen', icon: '📅', available: '18 uur beschikbaar', color: 'bg-orange-100' },
    { id: 'verlof', name: 'Verlof', icon: '🏖️', available: 'Onbeperkt', color: 'bg-blue-100' },
    { id: 'ziekte', name: 'Ziekte', icon: '🏥', available: '', color: 'bg-red-100' },
    { id: 'persoonlijk', name: 'Persoonlijk', icon: '👤', available: '', color: 'bg-purple-100' },
  ];

  // Mock employee lookup - in production this would be an API call
  const lookupEmployee = (employeeNumber) => {
    const employees = {
      '12345': 'Zoe Kleef',
      '23456': 'Jan Jansen',
      '34567': 'Marie van der Berg',
      '45678': 'Piet de Vries',
    };
    return employees[employeeNumber] || `Medewerker ${employeeNumber}`;
  };

  const handleEmployeeNumberChange = (value) => {
    setFormData(prev => ({
      ...prev,
      employeeNumber: value,
      employeeName: value ? lookupEmployee(value) : '',
    }));
    if (errors.employeeNumber) {
      setErrors(prev => ({
        ...prev,
        employeeNumber: '',
      }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const selectedType = leaveTypes.find(t => t.id === formData.type) || leaveTypes[0];

  return (
    <div className="bg-white min-h-[calc(100vh-120px)] pb-24">
      <form onSubmit={handleSubmit} className="px-4">
        {/* Colleague Selection */}
        <div className="pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voor welke collega?*
          </label>
          <div className="space-y-2">
            <div className="relative">
              <input
                ref={employeeInputRef}
                type="text"
                inputMode="numeric"
                value={formData.employeeNumber}
                onChange={(e) => handleEmployeeNumberChange(e.target.value)}
                placeholder="Personeelsnummer invoeren"
                className={`w-full bg-white border rounded-lg px-4 py-4 pr-12 ${
                  errors.employeeNumber ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              <button
                type="button"
                onClick={startBarcodeScan}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                title={isScanning ? "Stop scannen" : "Streepjescode scannen"}
              >
                {isScanning ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                )}
              </button>
            </div>
            {formData.employeeName && (
              <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {formData.employeeName.charAt(0)}
                </div>
                <span className="text-gray-800 font-medium">{formData.employeeName}</span>
              </div>
            )}
            {errors.employeeNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.employeeNumber}</p>
            )}
          </div>
          
          {/* Barcode Scanner */}
          {isScanning && (
            <div className="mt-4">
              <div id="barcode-scanner" className="w-full rounded-lg overflow-hidden border-2 border-blue-500"></div>
              <p className="text-sm text-gray-600 text-center mt-2">Richt de camera op de streepjescode</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 my-4"></div>

        {/* Leave Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verloftype*
          </label>
          <div className="relative" ref={typeDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setShowTypeDropdown(!showTypeDropdown);
                setShowEmployeeDropdown(false);
              }}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${selectedType.color} flex items-center justify-center text-xl`}>
                  {selectedType.icon}
                </div>
                <div className="text-left">
                  <div className="text-gray-800 font-medium">{selectedType.name}</div>
                  {selectedType.available && (
                    <div className="text-sm text-gray-500">{selectedType.available}</div>
                  )}
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showTypeDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                {leaveTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, type: type.id }));
                      setShowTypeDropdown(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center text-xl`}>
                      {type.icon}
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-gray-800 font-medium">{type.name}</div>
                      {type.available && (
                        <div className="text-sm text-gray-500">{type.available}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 my-4"></div>

        {/* Duration Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Duur
          </label>
          <div className="flex gap-2 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, duration: 'uur' }))}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                formData.duration === 'uur'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Een paar uur
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, duration: 'dag' }))}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                formData.duration === 'dag'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Een hele dag
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, duration: 'meerdere' }))}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                formData.duration === 'meerdere'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Meerdere dagen
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 my-4"></div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Welke dag?*
          </label>
          <div className="relative">
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={`w-full bg-white border rounded-lg px-4 py-4 pr-12 ${
                errors.startDate ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          {formData.startDate && (
            <div className="mt-2 text-sm text-gray-600">
              {formatDate(formData.startDate)}
            </div>
          )}
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
          )}
        </div>

        {/* End Date (only for multiple days) */}
        {formData.duration === 'meerdere' && (
          <>
            <div className="border-t border-gray-200 my-4"></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tot en met*
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate}
                  className={`w-full bg-white border rounded-lg px-4 py-4 pr-12 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </>
        )}

        {/* Submit Button - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-md active:bg-blue-700"
          >
            Aanvragen
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveRequestForm;

