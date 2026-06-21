import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTransitionNavigate } from '../../transitions/transitionContext'
import { prefersReducedMotion, EASE } from '../../utils/animations'
import BezelButton from '../../components/ui/BezelButton'
import './Lacqua.css'

// Self-contained, idempotent registration — mirrors Hero / Storia / Collection.
gsap.registerPlugin(useGSAP, ScrollTrigger)

/* ──────────────────────────────────────────────────────────────────────────
   THE BACKDROP — one breathtaking, static photograph of a Japanese koi pond.
   No <canvas>, no frame sequence, no loader: a single image pinned to the
   viewport that breathes on scroll (a slow GSAP scale). Resolved through Vite's
   BASE_URL, the project-wide idiom, so it keeps resolving if BASE_URL is later
   pointed at a CDN.

   NOTE: the brief names `/public/assets/japanese-pond.webp`; that file isn't in
   the repo yet, so this points at the koi pond already present (`final-pond.avif`).
   Drop the hero photo in and change this one line to swap it.
   ────────────────────────────────────────────────────────────────────────── */
const POND_SRC_DESKTOP = `${import.meta.env.BASE_URL}assets/japanese-pond-desktop.avif`
const POND_SRC_MOBILE = `${import.meta.env.BASE_URL}assets/japanese-pond-mobile.avif`

/* ──────────────────────────────────────────────────────────────────────────
   THE ACTS.
   Each is a full-viewport panel whose content is anchored monolithically to the
   bottom-left, leaving the upper two-thirds of the photograph to breathe. Titles
   render in the editorial serif (huge); kickers and specs in the technical sans
   (microscopic, wide-tracked) — that scale contrast is the whole aesthetic.
   Titles are pre-split into lines so each can be masked and revealed on its own.
   ────────────────────────────────────────────────────────────────────────── */
const SECTIONS = [
  {
    id: 'hero',
    kicker: '水の呼吸 · IL RESPIRO',
    title: ['Il Respiro', 'dell’Acqua.'],
    lead: 'Non alleviamo pesci. Curiamo l’acqua. Il pesce cresce da solo.',
    specs: null,
    cue: true,
  },
  {
    id: 'pumps',
    kicker: '循環 · CIRCOLAZIONE',
    title: ['Il Cuore', 'Invisibile.'],
    lead: 'Un flusso che non si ferma mai, calibrato al litro, silenzioso come una corrente di fondo.',
    specs: [
      { value: '50.000', unit: 'L/h', label: 'Portata continua' },
      { value: '< 24', unit: 'dB', label: 'Silenzioso' },
      { value: '24 / 7', unit: '', label: 'Incessante' },
    ],
  },
  {
    id: 'uv',
    kicker: '紫外線 · LUCE',
    title: ['Luce', 'e Purezza.'],
    lead: 'La luce che non si vede ma che decide tutto: acqua di cristallo, senza compromessi.',
    specs: [
      { value: 'UV-C', unit: '', label: 'Sterilizzazione' },
      { value: '99,9', unit: '%', label: 'Alghe eliminate' },
      { value: '100', unit: '%', label: 'Trasparenza assoluta' },
    ],
  },
  {
    id: 'oxygen',
    kicker: '酸素 · OSSIGENO',
    title: ['L’Essenza', 'della Vita.'],
    lead: 'Micro-bolle che salgono dal punto più profondo: respiro per ogni litro, fino al fondale.',
    specs: [
      { value: '∞', unit: '', label: 'Micro-bolle' },
      { value: 'Fondale', unit: '', label: 'Aerazione profonda' },
      { value: 'O₂', unit: '', label: 'Ossigeno disciolto' },
    ],
  },
]

