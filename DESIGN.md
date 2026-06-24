---
name: jumboKoi
description: Nishikigoi giapponesi & Bonsai — l'arte dell'equilibrio, forma e respiro.
colors:
  sumi-black: "#0a0a09"
  sumi-black-deep: "#060605"
  inkstone: "#12100f"
  avorio-ink: "#ece7dd"
  gold: "#c8a86b"
  gold-lift: "#d8bd84"
  gold-ink: "#1a1206"
  washi-paper: "#f5f2eb"
  washi-stone: "#ece6d8"
  sumi-dark: "#26221d"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(2.5rem, 6vw, 4.5rem)"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(2.4rem, 5vw, 4.25rem)"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(1.75rem, 3vw, 2.5rem)"
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(0.95rem, 1.2vw, 1.1rem)"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.22em"
  eyebrow:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(0.62rem, 0.9vw, 0.74rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.4em"
rounded:
  pill: "999px"
  card: "26px"
  stage: "32px"
components:
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.gold-ink}"
    rounded: "{rounded.pill}"
    padding: "0.65rem 0.65rem 0.65rem 1.6rem"
  button-gold-hover:
    backgroundColor: "{colors.gold-lift}"
    textColor: "{colors.gold-ink}"
    rounded: "{rounded.pill}"
  button-ghost:
    backgroundColor: "{colors.sumi-black}"
    textColor: "{colors.avorio-ink}"
    rounded: "{rounded.pill}"
    padding: "0.65rem 0.65rem 0.65rem 1.6rem"
  input-underline:
    backgroundColor: "{colors.inkstone}"
    textColor: "{colors.avorio-ink}"
    typography: "{typography.title}"
    padding: "0.5rem 0.2rem"
  chip:
    backgroundColor: "{colors.inkstone}"
    textColor: "{colors.avorio-ink}"
    rounded: "{rounded.pill}"
    padding: "0.6rem 1.15rem"
  chip-selected:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.avorio-ink}"
    rounded: "{rounded.pill}"
    padding: "0.6rem 1.15rem"
  submit:
    backgroundColor: "{colors.inkstone}"
    textColor: "{colors.gold}"
    rounded: "{rounded.pill}"
    padding: "1rem 2.4rem"
  card-glass:
    backgroundColor: "{colors.inkstone}"
    textColor: "{colors.avorio-ink}"
    rounded: "{rounded.card}"
    padding: "clamp(1.75rem, 4vw, 4rem)"
---

# Design System: jumboKoi

## 1. Overview

**Creative North Star: "La Galleria Sommersa"**

jumboKoi è una galleria d'arte silenziosa vista attraverso l'acqua. I koi non sono prodotti: sono opere esposte dietro un vetro liquido, illuminate da una luce che filtra dall'alto come in un acquario museale. Tutto il sistema visivo serve questa illusione — la rarità del *sumi-e* (pittura a inchiostro), la calma del *karesansui*, il lusso per sottrazione di una maison. La pagina **respira**: si apre nel buio inchiostro, esala nella luce calda della carta *washi*, e si richiude nell'*inkstone* notturno della sezione finale.

La densità è bassa per scelta: il vuoto è contenuto, non spazio sprecato. La voce è quieta e autorevole — italiano elegante con incisi in kanji come ancore culturali (水 Acqua, 和 Equilibrio, 誂え Su misura), mai folklore decorativo. Il movimento è acqua, non clic: ogni easing è lungo e morbido (`expo.out`, `power4.out`, `sine.inOut`), niente snappa mai. La profondità non nasce da ombre piatte ma da **luce-come-materia**: bagliori d'oro, riflessi inset "machined", e strati tonali che si sovrappongono nel buio.

Questo sistema rifiuta esplicitamente l'estetica e-commerce (griglie di prodotti, prezzi, "aggiungi al carrello"), quella da negozio di acquariofilia/garden center, e i tell della landing "startup/SaaS" (bg cream, card identiche, hero-metric, gradient text, glassmorphism decorativo). jumboKoi è una *galleria*, non un *catalogo*.

**Key Characteristics:**
- Palette ristretta e drammatica: near-black, avorio, un solo oro caldo; carta washi come controcanto luminoso.
- Coppia tipografica a contrasto: serif Cormorant Garamond (Light) + sans Inter.
- Profondità per bagliore e riflesso inset, non per drop-shadow.
- Movimento tidale, scrubbed sullo scroll; reduced-motion sempre onorato.
- Cursori custom (silk + inchiostro sumi) come firma sensoriale.

