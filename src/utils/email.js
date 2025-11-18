// Email utility functions
// Uses EmailJS for sending emails (free, works from browser)
import emailjs from '@emailjs/browser';

// EmailJS configuration
// Get these from: https://www.emailjs.com/
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID_ADMIN = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_ADMIN || '';
const EMAILJS_TEMPLATE_ID_APPROVAL = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_APPROVAL || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

// Initialize EmailJS
if (EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

// Generate admin approval link
export const generateAdminLink = (adminToken) => {
  // Use origin + base path, ensuring we don't double the path
  const origin = window.location.origin;
  let basePath = window.location.pathname;
  
  // Remove trailing slash
  basePath = basePath.replace(/\/$/, '');
  
  // If pathname already contains /OET-verlof, use it as is
  // Otherwise, add /OET-verlof
  if (!basePath.includes('/OET-verlof')) {
    basePath = '/OET-verlof';
  } else {
    // If pathname is something like /OET-verlof/something, use just /OET-verlof
    const match = basePath.match(/^(\/OET-verlof)/);
    if (match) {
      basePath = match[1];
    }
  }
  
  return `${origin}${basePath}?token=${adminToken}`;
};

// Generate pending requests page link
export const generatePendingPageLink = () => {
  // Use origin + base path, ensuring we don't double the path
  const origin = window.location.origin;
  let basePath = window.location.pathname;
  
  // Remove trailing slash
  basePath = basePath.replace(/\/$/, '');
  
  // If pathname already contains /OET-verlof, use it as is
  // Otherwise, add /OET-verlof
  if (!basePath.includes('/OET-verlof')) {
    basePath = '/OET-verlof';
  } else {
    // If pathname is something like /OET-verlof/something, use just /OET-verlof
    const match = basePath.match(/^(\/OET-verlof)/);
    if (match) {
      basePath = match[1];
    }
  }
  
  return `${origin}${basePath}?page=pending`;
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

// Send email using EmailJS
export const sendEmail = async (templateId, templateParams) => {
  // Debug logging
  console.log('EmailJS Config Check:', {
    SERVICE_ID: EMAILJS_SERVICE_ID ? '✅ Set' : '❌ Missing',
    PUBLIC_KEY: EMAILJS_PUBLIC_KEY ? '✅ Set' : '❌ Missing',
    TEMPLATE_ID: templateId ? '✅ Set' : '❌ Missing',
    templateParams: templateParams
  });

  if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY) {
    const missing = [];
    if (!EMAILJS_SERVICE_ID) missing.push('VITE_EMAILJS_SERVICE_ID');
    if (!EMAILJS_PUBLIC_KEY) missing.push('VITE_EMAILJS_PUBLIC_KEY');
    console.warn('EmailJS not configured. Missing:', missing);
    return { success: false, error: `EmailJS not configured. Missing: ${missing.join(', ')}` };
  }

  if (!templateId) {
    console.warn('EmailJS template ID not provided');
    return { success: false, error: 'Template ID not provided' };
  }

  try {
    console.log('Sending email via EmailJS...', {
      serviceId: EMAILJS_SERVICE_ID,
      templateId: templateId,
      publicKey: EMAILJS_PUBLIC_KEY.substring(0, 5) + '...' // Only show first 5 chars for security
    });
    
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      templateId,
      templateParams
    );
    
    console.log('Email sent successfully:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', {
      code: error.code,
      text: error.text,
      message: error.message,
      status: error.status
    });
    return { success: false, error: error.text || error.message || 'Unknown error' };
  }
};

// Send admin notification email
export const sendAdminNotificationEmail = async (request, adminLink) => {
  if (!EMAILJS_TEMPLATE_ID_ADMIN) {
    return { success: false, error: 'EmailJS template not configured' };
  }

  const templateParams = {
    to_email: 'werkplaats@vandenoetelaar-metaal.nl',
    to_name: 'Beheerder',
    from_name: 'Beheerder@verlof',
    employee_name: request.employeeName,
    leave_type: request.type,
    start_date: new Date(request.startDate).toLocaleDateString('nl-NL'),
    end_date: request.endDate !== request.startDate 
      ? new Date(request.endDate).toLocaleDateString('nl-NL')
      : '',
    reason: request.reason || '',
    admin_link: adminLink,
  };

  return await sendEmail(EMAILJS_TEMPLATE_ID_ADMIN, templateParams);
};

// Send approval email with ICS attachment
export const sendApprovalEmail = async (request, icsContent) => {
  if (!EMAILJS_TEMPLATE_ID_APPROVAL) {
    return { success: false, error: 'EmailJS template not configured' };
  }

  const templateParams = {
    to_email: 'werkplaats@vandenoetelaar-metaal.nl',
    to_name: 'Beheerder',
    from_name: 'Beheerder@verlof',
    employee_name: request.employeeName,
    leave_type: request.type,
    start_date: new Date(request.startDate).toLocaleDateString('nl-NL'),
    end_date: request.endDate !== request.startDate 
      ? new Date(request.endDate).toLocaleDateString('nl-NL')
      : '',
    start_time: request.startTime || '',
    end_time: request.endTime || '',
    reason: request.reason || '',
    ics_content: icsContent,
  };

  return await sendEmail(EMAILJS_TEMPLATE_ID_APPROVAL, templateParams);
};