/**
 * Lacqua — "Il Respiro dell'Acqua" (/l-acqua).
 *
 * A dark, melancholic, hyper-luxurious scroll piece in the key of high-end
 * watchmaking / bespoke tailoring sites. One pinned photograph of a koi pond
 * fills the screen and breathes (a slow scroll-linked scale); editorial text acts
 * glide up over it, anchored bottom-left, dissolving as the next one surfaces.
 *
 * ARCHITECTURE NOTES (why it's built this exact way)
 * --------------------------------------------------
 * • PIN VIA CSS `position: sticky`, NOT ScrollTrigger `pin:true`. ScrollTrigger's
 *   pin injects a pin-spacer and re-lays-out the document; that fights the
 *   TransitionProvider, which calls `ScrollTrigger.refresh()` on every route
 *   change and re-bases fixed/pinned boxes. The whole site already pins this way
 *   (Hero). The scale tween is a scrubbed ScrollTrigger — only the *pinning* is CSS.
 *   `.lacqua__flow` is pulled up −100dvh so the text scrolls directly over the stage.
 * • NO CARDS. Per the brief the text lives directly on the photograph. Legibility
 *   comes from a dark gradient + vignette painted onto the STAGE (the image), never
 *   from a background/blur on the text containers — so nothing boxes the words in.
 * • REVEALS ARE LINE MASKS, not SplitText. Titles ship pre-split into lines, each
 *   wrapped in an `overflow:hidden` mask; the inner line slides up from 116%. This
 *   is the house idiom (see utils/animations addMaskReveal) and needs no plugin and
 *   no font-load race. Entrance is timed (plays once, reverses only on scroll-back);
 *   the dissolve is scrubbed (locked to scroll) so acts melt away as the next rises
 *   — never the aggressive play/reverse/play/reverse the brief rules out.
 *
 * ACCESSIBILITY — prefers-reduced-motion gets the static photo, every line sharp
 * and present, and a plain scrollable page: no scale, no masks, no dissolves.
 *
 * CLEANUP — every tween + ScrollTrigger is created inside one `useGSAP` scope and
 * reverted automatically by @gsap/react on route exit. No orphaned triggers.
 */
