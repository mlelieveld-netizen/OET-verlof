import { useState, useEffect, useRef } from 'react';
import { saveLeaveRequest } from '../utils/storage';
import { getEmployeeByNumber, getAllEmployees } from '../data/employees';

const LeaveRequestForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    type: 'adv',
    duration: 'dag',
    employeeNumber: '',
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
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      
      if (isScanning) {
        // Stop scanning
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
            scannerRef.current.clear();
          } catch (e) {
            console.log('Error stopping scanner:', e);
          }
          setIsScanning(false);
        }
        return;
      }

      setIsScanning(true);
      
      // Wait a bit for the DOM to update
      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode("barcode-scanner");
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 300, height: 300 },
              formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.QR_CODE
              ]
            },
            (decodedText) => {
              // Barcode scanned successfully - extract number from scanned text
              // Remove any non-numeric characters
              const employeeNumber = decodedText.replace(/\D/g, '');
              if (employeeNumber) {
                handleEmployeeNumberChange(employeeNumber);
                
                // Wait 2 seconds before stopping the scanner
                setTimeout(() => {
                  html5QrCode.stop().then(() => {
                    html5QrCode.clear();
                    setIsScanning(false);
                  }).catch(() => {
                    setIsScanning(false);
                  });
                }, 2000);
              }
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
      }, 100);
    } catch (err) {
      console.error('Error loading scanner library:', err);
      setIsScanning(false);
      alert('Kan scanner library niet laden.');
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
    if (formData.duration === 'uur') {
      if (!formData.startTime) {
        newErrors.startTime = 'Starttijd is verplicht';
      }
      if (!formData.endTime) {
        newErrors.endTime = 'Eindtijd is verplicht';
      }
      if (formData.startTime && formData.endTime) {
        const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
        const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
        const startTotal = startHours * 60 + startMinutes;
        const endTotal = endHours * 60 + endMinutes;
        
        if (startTotal >= endTotal && formData.startDate === formData.endDate) {
          newErrors.endTime = 'Eindtijd moet na starttijd zijn';
        }
      }
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
      calculatedHours: formData.duration === 'uur' ? calculateHours() : null,
    };
    
    saveLeaveRequest(requestData);
    
    // Reset form
    setFormData({
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
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

  // Lookup employee by number
  const lookupEmployee = (employeeNumber) => {
    const employee = getEmployeeByNumber(employeeNumber);
    return employee || `Medewerker ${employeeNumber}`;
  };

  const handleEmployeeNumberChange = (value) => {
    // Remove any non-numeric characters for employee number
    const cleanedValue = value.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      employeeNumber: cleanedValue,
      employeeName: cleanedValue ? lookupEmployee(cleanedValue) : '',
    }));
    if (errors.employeeNumber) {
      setErrors(prev => ({
        ...prev,
        employeeNumber: '',
      }));
    }
  };

  // Handle keyboard input for barcode scanners (they often send Enter after scanning)
  const handleEmployeeNumberKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If there's a value, it might be from a barcode scanner
      if (formData.employeeNumber) {
        // Already handled by onChange
      }
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

  // Calculate hours between start and end time
  const calculateHours = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    
    const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
    const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    // Handle case where end time is next day
    let diffMinutes = endTotalMinutes - startTotalMinutes;
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // Add 24 hours
    }
    
    const hours = diffMinutes / 60;
    return Math.round(hours * 10) / 10; // Round to 1 decimal
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
                onKeyDown={handleEmployeeNumberKeyDown}
                placeholder="Personeelsnummer invoeren of scannen"
                autoFocus={false}
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
              <div id="barcode-scanner" className="w-full h-64 rounded-lg overflow-hidden border-2 border-blue-500 bg-black"></div>
              <p className="text-sm text-gray-600 text-center mt-2">Richt de camera op de streepjescode</p>
              <button
                type="button"
                onClick={startBarcodeScan}
                className="w-full mt-2 bg-red-600 text-white py-2 px-4 rounded-lg font-medium"
              >
                Stop scannen
              </button>
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

        {/* Time Selection - Only show when "Een paar uur" is selected */}
        {formData.duration === 'uur' && (
          <>
            <div className="border-t border-gray-200 my-4"></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tijdvlak
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Starttijd*
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className={`w-full bg-white border rounded-lg px-4 py-3 ${
                      errors.startTime ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-xs text-red-600">{errors.startTime}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Eindtijd*
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    min={formData.startTime}
                    className={`w-full bg-white border rounded-lg px-4 py-3 ${
                      errors.endTime ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.endTime && (
                    <p className="mt-1 text-xs text-red-600">{errors.endTime}</p>
                  )}
                </div>
              </div>
              {formData.startTime && formData.endTime && calculateHours() > 0 && (
                <div className="mt-3 px-4 py-2 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Totaal aantal uren:</span>
                    <span className="text-lg font-bold text-blue-600">{calculateHours()} uur</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

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

