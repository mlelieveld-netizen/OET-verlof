# Verlof Aanvraag Systeem

Een moderne webapplicatie voor het aanvragen en beheren van verlofaanvragen.

## Functies

- ✅ **Nieuwe verlofaanvraag**: Eenvoudig formulier om verlof aan te vragen
- 📋 **Overzicht**: Bekijk alle verlofaanvragen met filters
- 📅 **Kalenderweergave**: Visuele kalender met alle verlofaanvragen
- 🔄 **Statusbeheer**: Goedkeuren, afwijzen of verwijderen van aanvragen
- 💾 **Lokale opslag**: Data wordt opgeslagen in de browser (localStorage)

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

## Gebruik

1. **Nieuwe aanvraag**: Ga naar het "Nieuwe Aanvraag" tabblad en vul het formulier in
2. **Overzicht**: Bekijk alle aanvragen in het "Overzicht" tabblad
3. **Filteren**: Filter aanvragen op status (Alle, In behandeling, Goedgekeurd, Afgewezen)
4. **Beheren**: Goedkeur of wijs aanvragen af via de knoppen in het overzicht
5. **Kalender**: Bekijk alle verlofaanvragen visueel in de kalenderweergave

## Opmerkingen

- Alle data wordt lokaal opgeslagen in de browser
- Bij het wissen van browserdata gaan de aanvragen verloren
- Voor productie gebruik wordt aangeraden een backend database te implementeren