export default function Lacqua() {
  const root = useRef(null)
  const imageRef = useRef(null)
  const navigate = useTransitionNavigate()

  // Decide motion once, up front, so the same answer drives the whole GSAP branch.
  const [reduced] = useState(prefersReducedMotion)

  useGSAP(
    () => {
      const section = root.current
      const image = imageRef.current
      if (!section || !image) return

      const panels = gsap.utils.toArray('[data-panel]', section)

      // ======================================================================
      //  REDUCED MOTION — static photo, every line sharp, normal scroll. No
      //  scrub, no masks, no dissolves are created at all.
      // ======================================================================
      if (reduced) {
        gsap.set('[data-line-inner]', { yPercent: 0, autoAlpha: 1 })
        gsap.set('[data-rise]', { autoAlpha: 1, y: 0 })
        gsap.set('[data-content]', { autoAlpha: 1 })
        return
      }

      // ======================================================================
      //  FULL MOTION
      // ======================================================================

      // --- 1. THE BREATH: the pinned photo scales 1 → 1.16 across the whole
      //        scroll, scrubbed to the scrollbar. ease:'none' keeps it linear to
      //        scroll; transform-origin is centred in CSS so it never drifts off.
      gsap.fromTo(
        image,
        { scale: 1 },
        {
          scale: 1.16,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      )

      // --- 2. PER-ACT choreography ------------------------------------------
      panels.forEach((panel) => {
        const content = panel.querySelector('[data-content]')
        const lines = panel.querySelectorAll('[data-line-inner]')
        const rises = panel.querySelectorAll('[data-rise]')

        // ENTRANCE — the title glides up line-by-line out of its masks while the
        // kicker / lead / specs fade-rise just behind it. Plays once on enter;
        // `play none none reverse` reverses ONLY when scrolled back up past the
        // start, so acts tuck away cleanly instead of strobing on every pass.
        const enter = gsap.timeline({
          scrollTrigger: {
            trigger: panel,
            start: 'top 76%',
            toggleActions: 'play none none reverse',
          },
        })
        enter
          .fromTo(
            lines,
            { yPercent: 116 },
            { yPercent: 0, duration: 1.5, ease: EASE.reveal, stagger: 0.12 },
          )
          .fromTo(
            rises,
            { autoAlpha: 0, y: 34 },
            { autoAlpha: 1, y: 0, duration: 1.3, ease: EASE.soft, stagger: 0.1 },
            '-=1.15',
          )

        // DISSOLVE — as the act rises toward the top and the next surfaces below
        // it, let the whole block melt up and out. Scrubbed, so it's welded to the
        // scroll position (buttery, never a jump). The closing act keeps its CTA,
        // so it is exempt from the dissolve.
        if (!panel.hasAttribute('data-final')) {
          gsap.to(content, {
            autoAlpha: 0,
            yPercent: -14,
            ease: 'none',
            scrollTrigger: {
              trigger: content,
              start: 'top 16%',
              end: 'top -14%',
              scrub: true,
            },
          })
        }
      })
    },
    { scope: root, dependencies: [reduced] },
  )

  return (
    <article className="lacqua" ref={root}>
      {/* PINNED STAGE — the single photograph, held by CSS sticky. The dark ground
          means a not-yet-loaded image degrades to an ink void, never a white flash.
          The vignette is painted on the STAGE (not the text) for legibility. */}
      <div className="lacqua__stage">
        <picture>
          {/* Su schermi fino a 768px (Mobile/Tablet verticali), carica l'immagine 9:16 */}
          <source media="(max-width: 768px)" srcSet={POND_SRC_MOBILE} />
          
          {/* Su tutti gli altri schermi (Desktop), carica l'immagine 16:9 */}
          <img
            className="lacqua__image"
            ref={imageRef}
            src={POND_SRC_DESKTOP}
            alt="Stagno giapponese di carpe Koi al crepuscolo"
            draggable="false"
          />
        </picture>
        <div className="lacqua__vignette" aria-hidden="true" />
      </div>

      {/* Fixed film-grain — physical texture with zero per-scroll repaint cost. */}
      <div className="lacqua__grain" aria-hidden="true" />

      {/* SCROLLING ACTS — pulled up over the sticky stage (see Lacqua.css). */}
      <div className="lacqua__flow">
        {SECTIONS.map((s) => (
          <section className="lacqua__panel" key={s.id} data-panel>
            <div className="lacqua__content" data-content>
              {s.id === 'hero' && (
                <div className="lacqua__back-inline" data-rise>
                  <BezelButton
                    label="Home"
                    arrow="left"
                    tone="ghost"
                    onClick={() => navigate('/')}
                  />
                </div>
              )}

              <p className="lacqua__kicker" data-rise>
                {s.kicker}
              </p>

              <h2 className="lacqua__title">
                {s.title.map((line, i) => (
                  <span className="lacqua__title-mask" key={i}>
                    <span className="lacqua__title-line" data-line-inner>
                      {line}
                    </span>
                  </span>
                ))}
              </h2>

              <p className="lacqua__lead" data-rise>
                {s.lead}
              </p>

              {s.specs && (
                <dl className="lacqua__specs" data-rise>
                  {s.specs.map((spec) => (
                    <div className="lacqua__spec" key={spec.label}>
                      <dt className="lacqua__spec-value">
                        {spec.value}
                        {spec.unit && <span className="lacqua__spec-unit">{spec.unit}</span>}
                      </dt>
                      <dd className="lacqua__spec-label">{spec.label}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {s.cue && (
                <span className="lacqua__cue" data-rise aria-hidden="true">
                  <span className="lacqua__cue-line" />
                  Scorri per immergerti
                </span>
              )}
            </div>
          </section>
        ))}

        {/* CLOSING — the final breath, and the way back. Stays anchored bottom-left
            for strict monolithic consistency; exempt from the dissolve so the CTA
            never fades from under the cursor. */}
        <footer className="lacqua__panel lacqua__panel--final" data-panel data-final>
          <div className="lacqua__content" data-content>
            <p className="lacqua__kicker" data-rise>
              静けさ · IL SILENZIO DELL’ACQUA
            </p>
            <h2 className="lacqua__title">
              <span className="lacqua__title-mask">
                <span className="lacqua__title-line" data-line-inner>
                  Acqua perfetta.
                </span>
              </span>
              <span className="lacqua__title-mask">
                <span className="lacqua__title-line" data-line-inner>
                  Koi che cresce
                </span>
              </span>
              <span className="lacqua__title-mask">
                <span className="lacqua__title-line" data-line-inner>
                  da sola.
                </span>
              </span>
            </h2>
            <div className="lacqua__actions" data-rise>
              <BezelButton
                label="Torna alla Home"
                arrow="left"
                tone="gold"
                onClick={() => navigate('/')}
                ariaLabel="Torna alla collezione"
              />
            </div>
          </div>
        </footer>
      </div>

    </article>
  )
}
