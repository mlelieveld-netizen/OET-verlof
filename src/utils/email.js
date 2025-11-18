// Email utility functions
// Note: Actual email sending requires a backend service
// These functions prepare the data for email sending

// Generate admin approval link
export const generateAdminLink = (adminToken) => {
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
  // Remove trailing slash if present
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}?token=${adminToken}`;
};

// Generate ICS calendar file content
export const generateICSFile = (request) => {
  const startDate = new Date(request.startDate);
  const endDate = new Date(request.endDate);
  
  // Set time if provided
  if (request.startTime) {
    const [hours, minutes] = request.startTime.split(':').map(Number);
    startDate.setHours(hours, minutes, 0);
  } else {
    startDate.setHours(9, 0, 0); // Default to 9:00 AM
  }
  
  if (request.endTime) {
    const [hours, minutes] = request.endTime.split(':').map(Number);
    endDate.setHours(hours, minutes, 0);
  } else {
    endDate.setHours(17, 0, 0); // Default to 5:00 PM
  }
  
  // Format dates for ICS (YYYYMMDDTHHMMSS)
  const formatICSDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };
  
  const dtstart = formatICSDate(startDate);
  const dtend = formatICSDate(endDate);
  const dtstamp = formatICSDate(new Date());
  
  const summary = `Verlof: ${request.employeeName}`;
  const description = `Verlofaanvraag voor ${request.employeeName}\nType: ${request.type}\n${request.reason ? `Reden: ${request.reason}` : ''}`;
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OET Verlof//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${request.id}@oetelaar.nl`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsContent;
};

// Download ICS file
export const downloadICSFile = (request) => {
  const icsContent = generateICSFile(request);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `verlof-${request.employeeName.replace(/\s+/g, '-')}-${request.startDate}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Generate mailto link for sending email
export const generateMailtoLink = (to, subject, body) => {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
};

// Generate email content for admin notification
export const generateAdminEmailContent = (request, adminLink) => {
  const subject = `Verlofaanvraag van ${request.employeeName}`;
  const body = `Er is een nieuwe verlofaanvraag ingediend:\n\n` +
    `Medewerker: ${request.employeeName}\n` +
    `Type: ${request.type}\n` +
    `Datum: ${new Date(request.startDate).toLocaleDateString('nl-NL')}${request.endDate !== request.startDate ? ` - ${new Date(request.endDate).toLocaleDateString('nl-NL')}` : ''}\n` +
    `${request.reason ? `Reden: ${request.reason}\n` : ''}\n` +
    `Klik op de volgende link om de aanvraag te beoordelen:\n${adminLink}`;
  
  return { subject, body };
};

// Generate email content for approval notification (to admin)
export const generateApprovalEmailContent = (request) => {
  const subject = `Verlofaanvraag goedgekeurd - ${request.employeeName} - Agenda item`;
  const body = `De verlofaanvraag is goedgekeurd:\n\n` +
    `Medewerker: ${request.employeeName}\n` +
    `Type: ${request.type}\n` +
    `Datum: ${new Date(request.startDate).toLocaleDateString('nl-NL')}${request.endDate !== request.startDate ? ` - ${new Date(request.endDate).toLocaleDateString('nl-NL')}` : ''}\n` +
    `${request.startTime && request.endTime ? `Tijd: ${request.startTime} - ${request.endTime}\n` : ''}` +
    `${request.reason ? `Reden: ${request.reason}\n` : ''}\n\n` +
    `Het agenda item (ICS bestand) is bijgevoegd. Voeg deze toe aan je agenda.`;
  
  return { subject, body };
};