## 2. Colors

Una palette drammatica a doppio fondale — un mondo notturno d'inchiostro e un mondo diurno di carta — uniti da un unico oro caldo che è l'unica voce di colore.

### Primary
- **Oro Caldo** (`#c8a86b`): l'unico accento. CTA, focus, bagliori, eyebrow, dettagli di pregio. La sua rarità è il punto: porta l'identità su uno schermo dove tutto il resto è neutro.
- **Oro Sollevato** (`#d8bd84`): la versione "alzata" dell'oro, solo come stato hover dei controlli pieni.

### Neutral — Mondo Notturno (sumi-e)
- **Nero Sumi** (`#0a0a09`): il fondale dominante del sito (`--color-bg`). Inchiostro quasi assoluto, mai nero puro.
- **Nero Profondo** (`#060605`): il fondo più scuro, per testo su oro e grounds estremi (`--color-bg-deep`).
- **Inkstone** (`#12100f`): il ground nocturno ricco della sezione form/footer (`--bespoke-ink`); la pietra da inchiostro bagnata.
- **Avorio** (`#ece7dd`): l'inchiostro chiaro — tutto il testo sui fondali scuri (`--color-ink`). Avorio caldo, mai bianco puro. La sua trasparenza al 62% (`--color-ink-soft`) è il testo secondario/lead.

### Neutral — Mondo Diurno (washi)
- **Carta Washi** (`#f5f2eb`): il ground luminoso caldo in cui la pagina "esala" da Philosophy in poi (`--color-paper`).
- **Pietra Washi** (`#ece6d8`): una carta leggermente più profonda per i grounds dei media (`--color-paper-deep`).
- **Sumi Scuro** (`#26221d`): l'inchiostro scuro per il testo sul ground chiaro (`--color-sumi`); al 60% di trasparenza (`--color-sumi-soft`) per il testo secondario.
- **Oro-Inchiostro** (`#1a1206`): il bruno profondissimo usato come testo *sopra* l'oro pieno (contrasto AA sul bottone gold).

### Named Rules
**La Regola dell'Unica Voce.** L'oro è l'unico colore. Compare su ≤10% di qualsiasi schermata. Non introdurre mai un secondo hue (verde, blu, rosso): la sobrietà è ciò che fa leggere il koi come opera, non come pesce.

**La Regola del Respiro.** Lo sfondo non è una costante: è una drammaturgia. Buio (sumi) → carta (washi) → inkstone. Ogni nuovo blocco rispetta la fase cromatica in cui si trova; non "rompere" il respiro con un fondo fuori sequenza.

**La Regola del Mai-Puro.** Nessun `#000` e nessun `#fff`. Il nero è inchiostro (`#0a0a09`), il bianco è avorio (`#ece7dd`). Il puro è digitale; questo brand è materico.

## 3. Typography

**Display Font:** Cormorant Garamond (con Georgia, serif) — pesi Light (300), normale e corsivo.
**Body Font:** Inter (con system-ui, sans-serif) — Regular (400) e corsivo.

**Character:** una coppia a contrasto puro — un serif da display alto, esile ed editoriale contro un sans neutro e silenzioso. Il Cormorant Light porta la grazia e il respiro (titoli, hero, perfino i campi input, scritti in serif); l'Inter porta la chiarezza funzionale (testo, etichette, eyebrow). Mai due famiglie simili: il contrasto serif/sans È la gerarchia.

### Hierarchy
- **Display** (Cormorant Light 300, `clamp(2.5rem, 6vw, 4.5rem)`, line-height 1): il titolo hero e i grandi titoli di sezione. Tracking negativo (-0.02em). Tetto a ~4.5rem: la pagina sussurra, non grida.
- **Headline** (Cormorant Light 300, `clamp(2.4rem, 5vw, 4.25rem)`, line-height 1): titoli editoriali forti (es. il titolo Bespoke).
- **Title** (Cormorant Light 300, `clamp(1.75rem, 3vw, 2.5rem)`, line-height 1.1): sottotitoli, stati (es. "Richiesta ricevuta").
- **Body** (Inter 400, `clamp(0.95rem, 1.2vw, 1.1rem)`, line-height 1.65): paragrafi e lead. Larghezza massima 36–42ch per il respiro editoriale.
- **Label** (Inter 400, `0.7rem`, letter-spacing 0.22em, MAIUSCOLO): etichette dei campi form.
- **Eyebrow** (Inter 400, `clamp(0.62rem, 0.9vw, 0.74rem)`, letter-spacing 0.4em, MAIUSCOLO, oro): il kicker bilingue kanji + italiano.

