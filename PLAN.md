# Plan – forslag og åpne spørsmål

Skrevet av Claude 2026-09-25 etter å ha lest SPEC.md. Ingen kode er skrevet ennå.
Bestemt: appen bygges på gaming-PC-en (Node finnes der / installeres der).

## Arkitektur

- Stack som i spec: React + TypeScript + Vite, Dexie, vite-plugin-pwa, Recharts, Vitest.
  Eneste tillegg: `dexie-react-hooks` (lite, gjør at skjermene oppdaterer seg når data endres).
- Ingen router og ingen dato-bibliotek: enkel fane-state i appen, egne uke-/datohjelpere
  (uke = mandag–søndag, lokal tid).
- Tre lag, avhengighet kun én vei: `domain/` (rene funksjoner, ingen React/Dexie, all logikk og
  alle tester) ← `data/` (Dexie, seed, backup) ← `ui/`.
- Domenefunksjoner tar historikk og «i dag» som parametre, så testene er deterministiske.
- Pågående økt lagres i DB fortløpende (reload/skjermbytte mister ingenting).
  Timeren lagrer `restStartedAt` + `restDuration` og regner gjenstående tid på nytt.

## Mappestruktur

```
Trening app/
  src/
    domain/          types.ts, dates.ts, rounding.ts, progression.ts, rotation.ts,
                     rir.ts, warmup.ts, bodyweight.ts, stats.ts, records.ts
      __tests__/     én testfil per modul (alle testene i seksjon 15)
    data/
      seed/          exercises.ts, programs.ts
      db.ts          Dexie-skjema + versjonering
      repo.ts        spørringer (historikk per øvelse, uker, osv.)
      backup.ts      JSON eksport/import, CSV
    ui/
      screens/       Home, Workout, History, Bodyweight, Stats, Settings
      components/    Stepper (+/-), RirButtons, RestTimer, SetRow, graf-komponenter
    App.tsx, main.tsx, theme.css
  public/icons/
  README.md
```

## Datamodell (spec + nødvendige tillegg)

```ts
Exercise   { id, navn, type, steg, pause, muskler: {muskel, andel: 1|0.5}[] }
Program    { id, navn, økter: Økt[], builtIn: boolean }
Økt        { id, navn, bonus, øvelser: Slot[] }
Slot       { exerciseId, sett, repMin, repMax, valgfri, alternativer[] }

WorkoutSession {
  id, programId, øktId, start, slutt | null,
  plan: { slotIndex, exerciseId, sett, repMin, repMax }[]   // NYTT: snapshot
  sett: SetEntry[]
}
SetEntry   { id, exerciseId, slotIndex, settnummer, vekt, reps,
             rir: 0|1|2|3|4|null  /* 4 = «4+» */, oppvarming, godForm, tidspunkt }
BodyweightEntry { dato: 'YYYY-MM-DD' (nøkkel), kg }
Settings   { …som i spec, + bonusHoppetOverUke?: string, aktivHvile?: {start, sek} }
```

- `plan`-snapshot: regel 2 sier «alle *planlagte* arbeidssett», så vi må vite hvor mange sett som
  var planlagt den gangen, selv om programmet er redigert siden.
- `slotIndex`: holder styr på hvilken plass i økta et sett hører til når øvelse byttes.
- Sett lagres inne i økta (enkelt, og volumet er lite).

## Spørsmål (hvert har et forslag – «ok til alt» holder)

**Plattform**
1. ~~Node~~ – avklart: bygges på gaming-PC.
2. Telefon: iPhone eller Android? iOS Safari støtter ikke vibrasjon, og lyd spilles ikke når
   skjermen er av / appen i bakgrunnen. Timeren teller uansett riktig.
3. Utlegging: GitHub Pages (samme konto som sjakkappen)? Git-repo fra start?

**Progresjon (seksjon 8)**
4. Ulike vekter innen samme øvelse: arbeidsvekt = vekta på første godkjente arbeidssett;
   sett på annen vekt teller som «ikke gjennomført» for regel 2.
5. Dårlig form: teller som ikke gjennomført (→ hold, ikke økning)? Forslag: ja.
6. Ekstra sett utover plan: bare de første N godkjente teller (N = planlagt).
7. Regel 4: «mer enn 2 under repMin» = snitt < repMin − 2 (snitt nøyaktig 8 → hold).
   Gjelder kun første økt etter en økning.
8. Stagnasjonsteller: første økt på ny, lavere vekt teller som framgang (nullstiller);
   −10 %-forslaget vises én gang per stagnasjon.
