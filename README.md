# Verlof Aanvraag Systeem

Een moderne webapplicatie voor het aanvragen en beheren van verlofaanvragen.

## Functies

- ✅ **Nieuwe verlofaanvraag**: Eenvoudig formulier om verlof aan te vragen
- 📋 **Overzicht**: Bekijk alle verlofaanvragen met filters
- 📅 **Kalenderweergave**: Visuele kalender met alle verlofaanvragen
- 🔄 **Statusbeheer**: Goedkeuren of afwijzen van aanvragen (alleen via email link voor beheerders)
- 💾 **Lokale opslag**: Data wordt opgeslagen in de browser (localStorage)
- 📧 **Email Notificaties**: Automatische email notificaties via EmailJS (Gmail)

## 📧 Email Notificaties via EmailJS

De app gebruikt **EmailJS** voor het automatisch versturen van emails via Gmail. Dit is **gratis** (200 emails per maand) en werkt direct vanuit de browser!

### Hoe het werkt:

1. **Bij verlofaanvraag**: Er wordt automatisch een email verzonden naar de beheerder
2. **Email notificatie**: De beheerder ontvangt een email met alle details en een directe link
3. **Beheerder link**: In de email staat een directe link naar de beheerderspagina
4. **Bij goedkeuring**: De beheerder ontvangt een email met een agenda item (ICS bestand)

### EmailJS Setup:

Voor het versturen van emails heb je een EmailJS account nodig (gratis):

1. **Maak een EmailJS account aan**:
   - Ga naar: https://www.emailjs.com/
   - Maak een gratis account aan (200 emails per maand gratis)
   - Log in

2. **Configureer Gmail Service**:
   - Ga naar "Email Services" in het dashboard
   - Klik op "Add New Service" → Kies "Gmail"
   - Koppel je Gmail account
   - Noteer de **Service ID** (bijv. `service_xxxxx`)

3. **Maak Email Templates**:
   - Ga naar "Email Templates"
   - Maak 2-3 templates aan (zie `EMAILJS_SETUP.md` voor details):
     - Admin notificatie (verplicht)
     - Goedkeuring notificatie (verplicht)
     - Intrekking notificatie (optioneel, gebruikt admin template als fallback)
   - Noteer de **Template IDs**

4. **Haal Public Key op**:
   - Ga naar "Account" → "General"
   - Kopieer je **Public Key**

5. **Configureer voor GitHub Pages**:
   - Ga naar: https://github.com/mlelieveld-netizen/OET-verlof/settings/secrets/actions
   - Voeg de volgende secrets toe:
     - `VITE_EMAILJS_SERVICE_ID` = je Service ID
     - `VITE_EMAILJS_PUBLIC_KEY` = je Public Key
     - `VITE_EMAILJS_TEMPLATE_ID_ADMIN` = Template ID voor admin notificatie
     - `VITE_EMAILJS_TEMPLATE_ID_APPROVAL` = Template ID voor goedkeuring
     - `VITE_EMAILJS_TEMPLATE_ID_DELETION` = Template ID voor intrekking (optioneel)

6. **Voor lokale ontwikkeling**:
   - Maak een `.env` bestand in de root directory
   - Voeg toe:
     ```
     VITE_EMAILJS_SERVICE_ID=service_xxxxx
     VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxx
     VITE_EMAILJS_TEMPLATE_ID_ADMIN=template_xxxxx
     VITE_EMAILJS_TEMPLATE_ID_APPROVAL=template_yyyyy
     VITE_EMAILJS_TEMPLATE_ID_DELETION=template_zzzzz
     ```
     **Let op:** `VITE_EMAILJS_TEMPLATE_ID_DELETION` is optioneel. Als je deze niet invult, wordt de admin template gebruikt als fallback.
   - Het `.env` bestand staat al in `.gitignore` en wordt niet gecommit

**Zie `EMAILJS_SETUP.md` voor gedetailleerde instructies.**

### GitHub Issues (Optioneel - fallback):

Als EmailJS niet werkt, wordt er automatisch een GitHub Issue aangemaakt als fallback.

### Setup (Optioneel - voor automatische Issue creatie):

Als je automatisch GitHub Issues wilt aanmaken, heb je een GitHub Personal Access Token nodig:

1. **Maak een GitHub Token aan** (gratis):
   - Ga naar: https://github.com/settings/tokens
   - Klik op "Generate new token (classic)"
   - Geef het token de naam "OET Verlof App"
   - Selecteer de scope: `repo` (volledige controle over repositories)
   - Klik op "Generate token"
   - Kopieer het token

2. **Configureer het token in GitHub Secrets**:
   - Ga naar je repository: https://github.com/mlelieveld-netizen/OET-verlof
   - Klik op "Settings" → "Secrets and variables" → "Actions"
   - Klik op "New repository secret"
   - Name: `VITE_GITHUB_TOKEN`
   - Value: plak je GitHub token
   - Klik op "Add secret"

3. **Voor lokale ontwikkeling**:
   - Maak een `.env` bestand in de root directory
   - Voeg toe: `VITE_GITHUB_TOKEN=your_token_here`
   - Het `.env` bestand staat al in `.gitignore` en wordt niet gecommit

**Let op:** Zonder GitHub token werkt de app nog steeds! Je krijgt dan alleen geen automatische GitHub Issues. Je kunt de beheerder link handmatig delen.

### Email Notificaties ontvangen:

Om email notificaties te ontvangen bij nieuwe Issues:
1. Ga naar je repository op GitHub
2. Klik op "Watch" (rechtsboven)
3. Selecteer "All activity" of "Custom" → vink "Issues" aan
4. Je ontvangt nu automatisch emails bij nieuwe verlofaanvragen!

## Installatie

1. Installeer de dependencies:
```bash
npm install
```

2. Start de development server:
```bash
npm run dev
```

3. Open de applicatie in je browser (meestal op http://localhost:5173/OET-verlof/)

## Build voor productie

```bash
npm run build
```

De gebouwde bestanden staan in de `dist` map.

## Technologieën

- **React** - UI framework
- **Vite** - Build tool en development server
- **Tailwind CSS** - Styling
- **date-fns** - Datum manipulatie en formatting
- **localStorage** - Data opslag
- **EmailJS** - Email notificaties via Gmail (gratis!)
- **GitHub Issues API** - Fallback notificaties (optioneel)

## Gebruik

1. **Nieuwe aanvraag**: Ga naar het "Aanvragen" tabblad en vul het formulier in
2. **Overzicht**: Bekijk alle aanvragen in het "Overzicht" tabblad
3. **Filteren**: Filter aanvragen op status (Alle, In behandeling, Goedgekeurd, Afgewezen)
4. **Beheren**: Goedkeur of wijs aanvragen af via de knoppen in het overzicht
5. **Kalender**: Bekijk alle verlofaanvragen visueel in de kalenderweergave
6. **Beheerderspagina**: Klik op de link in de GitHub Issue of email om een aanvraag te beoordelen

## Opmerkingen

- Alle data wordt lokaal opgeslagen in de browser
- Bij het wissen van browserdata gaan de aanvragen verloren
- GitHub Issues worden gebruikt voor notificaties (volledig gratis!)
- Voor productie gebruik wordt aangeraden een backend database te implementeren
