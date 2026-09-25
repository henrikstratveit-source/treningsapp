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

**Neste:** milepæl 3 – øktlogging og pausetimer (Økt-skjermen, hjem-knappen «Start neste økt»).
