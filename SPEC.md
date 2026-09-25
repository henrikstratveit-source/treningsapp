# Treningsapp – spesifikasjon for Claude Code

## Slik vil jeg at du jobber

- Les hele dokumentet før du skriver kode.
- Start med å foreslå arkitektur, mappestruktur og datamodell, og list opp spørsmål eller uklarheter. Vent på at jeg sier ok før du begynner å bygge.
- Bygg i milepælene i seksjon 14. Etter hver milepæl: kjør tester og build, og fortell meg kort hva jeg kan teste.
- Hold det enkelt: få avhengigheter, ingen backend, ingen innlogging, ingen betalte tjenester. Si fra før du legger til noe nytt av betydning.
- Alle treningsregler står i dette dokumentet. Ikke finn på egne regler for progresjon eller volum. Er noe uklart, spør.
- Forklar kort og konkret.

## 1. Bakgrunn

Appen er for meg personlig. Jeg er nybegynner og vil gå opp i vekt og bygge muskler, særlig bredere skuldre. Jeg trener 3–4 ganger i uka, maks ca. 40 minutter per økt, mest på maskiner, og alltid alene.

Appen skal logge øktene mine, si fra når jeg skal øke vekt eller reps, spore kroppsvekta og vise om treningen faktisk fungerer.

## 2. Plattform og teknologi

- Mobil-først webapp (PWA) som kan legges på hjem-skjermen og virker helt uten nett.
- Forslag til stack: React + TypeScript + Vite, IndexedDB via Dexie, vite-plugin-pwa, Recharts for grafer, Vitest for tester. Foreslå gjerne noe annet hvis du har en god grunn.
- All data lagres lokalt på telefonen. Be om varig lagring med `navigator.storage.persist()`.
- Grensesnitt på norsk, mørkt tema, store knapper, lett å bruke med én hånd.
- Enhet: kg. Manualvekter logges per manual.

## 3. Datamodell (utgangspunkt)

- **Exercise:** id, navn, type (`flerledd` | `isolasjon`), økningssteg (kg), pausetid (sekunder), muskler: liste av `{ muskel, andel }` der andel er 1 (direkte) eller 0,5 (indirekte).
- **Program:** id, navn, økter i rekkefølge. Hver økt: id, navn, `bonus` (bool), øvelser: `{ exerciseId, sett, repMin, repMax, valgfri (bool), alternativer (exerciseId[]) }`.
- **WorkoutSession:** id, programId, øktId, start, slutt, sett[].
- **SetEntry:** exerciseId, settnummer, vekt, reps, rir (valgfri, 0–5), oppvarming (bool), godForm (bool, standard true), tidspunkt.
- **BodyweightEntry:** dato, kg (én per dag).
- **Settings:** aktivt program, startvekt, målvekt, dato for første økt, teknikkfase på/av, pausetider, valgfritt mål-tempo i kg per uke (tomt som standard), dato for siste eksport.

Progresjonshistorikk hører til øvelsen (exerciseId), ikke programmet, så den følger med når jeg bytter program.

## 4. Øvelsesbibliotek

Økningssteg og pausetid skal kunne endres per øvelse i appen, siden maskinene på gymmen kan ha andre steg.

