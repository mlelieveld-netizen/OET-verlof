# Stap-voor-stap: EmailJS Template voor Intrekking Maken

## Overzicht
Je gaat een nieuwe EmailJS template maken die wordt gebruikt wanneer een verlofaanvraag wordt ingetrokken (verwijderd) nadat deze al was goedgekeurd of afgewezen.

**Let op:** Deze template is **optioneel**. Als je deze niet maakt, wordt automatisch de admin template gebruikt als fallback.

---

## Stap 1: Inloggen op EmailJS

1. Ga naar: https://www.emailjs.com/
2. Log in met je account
3. Je komt nu in je dashboard

---

## Stap 2: Naar Email Templates

1. Klik in het menu links op **"Email Templates"**
2. Je ziet nu een lijst met je bestaande templates (waarschijnlijk "Admin Notification" en "Approval Notification")

---

## Stap 3: Nieuwe Template Aanmaken

1. Klik op de knop **"Create New Template"** (meestal rechtsboven)
2. Je komt nu in de template editor

---

## Stap 4: Template Basis Instellingen

1. **Template naam:**
   - Type: `Deletion Notification`
   - (Dit is alleen voor je eigen overzicht)

2. **Content Type:**
   - **BELANGRIJK:** Zet dit op **"HTML"** (niet "Plain Text")
   - Dit staat meestal bovenaan of in een dropdown

---

## Stap 5: Email Subject (Onderwerp)

1. Zoek het veld **"Subject"** of **"Onderwerp"**
2. Type exact dit (kopieer en plak):
   ```
   Verlofaanvraag ingetrokken - {{employee_name}}
   ```
   - `{{employee_name}}` wordt automatisch vervangen door de naam van de medewerker

---

## Stap 6: Email Content (Inhoud)

1. Zoek het grote tekstveld voor de **email content** of **inhoud**
2. Kopieer en plak dit HTML (vervang alles wat er al staat):

```html
<p>Een verlofaanvraag is ingetrokken door de aanvrager:</p>

<p>
<strong>Medewerker:</strong> {{employee_name}}<br>
<strong>Type:</strong> {{leave_type}}<br>
<strong>Datum:</strong> {{start_date}}{{#end_date}} - {{end_date}}{{/end_date}}<br>
{{#start_time}}<strong>Tijd:</strong> {{start_time}} - {{end_time}}<br>{{/start_time}}
{{#reason}}<strong>Reden (origineel):</strong> {{reason}}<br>{{/reason}}
</p>

<p><strong>Status van de aanvraag:</strong> De aanvraag was {{previous_status}} voordat deze werd ingetrokken.</p>

<p><em>Let op: Als deze aanvraag al was goedgekeurd, moet deze mogelijk handmatig uit de agenda worden verwijderd.</em></p>
```

**Uitleg van de variabelen:**
- `{{employee_name}}` = Naam van de medewerker
- `{{leave_type}}` = Type verlof (bijv. "verlof", "ziekte")
- `{{start_date}}` = Startdatum
- `{{end_date}}` = Einddatum (alleen als anders dan startdatum)
- `{{start_time}}` = Starttijd (alleen als ingevuld)
- `{{end_time}}` = Eindtijd (alleen als ingevuld)
- `{{reason}}` = Reden (alleen als ingevuld)
- `{{previous_status}}` = Status voordat het werd ingetrokken ("goedgekeurd" of "afgewezen")

---

## Stap 7: Template Opslaan

1. Scroll naar beneden
2. Klik op **"Save"** of **"Opslaan"**
3. Je template is nu opgeslagen!

---

## Stap 8: Template ID Kopiëren

1. Na het opslaan zie je je template in de lijst
2. Klik op de template om deze te openen
3. Zoek naar **"Template ID"** (meestal bovenaan of in de rechterkolom)
4. Het ziet eruit als: `template_xxxxx` (bijv. `template_abc123`)
5. **Kopieer deze Template ID** - je hebt deze nodig voor de volgende stappen!

---

## Stap 9: Template ID Toevoegen aan GitHub Secrets

1. Ga naar: https://github.com/mlelieveld-netizen/OET-verlof/settings/secrets/actions
2. Klik op **"New repository secret"** (rechtsboven)
3. **Name:** Type exact: `VITE_EMAILJS_TEMPLATE_ID_DELETION`
4. **Secret:** Plak de Template ID die je in Stap 8 hebt gekopieerd (bijv. `template_abc123`)
5. Klik op **"Add secret"**

---

## Stap 10: Template ID Toevoegen aan .env (Lokaal)

1. Open het bestand `.env` in de root directory van je project
2. Voeg deze regel toe (of pas aan als deze al bestaat):
   ```
   VITE_EMAILJS_TEMPLATE_ID_DELETION=template_xxxxx
   ```
   (Vervang `template_xxxxx` door je echte Template ID)
3. Sla het bestand op

---

## Stap 11: Testen

1. Start je development server (als die nog niet draait):
   ```bash
   npm run dev
   ```
2. Ga naar de app in je browser
3. Maak een test verlofaanvraag aan
4. Keur deze goed (via de admin link)
5. Verwijder de aanvraag (via de "Verwijderen" knop)
6. Controleer je email - je zou nu een email moeten ontvangen met het onderwerp "Verlofaanvraag ingetrokken - [Naam]"

---

## Klaar! ✅

Je deletion template is nu geconfigureerd! 

**Belangrijk:**
- Als je de template ID niet toevoegt aan GitHub Secrets, wordt automatisch de admin template gebruikt als fallback
- De template wordt alleen gebruikt wanneer een **goedgekeurde of afgewezen** aanvraag wordt verwijderd
- Pending aanvragen die worden verwijderd sturen **geen** email

---

## Problemen?

**Email wordt niet verstuurd:**
- Controleer of de Template ID correct is in GitHub Secrets en .env
- Controleer de browser console (F12) voor foutmeldingen
- Zorg dat EmailJS correct is geconfigureerd (zie `EMAILJS_SETUP.md`)

**Email ziet er raar uit:**
- Zorg dat Content Type op "HTML" staat (niet "Plain Text")
- Controleer of je de HTML correct hebt geplakt

**Template ID niet gevonden:**
- Ga terug naar EmailJS dashboard → Email Templates
- Klik op je template om de Template ID te zien
- Kopieer deze opnieuw

