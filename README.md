# Treningsapp

Personlig treningsapp for mobil (PWA). Logger økter, foreslår når vekt eller reps skal økes,
sporer kroppsvekt og viser statistikk. All data lagres lokalt på telefonen – ingen innlogging,
ingen server.

- Krav: [SPEC.md](SPEC.md)
- Avgjørelser og framdrift: [PLAN.md](PLAN.md)

## Kjøre lokalt

Krever [Node.js](https://nodejs.org) 20 eller nyere.

```sh
npm install        # første gang
npm run dev        # utviklingsserver på http://localhost:5173
npm test           # enhetstester
npm run build      # produksjonsbygg i dist/
npm run preview    # server produksjonsbygget lokalt
```

### Teste på iPhone mot PC-en

```sh
npm run dev -- --host
```

Åpne adressen som vises under «Network» (f.eks. `http://192.168.1.20:5173`) i Safari på telefonen.
PC og telefon må være på samme wifi. Merk: over vanlig http kan appen ikke installeres eller
virke offline – det krever https (se under).

## Legge ut gratis på GitHub Pages

Repoet har en GitHub Actions-workflow (`.github/workflows/deploy.yml`) som tester, bygger og legger
ut appen hver gang du pusher til `main`.

Første gang:

1. Lag et **offentlig** repo på GitHub (Pages er gratis for offentlige repoer).
2. Push koden:
   ```sh
   git remote add origin https://github.com/<brukernavn>/treningsapp.git
   git push -u origin main
   ```
3. På GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Vent til workflowen under **Actions** er grønn. Appen ligger da på
   `https://<brukernavn>.github.io/treningsapp/`.

Senere endringer: `git push`, så oppdateres appen automatisk. Telefonen henter ny versjon neste
gang appen åpnes med nett.

Alternativer: Netlify eller Vercel fungerer også – byggkommando `npm run build`, mappe `dist`.

## Installere på iPhone

1. Åpne `https://<brukernavn>.github.io/treningsapp/` i **Safari** (må være Safari).
2. Trykk **Del**-knappen → **Legg til på Hjem-skjerm** → **Legg til**.
3. Start appen fra ikonet. Den åpner i fullskjerm og virker uten nett.

Når appen startes første gang, ber den om varig lagring så iOS ikke sletter dataene.

## Backup – viktig

Dataene finnes bare på telefonen. Hvis du sletter appen fra hjem-skjermen eller sletter
nettstedsdata i Safari, forsvinner de.

- **Innst. → Eksporter alt (JSON)** lagrer én fil med alt. Legg den i iCloud Drive eller lignende.
  Hjem-skjermen minner deg på det når det er mer enn 14 dager siden sist.
- **Importer backup** henter alt tilbake, f.eks. på ny telefon. Import erstatter alt som er der.
- CSV-eksport av sett og kroppsvekt kan åpnes i Excel/Numbers.

## Pausetimer i Dynamic Island (valgfritt)

En nettapp kan ikke vise noe i Dynamic Island eller varsle i bakgrunnen. Omveien er Snarveier:
appen starter en vanlig iPhone-timer, som vises i Dynamic Island og ringer når pausen er over –
også når du er i en annen app.

1. Åpne **Snarveier** → **+** → gi snarveien navnet **Pausetimer**.
2. Legg til **Hent tall fra input** med **Snarvei-input**.
3. Legg til **Start timer**, velg **Tall** som varighet og **sekunder** som enhet.
4. Valgfritt: legg til **Gå til Hjem-skjerm** til slutt (eller **Åpne app** → f.eks. TikTok), så
   Snarveier ikke blir stående åpen.
5. I appen: **Innst. → Pausetimer på iPhone** → slå på, og trykk **Test**.

Når du lagrer et sett, blinker Snarveier kort og timeren starter. iOS lar ikke en nettapp starte
snarveier usynlig, og den kan ikke sende deg tilbake til en hjem-skjerm-app automatisk; bruk
«◀ Trening» øverst til venstre for å gå tilbake.

## Begrensninger på iPhone

- Ingen vibrasjon fra nettapper.
- Appens egen pausetimer piper bare når appen er åpen. Den teller likevel riktig selv om skjermen
  har vært av, fordi den regner fra starttidspunktet. Bruk Snarveier-timeren over for varsel.

## Struktur

```
src/domain/   rene funksjoner: progresjon, rotasjon, RIR, oppvarming, kroppsvekt, statistikk (+ tester)
src/data/     Dexie-database, seed (øvelser og programmer), lagring, backup
src/ui/       skjermer og komponenter (React)
```
