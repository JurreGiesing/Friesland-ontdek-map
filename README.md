# Ontdek Friesland

Een kaart-app van Friesland: musea, natuur, de elf steden, de 11Fountains, erfgoed, stranden, Friese sporten, evenementen en wandelroutes. Je kunt afvinken wat je hebt bezocht en uitjes op een datum inplannen.

## Wat kan de app

- **Kaart** met in- en uitzoomen (knoppen, scrollen of knijpen). Elke plek heeft een speld met het icoon van zijn thema.
- **Details**: tik op een speld voor een omschrijving, labels (must-see, UNESCO, leuk met kinderen), een link naar de website en een route ernaartoe.
- **Wandelroutes** zijn als lijn ingetekend. Tik op een lijn of op de 🥾-speld om de route uit te lichten en de etappes te zien.
- **Afvinken**: markeer een plek als bezocht. De speld krijgt een groen vinkje en de voortgang per thema telt mee.
- **Plannen**: kies bij een plek een datum en een notitie. Onder *Planning* staat alles op volgorde, en je kunt eigen plannen toevoegen.
- **Filters**: op thema, regio (ook per Waddeneiland), status (nog te doen, bezocht, gepland) en op naam.
- **Back-up**: vinkjes en planning staan in je browser. Onder *Voortgang* kun je een back-up opslaan en terugzetten.

## Openen

De app bestaat alleen uit losse bestanden en heeft geen installatie of build nodig.

- **Online met GitHub Pages**: ga in deze repository naar *Settings → Pages*, kies bij *Source* "Deploy from a branch", selecteer de branch en de map `/ (root)` en sla op. Na een minuut staat de app op `https://<gebruikersnaam>.github.io/Friesland-ontdek-map/`. Op je telefoon kun je hem daarna via "Zet op beginscherm" als app installeren.
- **Op je eigen computer**: open `index.html` in een browser. De kaart heeft internet nodig voor de kaartbeelden.

## Indeling

| Map of bestand | Inhoud |
|---|---|
| `index.html` | De pagina |
| `css/app.css` | Opmaak |
| `js/app.js` | Kaart, filters, afvinken en planning |
| `data/places.js` | Alle plekken met thema, omschrijving en coördinaten |
| `data/routes.js` | Wandel- en fietsroutes met hun lijnen en etappes |
| `vendor/` | Leaflet en Leaflet.markercluster (kaartbibliotheken) |
| `sw.js`, `manifest.webmanifest`, `icons/` | Installeren op het beginscherm en openen zonder verbinding |

Een plek toevoegen doe je door in `data/places.js` een regel te kopiëren en de naam, het thema (`cat`), de omschrijving en `lat`/`lon` aan te passen.

## Bronnen

- Kaartbeelden, coördinaten en routelijnen: © [OpenStreetMap](https://www.openstreetmap.org/copyright)-bijdragers (ODbL). Routes via [Waymarked Trails](https://hiking.waymarkedtrails.org).
- Omschrijvingen: het overzicht *Ontdek Friesland: van terp en toren tot wad en wandelpad* (november 2026), aangevuld met extra plekken en routes.

Openingstijden, prijzen en data veranderen. Controleer ze op de website van de plek voordat je gaat.