| id | Navn | Type | Steg (kg) | Pause (s) | Muskler (1 = direkte, 0,5 = indirekte) |
|---|---|---|---|---|---|
| chest_press | Chest press maskin | flerledd | 5 | 120 | bryst 1, fremre skulder 0,5, triceps 0,5 |
| incline_press | Incline press maskin | flerledd | 5 | 120 | bryst 1, fremre skulder 0,5, triceps 0,5 |
| flyes | Flyes maskin (pec deck) | isolasjon | 5 | 75 | bryst 1 |
| shoulder_press | Skulderpress maskin, sittende | flerledd | 5 | 120 | fremre skulder 1, sideskulder 0,5, triceps 0,5 |
| lateral_db | Sidehev med manualer | isolasjon | 2 | 75 | sideskulder 1 |
| lateral_cable | Sidehev i kabel | isolasjon | 2,5 | 75 | sideskulder 1 |
| pulldown | Nedtrekk med stang | flerledd | 5 | 120 | rygg 1, biceps 0,5 |
| seated_row | Sittende roing | flerledd | 5 | 120 | rygg 1, biceps 0,5, bakre skulder 0,5 |
| db_row | Enarms manualroing | flerledd | 2 | 90 | rygg 1, biceps 0,5 |
| reverse_pec_deck | Omvendt pec deck | isolasjon | 5 | 75 | bakre skulder 1 |
| leg_press | Leggpress | flerledd | 5 | 120 | framside lår 1, sete 0,5 |
| leg_extension | Beinspark | isolasjon | 5 | 75 | framside lår 1 |
| leg_curl_seated | Sittende lårcurl | isolasjon | 5 | 75 | baklår 1 |
| leg_curl_lying | Liggende lårcurl | isolasjon | 5 | 75 | baklår 1 |
| calf_raise_standing | Stående tåhev | isolasjon | 5 | 75 | legger 1 |
| triceps_overhead_rope | Triceps over hodet med tau | isolasjon | 2,5 | 75 | triceps 1 |
| triceps_overhead_db | Triceps over hodet med manual | isolasjon | 2 | 75 | triceps 1 |
| pushdown_rope | Triceps pushdown med tau | isolasjon | 2,5 | 75 | triceps 1 |
| cable_curl_bar | Bicepscurl i kabel med stang | isolasjon | 2,5 | 75 | biceps 1 |
| hammer_curl_rope | Hammercurl med tau | isolasjon | 2,5 | 75 | biceps 1 |
| incline_db_curl | Skråbenk-curl med manualer | isolasjon | 2 | 75 | biceps 1 |

## 5. Programmer

Begge programmene ligger inne fra start. Bro split er standard. Alle rep-områder er 10–15, unntatt sidehev, omvendt pec deck og tåhev, som er 12–20. Programmer og øvelser skal kunne redigeres i appen (legge til, fjerne, endre rekkefølge, sett og rep-område).

### Program 1: Bro split (standard)

Rotasjon: Bryst og skuldre → Rygg → Bein → Armer → forfra.

**Bryst og skuldre**
- chest_press 3 × 10–15
- incline_press 3 × 10–15
- flyes 3 × 10–15
- shoulder_press 3 × 10–15
- lateral_db 3 × 12–20 (alternativ: lateral_cable)

**Rygg**
- pulldown 3 × 10–15
- seated_row 3 × 10–15
- db_row 3 × 10–15
- reverse_pec_deck 3 × 12–20
- lateral_db 3 × 12–20 (alternativ: lateral_cable)

**Bein**
- leg_press 3 × 10–15
- leg_extension 3 × 10–15
- leg_curl_seated 3 × 10–15 (alternativ: leg_curl_lying)
- calf_raise_standing 3 × 12–20

**Armer**
- triceps_overhead_rope 3 × 10–15
- cable_curl_bar 3 × 10–15
- pushdown_rope 3 × 10–15
- hammer_curl_rope 3 × 10–15
- lateral_db 3 × 12–20 (alternativ: lateral_cable)

### Program 2: Overkropp/underkropp

Kjerneøkter i rotasjon: Overkropp A → Bein → Overkropp B. I tillegg en bonusøkt: Skuldre og armer.

**Overkropp A**
- chest_press 3 × 10–15
- pulldown 3 × 10–15
- lateral_db 3 × 12–20
- seated_row 2 × 10–15
- hammer_curl_rope 2 × 10–15

**Bein**
- leg_press 3 × 10–15
- leg_curl_seated 3 × 10–15 (alternativ: leg_curl_lying)
- leg_extension 3 × 10–15
- lateral_db 3 × 12–20 (valgfri)

**Overkropp B**
- incline_press 3 × 10–15
- db_row 3 × 10–15
- lateral_cable 3 × 12–20 (alternativ: lateral_db)
- flyes 2 × 10–15
- triceps_overhead_rope 2 × 10–15

**Skuldre og armer (bonus)**
- lateral_db 4 × 12–20
- incline_db_curl 3 × 10–15
- triceps_overhead_db 3 × 10–15
- reverse_pec_deck 2 × 12–20
- hammer_curl_rope 2 × 10–15

## 6. Rotasjon: hvilken økt er neste

