# Centrale Opslag Setup

De app gebruikt nu **GitHub als centrale database** in plaats van localStorage. Dit betekent dat alle verlofaanvragen overal zichtbaar zijn, ongeacht welke browser of device je gebruikt.

## Hoe het werkt:

1. **Alle data wordt opgeslagen in een JSON bestand** in de GitHub repository: `data/leave-requests.json`
2. **Elke browser/device leest van hetzelfde bestand** - dus je ziet altijd dezelfde data
3. **Bij wijzigingen wordt het bestand automatisch bijgewerkt** via de GitHub API
4. **30 seconden cache** voor snellere laadtijden

## Setup vereist:

Je hebt een **GitHub Personal Access Token** nodig met write rechten:

1. **Maak een GitHub Token aan**:
   - Ga naar: https://github.com/settings/tokens
   - Klik op "Generate new token (classic)"
   - Geef het token de naam "OET Verlof App"
   - Selecteer de scope: `repo` (volledige controle over repositories)
   - Klik op "Generate token"
   - Kopieer het token (je ziet het maar één keer!)

2. **Configureer het token in GitHub Secrets**:
   - Ga naar: https://github.com/mlelieveld-netizen/OET-verlof/settings/secrets/actions
   - Klik op "New repository secret"
   - Name: `VITE_GITHUB_TOKEN`
   - Value: plak je GitHub token
   - Klik op "Add secret"

3. **Voor lokale ontwikkeling** (optioneel):
   - Maak een `.env` bestand in de root directory
   - Voeg toe: `VITE_GITHUB_TOKEN=your_token_here`
   - Het `.env` bestand staat al in `.gitignore`

## Belangrijk:

- **Zonder token**: De app valt terug op localStorage (lokaal per browser)
- **Met token**: Alle data wordt centraal opgeslagen in GitHub
- **Cache**: Er is een 30 seconden cache voor snellere laadtijden
- **Offline support**: Als GitHub niet bereikbaar is, valt het terug op localStorage

## Data bestand:

Het data bestand wordt automatisch aangemaakt in: `data/leave-requests.json`

Je kunt dit bestand ook handmatig bekijken in de GitHub repository.

## Technische details:

- Alle storage functies zijn nu `async`
- Data wordt gelezen/geschreven via GitHub API
- Automatische fallback naar localStorage als GitHub niet beschikbaar is
- Cache voorkomt te veel API calls
