// Helper script om EmailJS configuratie te controleren
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
  const lines = envContent.split('\n');
  
  const config = {};
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        config[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  console.log('\n📧 EmailJS Configuratie Check:\n');
  console.log('='.repeat(50));
  
  const checks = [
    { key: 'VITE_EMAILJS_SERVICE_ID', name: 'Service ID', required: true },
    { key: 'VITE_EMAILJS_PUBLIC_KEY', name: 'Public Key', required: true },
    { key: 'VITE_EMAILJS_TEMPLATE_ID_ADMIN', name: 'Template ID (Admin)', required: true },
    { key: 'VITE_EMAILJS_TEMPLATE_ID_APPROVAL', name: 'Template ID (Approval)', required: true },
  ];

  let allOk = true;
  checks.forEach(check => {
    const value = config[check.key];
    const status = value && value.length > 0 ? '✅' : '❌';
    const displayValue = value && value.length > 0 
      ? (value.length > 30 ? value.substring(0, 30) + '...' : value)
      : 'NIET INGEVULD';
    
    console.log(`${status} ${check.name}: ${displayValue}`);
    
    if (check.required && (!value || value.length === 0)) {
      allOk = false;
    }
  });

  console.log('='.repeat(50));
  
  if (allOk) {
    console.log('\n✅ Alle configuratie is compleet!');
    console.log('💡 Herstart de development server om de wijzigingen te laden.\n');
  } else {
    console.log('\n⚠️  Configuratie is nog niet compleet.');
    console.log('\n📝 Volgende stappen:');
    console.log('1. Haal je Public Key op: https://dashboard.emailjs.com/ → Account → General');
    console.log('2. Maak 2 email templates aan in EmailJS');
    console.log('3. Vul de waarden in in het .env bestand');
    console.log('4. Herstart de development server\n');
  }
} catch (error) {
  console.error('❌ Kon .env bestand niet lezen:', error.message);
  console.log('\n💡 Maak eerst een .env bestand aan.\n');
}

