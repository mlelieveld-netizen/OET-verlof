# EmailJS Setup Instructies

EmailJS is een gratis service die emails verstuurt vanuit de browser. Je kunt het koppelen aan je Gmail account.

## Stap 1: Account aanmaken

1. Ga naar: https://www.emailjs.com/
2. Maak een gratis account aan (100 emails per maand gratis)
3. Log in

## Stap 2: Email Service toevoegen

1. Ga naar "Email Services" in het dashboard
2. Klik op "Add New Service"
3. Kies "Gmail"
4. Volg de instructies om Gmail te koppelen
   - Je moet inloggen met je Gmail account
   - Geef toestemming voor EmailJS om emails te versturen
5. Noteer de **Service ID** (bijv. `service_xxxxx`)

## Stap 3: Email Templates maken

### Template 1: Admin Notificatie (nieuwe verlofaanvraag)

1. Ga naar "Email Templates"
2. Klik op "Create New Template"
3. Template naam: "Admin Notification"
4. Subject: `Verlofaanvraag van {{employee_name}}`
5. Content:
```
Er is een nieuwe verlofaanvraag ingediend:

Medewerker: {{employee_name}}
Type: {{leave_type}}
Datum: {{start_date}}{{#end_date}} - {{end_date}}{{/end_date}}
{{#reason}}Reden: {{reason}}{{/reason}}

Klik op de volgende link om de aanvraag te beoordelen:
{{admin_link}}
```
6. Noteer de **Template ID** (bijv. `template_xxxxx`)

### Template 2: Goedkeuring Notificatie (met agenda item)

1. Maak een nieuwe template
2. Template naam: "Approval Notification"
3. **Belangrijk**: Zet "Content type" op **HTML** (niet Plain Text)
4. Subject: `Verlofaanvraag goedgekeurd - {{employee_name}} - Agenda item`
5. Content (HTML):
```html
<p>De verlofaanvraag is goedgekeurd:</p>

<p>
<strong>Medewerker:</strong> {{employee_name}}<br>
<strong>Type:</strong> {{leave_type}}<br>
<strong>Datum:</strong> {{start_date}}{{#end_date}} - {{end_date}}{{/end_date}}<br>
{{#start_time}}<strong>Tijd:</strong> {{start_time}} - {{end_time}}<br>{{/start_time}}
{{#reason}}<strong>Reden:</strong> {{reason}}<br>{{/reason}}
</p>

<p><strong>Agenda Item:</strong></p>
<p>Klik op de onderstaande knop om het agenda item (.ics bestand) te downloaden:</p>
<p>{{{ics_download_link}}}</p>

<p style="color: #666; font-size: 12px; margin-top: 20px;">
<strong>Alternatief:</strong> Als de download knop niet werkt, kopieer de onderstaande tekst en sla op als "{{ics_file_name}}":<br>
<pre style="background: #f5f5f5; padding: 10px; overflow-x: auto; font-size: 11px;">{{ics_content}}</pre>
</p>
```

**Let op:** 
- Gebruik `{{{ics_download_link}}}` (3 accolades) zodat HTML niet wordt ge-escaped
- Gebruik `{{ics_content}}` (2 accolades) voor de plain text versie
6. Noteer de **Template ID** (bijv. `template_yyyyy`)

## Stap 4: Public Key ophalen

1. Ga naar "Account" → "General"
2. Kopieer je **Public Key** (bijv. `xxxxxxxxxxxxx`)

## Stap 5: Configureer in GitHub Secrets

1. Ga naar je repository: https://github.com/mlelieveld-netizen/OET-verlof
2. Klik op "Settings" → "Secrets and variables" → "Actions"
3. Voeg de volgende secrets toe:

- `VITE_EMAILJS_SERVICE_ID` = je Service ID
- `VITE_EMAILJS_TEMPLATE_ID_ADMIN` = Template ID voor admin notificatie
- `VITE_EMAILJS_TEMPLATE_ID_APPROVAL` = Template ID voor goedkeuring
- `VITE_EMAILJS_PUBLIC_KEY` = je Public Key

## Stap 6: Voor lokale ontwikkeling

Maak een `.env` bestand in de root directory:

```
VITE_EMAILJS_SERVICE_ID=service_xxxxx
VITE_EMAILJS_TEMPLATE_ID_ADMIN=template_xxxxx
VITE_EMAILJS_TEMPLATE_ID_APPROVAL=template_yyyyy
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxx
```

## Klaar!

Na deze setup worden emails automatisch verstuurd wanneer:
- Een nieuwe verlofaanvraag wordt ingediend (naar beheerder)
- Een verlofaanvraag wordt goedgekeurd (naar beheerder met agenda item)

**Let op:** Zonder EmailJS configuratie werkt de app nog steeds, maar worden er geen emails verstuurd.

