# Verlof Aanvraag Systeem

Een moderne webapplicatie voor het aanvragen en beheren van verlofaanvragen.

## Functies

- ✅ **Nieuwe verlofaanvraag**: Eenvoudig formulier om verlof aan te vragen
- 📋 **Overzicht**: Bekijk alle verlofaanvragen met filters
- 📅 **Kalenderweergave**: Visuele kalender met alle verlofaanvragen
- 🔄 **Statusbeheer**: Goedkeuren, afwijzen of verwijderen van aanvragen
- 💾 **Lokale opslag**: Data wordt opgeslagen in de browser (localStorage)
- 📧 **GitHub Issues Notificaties**: Automatische email notificaties via GitHub

## 📧 Email Notificaties via GitHub (GRATIS!)

De app gebruikt **GitHub Issues** voor notificaties. Dit is **volledig gratis** en vereist geen betaalde email services!

### Hoe het werkt:

1. **Bij verlofaanvraag**: Er wordt automatisch een GitHub Issue aangemaakt
2. **Email notificatie**: GitHub stuurt automatisch een email naar alle repository watchers/owners
3. **Beheerder link**: In de issue staat een directe link naar de beheerderspagina
4. **Bij goedkeuring/afwijzing**: De issue wordt automatisch gesloten en bijgewerkt

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

3. Open de applicatie in je browser (meestal op http://localhost:5173)

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
- **GitHub Issues API** - Email notificaties (gratis!)

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