### Named Rules
**La Regola del Kicker Bilingue.** L'eyebrow di jumboKoi NON è il generico eyebrow tracciato dell'AI. È un sistema firmato: un kanji + un punto medio (·) + una parola italiana maiuscola in oro (es. `水 · ACQUA`, `和 · L'EQUILIBRIO`, `誂え · SU MISURA`). Usalo come cadenza deliberata e rara, non meccanicamente su ogni sezione. Senza il kanji e l'oro, non è un kicker jumboKoi.

**La Regola del Serif nei Campi.** Gli input si scrivono in Cormorant serif, non in sans. Anche la compilazione di un form deve sembrare scrittura a mano elegante, non data-entry.

## 4. Elevation

Questo sistema **non usa drop-shadow convenzionali** per separare le superfici. La profondità nasce dalla luce trattata come materia, in tre modi: (1) **bagliori** (aurore d'oro attorno ai controlli interattivi), (2) **riflessi inset** (un filo di luce in alto che dà la sensazione del metallo lavorato e del vetro liquido), e (3) **stratificazione tonale** (fondali scuri che si sovrappongono via z-index e filtri `brightness`, come la sezione Hero che sprofonda mentre la Collection sale). Un'unica ombra ambientale profonda esiste sotto la card di vetro per ancorarla nello spazio.

### Shadow Vocabulary
- **Aura Oro — riposo** (`box-shadow: 0 0 26px -8px rgba(200,168,107,0.45)`): l'alone tenue attorno al bottone submit a riposo.
- **Aura Oro — hover** (`box-shadow: 0 0 50px -12px rgba(200,168,107,0.5)`): il bagliore che si intensifica su hover dei CTA.
- **Riflesso Machined** (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), inset 0 0 0 1px rgba(255,255,255,0.04)`): il filo di luce superiore del core dei bottoni (sheen lavorato).
- **Vetro Liquido** (`box-shadow: 0 60px 120px -50px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.12)`): l'ombra ambientale profonda + highlight superiore della card di vetro scura.
- **Glow Interno Chip** (`box-shadow: inset 0 0 18px rgba(200,168,107,0.2)`): il "respiro" dorato interno del chip selezionato.

### Named Rules
**La Regola Luce-non-Ombra.** Per dare profondità, raggiungi prima il bagliore e il riflesso inset, non il drop-shadow. Un'ombra grigia piatta sotto una card è il tell del 2014: qui è proibita. L'eccezione unica è l'ombra ambientale enorme e morbida sotto il vetro liquido.

## 5. Components

Il carattere dei componenti è **raffinato e tattile**: hardware lavorato (machined) incontra vetro liquido. Niente è piatto; ogni controllo ha materia, peso e una reazione fisica.

### Buttons
- **Firma — BezelButton:** un "doppio bezel" — guscio esterno (vassoio in alluminio: ground tenue + un solo anello hairline + padding di 6px) che contiene un core interno (la lastra di vetro seduta, con riflesso inset). Più un "button-in-button": un pozzetto circolare con la freccia che deriva in diagonale verso "dove ti porta" su hover.
- **Shape:** pillola piena (`999px`) su guscio e core, concentrici.
- **Tono Gold (primario):** core in **Oro** (`#c8a86b`) con testo **Oro-Inchiostro** (`#1a1206`); su hover l'oro si solleva a `#d8bd84` e l'aura cresce. Padding core `0.65rem 0.65rem 0.65rem 1.6rem`.
- **Tono Ghost (secondario/back):** trasparente con anello avorio tenue; nessun bagliore, solo l'anello che si schiarisce su hover.
- **Hover / Focus:** transizioni lunghe sulla spring `cubic-bezier(0.32,0.72,0,1)`; magnetismo GSAP sul guscio (deriva verso il cursore), press-scale (0.97) sul core. `:focus-visible` → outline oro 2px, offset 4px.