9. Prioritet: 4 (for tungt) > 5 (−10 %) > 2 (øk) > 3 (hold). Meldinger fra 5 (3 økter) og 6
   kan vises i tillegg.
10. Regel 6: snitt av bare sett med RIR logget; ingen RIR → ingen melding. Siste isolasjonssett
    (mål 0) teller med.
11. Hold: sett forhåndsutfylles med forrige reps per sett + totalmål vises («mål: minst 43»).
12. Personlig rekord: ny høyeste arbeidsvekt eller ny beste estimert 1RM (Epley).
13. Teknikkfase: progresjonsreglene gjelder som vanlig, kun regel 6 skrus av? Dag 1–14 inklusiv?

**Rotasjon**
14. «Fullført» = avsluttet økt med minst ett arbeidssett.
15. Bonus påvirker ikke rotasjonen: etter bonus er neste = kjerneøkta etter sist fullførte kjerneøkt.
16. Bytte program: fortsett der du slapp hvis programmet har historikk, ellers økt 1.
17. Samme øvelse med ulik plan (3× vs 4× lateral_db): regel 2 bruker planen fra forrige gang.

**Kroppsvekt**
18. Uker med < 3 målinger hoppes over (sammenlign mot forrige gyldige uke). Kun fullførte uker
    teller i varselet.

**Statistikk**
19. Harde sett: alle arbeidssett teller, også dårlig form (ikke oppvarming).
20. Sideskuldre: kun visuell markering, ikke noe oppfunnet mål-tall.
21. 4/6-ukers snitt: bare fulle uker; del på antall fulle uker med data (maks 6).

**Redigering og backup**
22. Kan lage nye programmer og nye øvelser (med muskler) + «tilbakestill til standard».
23. Import erstatter alt etter bekreftelse (ingen fletting).

## Svar fra brukeren

Besvart 2026-09-25. Prosjektet er flyttet til `C:\Users\henri\Trening app`.

- 2: **iPhone.** Ingen vibrasjon. Lyd spilles bare når appen er åpen. Timeren bruker tidsstempel.
- 3: **GitHub Pages + git-repo fra start.**
- 4: Arbeidsvekt = vekta på første godkjente arbeidssett. Sett på en annen vekt teller som ikke gjennomført.
- 5: Dårlig form = ikke gjennomført (ingen økning).
- 6, 8, 9, 10, 11: Forslagene godtatt.
- 7: For tungt = snitt < repMin − 2, bare i første økt etter en økning.
- 12: Rekord = ny høyeste arbeidsvekt eller ny beste estimert 1RM (Epley).
- 13: Teknikkfasen skrur bare av regel 6. Dag 1–14 regnes med begge dagene.
- 14–17: Forslagene godtatt (bytte program = fortsett der du slapp).
- 18–21: Forslagene godtatt.
- 22–23: Nye programmer/øvelser kan lages, og «tilbakestill til standard» finnes. Import erstatter alt etter bekreftelse.

Alle spørsmål er besvart. Neste steg er milepæl 1.

## Framdrift

### Milepæl 1 – ferdig (2026-09-25)
- Vite + React + TS + Dexie + vite-plugin-pwa satt opp. Tester: Vitest. `fake-indexeddb` er lagt til
  som dev-avhengighet (bare for å teste databasen i Node).
- Datamodell i `src/domain/types.ts`. **Avgjørelse:** feltnavn i koden er på engelsk (unngår æøå i
  koden), UI er på norsk. Kobling: navn→name, steg→step, pause→rest, muskler→muscles{muscle,share},
  økter→sessions, øvelser→slots, sett→sets, valgfri→optional, alternativer→alternatives,
  øktId→sessionId, settnummer→setNumber, vekt→weight, oppvarming→warmup, godForm→goodForm,
  tidspunkt→time, slutt→end, dato→date.
- Seed: `src/data/seed/exercises.ts` (21 øvelser) og `programs.ts` (begge programmene). Fylles inn
  første gang databasen åpnes (`src/data/db.ts`), sammen med standardinnstillinger.
- `vite.config.ts` bruker `base: './'` så appen virker på GitHub Pages.
- Midlertidig hjem-skjerm viser aktivt program med øktene. Fanene finnes, men er tomme.

### Milepæl 2 – ferdig (2026-09-25)
- `src/domain/`: `dates.ts`, `rounding.ts` (steg-avrunding, Epley), `progression.ts`, `rotation.ts`,
  `rir.ts` (teknikkfase + mål-RIR), `warmup.ts`, `records.ts`. Ingen React/Dexie der.