- Neste økt bestemmes av rekkefølgen, ikke ukedager: appen foreslår økta etter den sist fullførte i det aktive programmet.
- Jeg kan alltid velge en annen økt manuelt.
- Overkropp/underkropp: bonusøkta foreslås bare når alle tre kjerneøktene er fullført i inneværende uke (mandag–søndag). Ellers foreslås neste kjerneøkt. Bonusøkta kan hoppes over med ett trykk.
- «Bytt øvelse» inne i en økt: velg et av alternativene (for eksempel hvis maskinen er opptatt). Alternativet har sin egen historikk.

## 7. Innsats (RIR) og oppvarming

- RIR = reps igjen i tanken (0 = failure). Logges valgfritt per sett med raske knapper: 0, 1, 2, 3, 4+.
- Teknikkfase: de første 14 dagene fra første loggede økt er målet 2–3 RIR på alle sett. Kan slås av i innstillinger.
- Etter teknikkfasen: flerleddsøvelser 1–2 RIR på alle sett. Isolasjonsøvelser 1–2 RIR, men siste sett til failure (0).
- Vis mål-RIR ved hvert sett.
- Oppvarming: foreslå oppvarmingssett automatisk for første flerleddsøvelse i økta, ca. 50 % × 8 og ca. 75 % × 4 av dagens arbeidsvekt, avrundet til økningssteget. For senere flerleddsøvelser: ett sett på ca. 60 % × 6. Ingen oppvarming på isolasjonsøvelser.
- Oppvarmingssett kan logges, men teller aldri i progresjon eller statistikk.

## 8. Progresjonsregler (dobbel progresjon)

Reglene gjelder per øvelse og bruker arbeidssettene fra sist øvelsen ble gjort. Oppvarmingssett og sett merket «dårlig form» teller ikke.

1. **Første gang (ingen historikk):** be meg velge en vekt jeg tror jeg klarer i øvre del av rep-området med 2–3 reps igjen. Fra neste gang gjelder reglene under.
2. **Øk:** hvis alle planlagte arbeidssett ble gjennomført og alle nådde repMax → neste vekt = forrige vekt + økningssteg. Mål: repMin på alle sett.
3. **Hold:** ellers samme vekt. Mål: slå forrige økt med minst én rep totalt. Vis forrige reps per sett.
4. **For tungt:** hvis snittet av arbeidssettene rett etter en økning ble mer enn 2 reps under repMin → foreslå forrige vekt igjen.
5. **Stagnasjon:** framgang betyr høyere vekt enn forrige gang, eller samme vekt og flere totale reps enn beste tidligere økt på den vekta. Ingen framgang 3 økter på rad → varsel: «Står stille. Sjekk søvn og mat.» 5 økter på rad → foreslå ca. 10 % lavere vekt (avrundet til steget) og bygg opp igjen.
6. **For lett:** etter teknikkfasen, hvis snitt-RIR på arbeidssettene var 3 eller mer → melding: «Du stopper langt unna failure. Ta flere reps eller øk vekta.»
7. **Etter økta:** vis et sammendrag med hva som øker neste gang og eventuelle personlige rekorder.

## 9. Pausetimer

- Starter automatisk når et arbeidssett lagres. Standard 120 s for flerledd og 75 s for isolasjon, kan endres per øvelse og globalt.
- Tydelig nedtelling, vibrasjon og lyd når tida er ute, knapp for +30 s og for å hoppe over.
- Lagre starttidspunktet og regn ut gjenstående tid, så timeren blir riktig selv om jeg bytter skjerm eller skjermen har vært av.

## 10. Kroppsvekt

- Rask registrering fra hjem-skjermen: én vekt per dag (morgen, etter do, før mat). Ny registrering samme dag overskriver.
- Graf med daglige målinger og 7-dagers glidende snitt. Vis ukessnitt (mandag–søndag) og endring per uke.
- Vis startvekt, målvekt, endring hittil og snittendring per uke de siste 4 ukene.
- Varsel: hvis ukessnittet ikke har økt med minst 0,1 kg to fulle uker på rad → «Vekta står stille. Spis mer.» Uker med færre enn 3 målinger regnes ikke med.
- Valgfritt mål-tempo (kg per uke) i innstillinger, tomt som standard. Er det satt, vis om jeg ligger over eller under.

