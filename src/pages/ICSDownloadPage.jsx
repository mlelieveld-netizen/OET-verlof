import { useEffect } from 'react';
import { getLeaveRequestByToken } from '../utils/storage';
import { generateICSFile, downloadICSFile } from '../utils/email';

const ICSDownloadPage = () => {
  useEffect(() => {
    const downloadICS = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('ics') || urlParams.get('token'); // Support both ?ics= and ?token=
        
        if (!token) {
          document.body.innerHTML = '<div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;"><h1 style="color: #d32f2f;">Fout</h1><p>Geen token opgegeven.</p></div>';
          return;
        }

        const request = await getLeaveRequestByToken(token);
        
        if (!request) {
          document.body.innerHTML = '<div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;"><h1 style="color: #d32f2f;">Fout</h1><p>Verlofaanvraag niet gevonden.</p></div>';
          return;
        }

        // Generate and download ICS file
        downloadICSFile(request);
        
        // Show success message
        document.body.innerHTML = `
          <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
            <h1 style="color: #2C3E50;">✅ Agenda item gedownload</h1>
            <p style="margin-top: 20px;">Het .ics bestand is gedownload. Je kunt deze pagina nu sluiten.</p>
            <p style="margin-top: 10px; color: #666; font-size: 14px;">
              Als het bestand niet automatisch is gedownload, controleer je download instellingen.
            </p>
          </div>
        `;
      } catch (error) {
        console.error('Error downloading ICS:', error);
        document.body.innerHTML = `
          <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
            <h1 style="color: #d32f2f;">Fout</h1>
            <p>Er is een fout opgetreden bij het downloaden van het agenda item.</p>
            <p style="margin-top: 10px; color: #666; font-size: 12px;">${error.message || 'Onbekende fout'}</p>
          </div>
        `;
      }
    };

    downloadICS();
  }, []);

  // Return a simple loading message while processing
  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <p>Agenda item wordt voorbereid...</p>
    </div>
  );
};

export default ICSDownloadPage;