- `exerciseHistory(exerciseId, workouts)` henter historikk per øvelse på tvers av programmer, med
  plan-snapshot (antall sett/rep-område slik det var da).
- `suggest(history, {step, repMin, techniquePhase})` gir `kind` (first/tooHeavy/deload/increase/hold),
  vekt, mål og meldinger. Prioritet 4 > 5 > 2 > 3; stagnasjons- og for lett-melding kommer i tillegg.
- **Små avgjørelser:** økning = forrige vekt + steg (ikke avrundet, i tilfelle vekta ligger utenfor
  steg-rutenettet). «For tungt»/deload viser mål = repMin. Rekord vises ikke første gang en øvelse gjøres.
  Er første dato ikke satt (ingen økt ennå) regnes det som teknikkfase.
- 46 tester. Testene for kroppsvekt og harde sett (seksjon 15) kommer i milepæl 4 og 5.

### Milepæl 3 – ferdig (2026-09-25)
- Hjem: «Start neste økt» (rotasjon), «Velg annen økt», «Hopp over bonus», «Fortsett økt», ukens økter.
- Økt-skjerm (`ui/screens/Workout.tsx`, `ui/components/ExerciseCard.tsx`): mål og forrige gang per
  øvelse, meldinger, oppvarmingsforslag (ett trykk logger), én aktiv sett-rad med +/− for vekt og
  reps, RIR 0–4+, god form, lagre. Trykk på et logget sett for å endre, × for å slette. ± sett, Bytt øvelse.
- Pausetimer (`RestTimer.tsx`) lagres som tidsstempel i settings, vises øverst på alle skjermer,
  +30 s / hopp over, pip (Web Audio) når tida er ute. Lyd låses opp ved lagring av sett (iOS).
- Sammendrag etter økta med neste-gang-forslag og rekorder. Enkel Historikk-liste.
- **Avgjørelser:** avslutt uten arbeidssett → tilbud om å slette økta. Lagre er av når vekt er 0.
  Manualøvelser (id med `db`) viser «kg/man.». Ekstra/fjernede sett-rader huskes ikke ved reload
  (loggede sett gjør det). Pipet spilles bare hvis tida gikk ut for under 5 s siden.
  `newId()` har reserve når `crypto.randomUUID` mangler (http på lokalnett).

### Milepæl 4 – ferdig (2026-09-25)
- `domain/bodyweight.ts`: 7-dagers glidende snitt, ukessnitt (≥ 3 målinger = gyldig), varsel
  «Vekta står stille. Spis mer.», snittendring per uke siste 4 uker, sammenligning mot mål-tempo.
- Hjem: rask registrering (én per dag, overskriver) + varsel. Vekt-skjerm: nøkkeltall, graf
  (daglig = prikker, 7-dagers snitt = linje), ukestabell, liste med sletting.
- **Avgjørelser:** «endring hittil» = siste 7-dagers snitt − startvekt. «Siste 4 uker» = fra eldste
  gyldige fulle uke inntil 4 uker før siste gyldige fulle uke, delt på antall uker imellom.
  «I rute» når avviket fra mål-tempo er under 0,05 kg/uke. Grafen viser ikke målvekt-linje (ville
  presset skalaen), målet står i nøkkeltallene.

### Milepæl 5 – ferdig (2026-09-25)
- `domain/stats.ts`: harde sett per muskel per uke og snitt 4 uker, økter per uke (4 og 6 uker),
  programforslag, progresjon per øvelse (arbeidsvekt, reps, beste e1RM).
- Statistikk-skjerm: forslagskort med «Bytt til overkropp/underkropp», nøkkeltall, tabell med
  harde sett (sideskulder markert «prioritet», ingen mål-tall), graf + tabell per øvelse.
- **Avgjørelse (tolkning av svar 21):** «uker med data» = fulle uker fra og med uka for første
  fullførte økt, også uker uten økter (ellers ville en hvile-uke blåse opp snittet). Samme regel
  for snitt av harde sett. «Minst 4 uker med data» = minst 4 slike fulle uker.

### Milepæl 6 – ferdig (2026-09-25)
- Innstillinger: aktivt program, start-/målvekt, mål-tempo, teknikkfase, globale pausetider,
  øvelsesliste, programliste, backup.
- Programredigering (`ProgramEditor.tsx`): navn, økter (legg til/fjern/flytt, bonus), øvelser per økt
  (velg øvelse, sett, rep-område, valgfri, alternativer, flytt, fjern). Validering før lagring.
  Egne programmer kan slettes (ikke det aktive). Øvelsesredigering (`ExerciseEditor.tsx`): navn,
  type, steg, pause, muskler (trykk veksler 1 → 0,5 → ingen). «Tilbakestill til standard».