## 11. Statistikk

- **Harde sett per muskel per uke:** hvert arbeidssett teller 1 for muskler med andel 1 og 0,5 for muskler med andel 0,5 (fra øvelsesbiblioteket). Vis inneværende uke og snitt siste 4 uker. Marker sideskuldre som prioritet.
- **Økter per uke:** snitt siste 4 og 6 uker.
- **Programforslag:** hvis aktivt program er bro split, det finnes minst 4 uker med data og 6-ukers snittet er under 3,5 økter per uke → vis: «Du trener i snitt X ganger i uka. Med tre økter i uka får hver muskel mindre volum i bro splitten. Vurder overkropp/underkropp.» med en knapp for å bytte.
- **Per øvelse:** graf over arbeidsvekt og reps over tid, gjerne med estimert 1RM (Epley) som trendlinje.

## 12. Skjermer

- **Hjem:** stor knapp «Start neste økt: [navn]», ukens økter, rask kroppsvekt-registrering og aktive varsler.
- **Økt:** øvelsene i rekkefølge. For hver øvelse: dagens mål (vekt × reps, mål-RIR) og forrige gang. En rad per sett med +/- for vekt og reps (forhåndsutfylt fra forslaget), RIR-knapper, «god form»-hake og lagre. Å logge et sett skal ta noen få sekunder. Knapper for å bytte øvelse og legge til eller fjerne et sett.
- **Historikk:** tidligere økter og progresjon per øvelse.
- **Kroppsvekt:** graf og liste.
- **Statistikk:** se seksjon 11.
- **Innstillinger:** aktivt program, redigering av programmer og øvelser, pausetider, start- og målvekt, teknikkfase, eksport og import.

## 13. Lagring og backup

- Eksport av alle data som én JSON-fil, og import av samme fil (for backup og telefonbytte).
- CSV-eksport av sett og kroppsvekt.
- Påminnelse på hjem-skjermen hvis det er mer enn 14 dager siden siste eksport.

## 14. Milepæler

1. Oppsett, datamodell, ferdig utfylt øvelsesbibliotek og begge programmene.
2. Rotasjon og progresjonsmotor som rene funksjoner i en egen modul, med enhetstester (seksjon 15).
3. Øktlogging og pausetimer.
4. Kroppsvekt med graf og varsel.
5. Statistikk og programforslag.
6. Innstillinger, redigering, bytt øvelse, eksport/import og PWA/offline.
7. README: hvordan jeg kjører appen lokalt, legger den ut gratis (for eksempel GitHub Pages, Netlify eller Vercel) og installerer den på telefonen.

## 15. Tester som må være med

- Rep-område 10–15, vekt 30 kg, steg 5: sett [15, 15, 15] → forslag 35 kg, mål 10 reps.
- Sett [15, 14, 13] på 30 kg → forslag 30 kg, mål minst 43 reps totalt.
- Bare 2 av 3 planlagte sett gjennomført, begge på 15 → ingen økning.
- Etter økning til 35 kg: sett [8, 7, 7] → forslag tilbake til 30 kg.
- Samme vekt med totalt 40 reps, deretter 40, 39 og 40 → stagnasjonsvarsel etter tredje økt uten framgang. Fem økter uten framgang → forslag om ca. 10 % lavere vekt.
- Oppvarmingssett og sett med dårlig form påvirker ikke forslaget.
- Snitt-RIR 3 eller mer etter teknikkfasen → «for lett»-melding. I teknikkfasen: ingen melding.
- Bro split: sist fullført Bein → neste Armer. Sist fullført Armer → neste Bryst og skuldre.
- Overkropp/underkropp: alle tre kjerneøktene fullført denne uka → bonus foreslås. Ny uke → neste kjerneøkt.
- Kroppsvekt: ukessnitt 70,0 → 70,05 → 70,02 → varsel. En uke med bare 2 målinger regnes ikke med.
- Harde sett: 3 arbeidssett chest_press gir bryst 3, triceps 1,5 og fremre skulder 1,5.

## 16. Ikke nå

Innlogging, synk til sky, kostholdslogging, sosiale funksjoner og push-varsler. Kosthold kan komme senere.