### Chips (radio personalizzati)
- **Style:** pillola (`999px`) con anello avorio al 20%, testo avorio-soft, ground inkstone. Radio nativo visivamente nascosto (accessibilità + tastiera intatte).
- **State:** selezionato → anello oro al 70%, fondo oro al 12%, glow interno oro (`inset 0 0 18px`). Su hover l'anello vira oro. `:has(:focus-visible)` → outline oro.

### Cards / Containers
- **Firma — Vetro Liquido:** card in `rgba(255,255,255,0.05)` con `backdrop-filter: blur(1px) saturate(130%)`, anello bianco al 12%.
- **Corner Style:** `26px` (la card form); `32px` lo stage Hero quando sprofonda.
- **Shadow Strategy:** vedi Elevation → "Vetro Liquido" (ombra ambientale profonda + highlight inset). Mai un'ombra grigia piatta.
- **Internal Padding:** fluido, `clamp(1.75rem, 4vw, 4rem)`. Layout interno asimmetrico (es. editoriale 0.9fr | form 1.1fr).

### Inputs / Fields
- **Style:** **solo underline** — nessun box, nessun radius. Fondo trasparente, bordo inferiore avorio al 22%, testo in **Cormorant serif**.
- **Focus:** la linea inferiore "si accende" in oro + un sottile `box-shadow: 0 1px 0 0` oro. Nessun outline di default.
- **Placeholder:** avorio al 30% (tenue ma leggibile).

### Submit (magnetico)
- Pillola con anello oro al 55%, testo oro, aura oro a riposo; su hover si riempie d'oro con testo scuro e l'aura raddoppia. Deriva magnetica verso il cursore (solo pointer fine). `transform` è di GSAP, mai in transizione CSS.

### Cursori (firma sensoriale)
- Il cursore di sistema è nascosto (`cursor: none`). Due livelli custom sempre presenti: un cursore "silk" liquido e una scia d'inchiostro *sumi* su canvas. Mantieni SEMPRE focus visibili e navigazione da tastiera per chi non usa il puntatore.

## 6. Do's and Don'ts

### Do:
- **Do** usare l'oro (`#c8a86b`) come unica voce di colore, su ≤10% dello schermo. La sua rarità è il valore.
- **Do** rispettare il respiro cromatico: sumi (`#0a0a09`) → washi (`#f5f2eb`) → inkstone (`#12100f`), nella sequenza giusta.
- **Do** dare profondità con bagliori e riflessi inset, non con drop-shadow piatte.
- **Do** scrivere i titoli in Cormorant Light (≤4.5rem, tracking ≥ -0.04em) e il testo in Inter; il contrasto serif/sans È la gerarchia.
- **Do** usare il kicker firmato kanji `·` italiano-maiuscolo-oro come cadenza rara e deliberata.
- **Do** mantenere ogni easing lungo e morbido (`expo.out` / `power4.out` / `sine.inOut`; spring `cubic-bezier(0.32,0.72,0,1)`); niente bounce, niente elastic.
- **Do** fornire sempre un'alternativa `prefers-reduced-motion` (layout finale, testo nitido, immagini ferme) e focus-visible visibili (il cursore di sistema è nascosto).

### Don't:
- **Don't** introdurre estetica e-commerce: niente griglie di prodotti, prezzi a vista, badge "novità/sconto", carrello o "aggiungi al carrello". I koi non sono SKU.
- **Don't** scivolare nel negozio di acquariofilia / garden center: nessun riferimento da rivenditore di acquari, attrezzature o vivaio.
- **Don't** usare i tell della landing startup/SaaS: bg cream/sand, card identiche ripetute, hero-metric (numero grande + label), gradient text (`background-clip: text`), glassmorphism decorativo, marker numerati 01/02/03.
- **Don't** mettere un eyebrow maiuscolo tracciato generico su ogni sezione; senza kanji e oro non è un kicker jumboKoi.
- **Don't** usare nero puro (`#000`) o bianco puro (`#fff`): l'inchiostro è `#0a0a09`, l'avorio è `#ece7dd`.
- **Don't** usare `border-left`/`border-right` colorato >1px come accento (side-stripe): proibito.
- **Don't** mettere testo grigio chiaro su fondo tinto "per eleganza": il testo body deve superare 4.5:1 (su sumi usa avorio pieno, non avorio-soft, per i blocchi lunghi).