- Bytt øvelse i økta ble laget i milepæl 3.
- Backup (`data/backup.ts`): JSON-eksport av alt, import med validering + bekreftelse (erstatter alt),
  CSV for sett og kroppsvekt (semikolon + desimalkomma for norsk Excel/Numbers). Påminnelse på Hjem.
- PWA: ikon (SVG → PNG 192/512/180 via headless Chrome), manifest, apple-touch-icon, service worker
  precacher alt. Testet: appen laster og virker med serveren slått av.
- **Avgjørelser:** endring av global pausetid oppdaterer bare øvelser som hadde den gamle globale
  verdien (egne pausetider beholdes). «Tilbakestill til standard» overskriver bare standardøvelser og
  de to standardprogrammene; egne øvelser/programmer og all historikk beholdes. Øvelser kan ikke
  slettes (historikk peker på dem). Aldri eksportert → påminnelse når første økt er > 14 dager
  gammel. Skjemafelt har ≥ 16 px skrift så iPhone ikke zoomer.

### Milepæl 7 – ferdig (2026-09-25)
- README: kjøre lokalt, teste på iPhone mot PC, legge ut på GitHub Pages, installere på iPhone, backup.
- `.github/workflows/deploy.yml`: test + build + deploy til GitHub Pages ved push til `main`.
- **Personvern før publisering (offentlig repo):** personlige tall (vekt, målvekt, startdato) er fjernet
  fra SPEC.md, og standardinnstillingene er 70/75 kg – brukeren setter sine egne i Innst. (lagres kun
  på telefonen). Hele git-historikken er skrevet om med GitHubs anonyme noreply-adresse
  (`292598486+henrikstratveit-source@users.noreply.github.com`), også satt som repoets `user.email`.
- Lokalt ligger fortsatt `refs/original/` og greina `backup-før-omskriving` med gammel historikk.
  Push bare `main` (aldri `git push --all`), eller slett dem med
  `git update-ref -d refs/original/refs/heads/main` og `git branch -D backup-før-omskriving`.
- GitHub-konto: `henrikstratveit-source`. Repo: `treningsapp`. App-URL:
  `https://henrikstratveit-source.github.io/treningsapp/`.

### Etter første test på gym (2026-09-27)
- **Ønske: pausetimer i Dynamic Island og varsel i bakgrunnen.** Ikke mulig fra en PWA (krever native
  app / ActivityKit; bakgrunnsvarsel krever Web Push med server). **Løsning:** valgfri innstilling som
  kjører en iOS-snarvei (`shortcuts://run-shortcut?name=…&input=text&text=<sek>`) når et nytt
  arbeidssett lagres. Snarveien starter en Klokke-timer → Dynamic Island + alarm. Oppsett står i
  Innst. og README. Lagringen startes før lenken åpnes, og lenken åpnes i selve trykket (iOS krever
  brukerhandling). Ikke testet på iPhone av Claude – brukeren tester.
- **Ønske: tydelig vekt og reps per øvelse + automatisk progressive overload.** Fantes allerede
  (dobbel progresjon, SPEC 8) fra andre gang en øvelse gjøres. Gjort tydeligere: ny «mål»-boks øverst
  på hver øvelse (`Goal.tsx`) med stor vekt, mål-reps og kort forklaring (grønn = øk, gul = ned).
  Ingen nye treningsregler.
- **Ferdige øvelser klappes sammen (2026-09-27):** når alle sett-radene er logget blir øvelsen en smal
  linje («✓ navn · vekt × reps»); trykk for å åpne igjen, «Skjul» for å lukke. Etter siste sett ruller
  appen til neste uferdige øvelse, og en påbegynt økt åpnes ved første uferdige øvelse.
- **Nytt utseende (2026-09-27):** valg i Innst. → Utseende: «Ny» (standard) eller «Klassisk».
  Klassisk = `theme.css` alene, urørt. «Ny» = `theme-ny.css`, som bare gjelder under
  `html[data-theme="ny"]`: nesten svart bakgrunn, kort med tynn kant, limegrønn aksent (#c5f04a) bare
  på handlinger og fremgang, større tall, ikoner i fanelinja (`TabIcon.tsx`), «Neste økt»-kort på Hjem
  med øvelsene. Valget lagres i settings (`theme`) og speiles i localStorage så riktig utseende vises
  før databasen er lest. Git-tag `utseende-klassisk` peker på siste versjon før endringen.
