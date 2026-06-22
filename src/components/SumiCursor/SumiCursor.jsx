import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../utils/animations'
import './SumiCursor.css'

/* =============================================================================
   SumiCursor — the global "Sumi-e ink trail"
   A full-screen, fixed, pointer-events-none <canvas> that draws a fluid Japanese
   ink trail behind the pointer and lets it bleed and dissolve into the page.

   THE BLEND (read this before touching the colour)
   ------------------------------------------------
   The brief suggested rgba(15,15,15) + `multiply`. On THIS site that ink is
   invisible: the experience opens on near-black sumi grounds (#0a0a09) and only
   later exhales into warm washi paper (#f5f2eb) — black-on-black under `multiply`
   shows nothing. So the trail paints in the site's avorio ink and the element
   carries `mix-blend-mode: difference` (see SumiCursor.css): the SAME stroke
   inverts to luminous ivory smoke over the dark grounds and to deep charcoal ink
   over the paper. The light/dark problem becomes the feature, with zero per-frame
   background sampling — and it speaks the same ink language as the existing
   liquid-silk cursor, which inverts identically.

   PERFORMANCE (the "zero lag" mandate, by construction)
   -----------------------------------------------------
   • Desktop only: the whole thing returns null on touch / coarse pointers and
     under reduced-motion, so no rAF loop, no listeners, no GPU blend are created.
   • One requestAnimationFrame loop. The pointer is sampled at most ONCE per frame
     (a 1000Hz mouse is coalesced to the refresh rate) — constant cost per frame.
   • A pre-allocated ring buffer of segments. The hot loop only MUTATES those
     objects; it never `new`s anything, so there is no per-frame GC churn.
   • The loop PARKS itself the instant the ink is gone and the pointer is still,
     and re-arms on the next move/resize — idle cost is exactly zero.
   ========================================================================== */

/* --- TUNING — the whole brush is driven from here. Physical knobs, no magic. */
const INK = 'rgb(236, 231, 221)' // the site's --color-ink (avorio); inverted by CSS

const LIFE = 750 // ms — full life of one ink segment (within the 1.5–2s brief)
const FADE_POW = 1.0 // >1 ⇒ the ink holds, then fades on a soft tail (not linear)

const W_MAX = 2.5 // NIENTE POOLING: la punta della matita è solida
const W_MIN = 1.0 // Leggermente più affilata quando vai veloce
const V_SLOW = 0.5 
const V_FAST = 42 
const W_EASE = 0.8 

const DIFFUSE_CORE = 0 // Nessuna dilatazione nel tempo
const DIFFUSE_BLEED = 0 // Nessun alone bagnato

const A_CORE = 0.35 // Trasparenza alta: la matita si scurisce sovrapponendosi
const A_BLEED = 0 // Alone completamente spento

const DPR_CAP = 2 // never allocate a >2× backing store: it triples fill cost for no
// visible gain on a soft ink trail. Retina stays razor-sharp at 2×.

const MAX_SEGMENTS = 360 // ring capacity. ≈ LIFE/frame at 144Hz (1700/6.9 ≈ 246) with
// headroom, so even a high-refresh display never starves the trail. Allocated ONCE.

/**
 * InkTrail — the actual canvas. Only ever mounted on a real hovering mouse with
 * motion allowed (see the gate below), so the loop may assume a pointer exists.
 */
function InkTrail() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return // ancient/again-disabled 2D context — fail silent, render nothing

    // --- Pre-allocated ring buffer ------------------------------------------
    // One segment = one quadratic brush stamp: start(a) → control(b) → end(e),
    // plus a base width, a birth time, an active flag, and two scratch fields the
    // two render passes hand between themselves. Built ONCE; the loop only mutates.
    const segs = new Array(MAX_SEGMENTS)
    for (let i = 0; i < MAX_SEGMENTS; i++) {
      segs[i] = { ax: 0, ay: 0, bx: 0, by: 0, ex: 0, ey: 0, w: 0, born: 0, on: false, _a: 0, _w: 0 }
    }
    let head = 0 // the ring's write cursor — next slot to (over)write

    // --- Mutable scratch (closure-scoped numbers; never reallocated) ---------
    let w = 0
    let h = 0
    let dpr = 1
    let mouseX = 0
    let mouseY = 0
    let moved = false
    let px = 0 // previous RAW pointer sample…
    let py = 0
    let mx = 0 // …and the previous MIDPOINT (start of the next quadratic)
    let my = 0
    let hasPrev = false
    let penWidth = W_MIN
    let rafId = 0
    let dirtySize = false
    let disposed = false

    // --- Canvas (re)size + context statics ----------------------------------
    // Setting canvas.width/height WIPES the whole 2D state, so every static the
    // loop relies on (the DPR transform, the round caps, the ink colour) is
    // (re)applied here — on first run and after every resize.
    const setup = () => {
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      // setTransform (absolute) — NOT scale (relative) — so repeated resizes never
      // compound the DPR scale. From here we draw in pure CSS pixels.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      // Set ONCE: per frame we modulate globalAlpha (a number), and never rebuild
      // an rgba() string — string-building in the loop is exactly the GC stutter
      // the brief warned against.
      ctx.strokeStyle = INK
    }
    setup()

    // --- The single render loop ---------------------------------------------
    const tick = (now) => {
      if (dirtySize) {
        dirtySize = false
        setup()
      }

      // Coalesce this frame's pointer input into at most ONE segment — decoupling a
      // high-Hz mouse from the refresh rate, for a flat cost per frame.
      if (moved) {
        moved = false
        if (!hasPrev) {
          // First sighting (or first after the pointer left the window): seed the
          // smoother and draw nothing — no rogue stroke from (0,0) or across a gap.
          px = mouseX
          py = mouseY
          mx = mouseX
          my = mouseY
          hasPrev = true
        } else {
          const dx = mouseX - px
          const dy = mouseY - py
          const speed = Math.sqrt(dx * dx + dy * dy) // px this frame = velocity

          // Velocity → width. smoothstep maps slow→W_MAX (the ink pools) and
          // fast→W_MIN (a dry, sharp line); W_EASE relaxes it so the swell is organic.
          let t = (speed - V_SLOW) / (V_FAST - V_SLOW)
          t = t < 0 ? 0 : t > 1 ? 1 : t
          t = t * t * (3 - 2 * t)
          const targetW = W_MAX + (W_MIN - W_MAX) * t
          penWidth += (targetW - penWidth) * W_EASE

          if (speed > 0.01) {
            // Midpoint-quadratic smoothing: the new endpoint is the midpoint between
            // the previous and current raw points, and the previous raw point is the
            // control. Chaining these gives a C1-continuous, buttery organic path
            // instead of jagged straight segments between raw coordinates.
            const nmx = (px + mouseX) * 0.5
            const nmy = (py + mouseY) * 0.5
            const s = segs[head] // overwrite the oldest slot — bounded memory, no growth
            s.ax = mx
            s.ay = my
            s.bx = px
            s.by = py
            s.ex = nmx
            s.ey = nmy
            s.w = penWidth
            s.born = now
            s.on = true
            head = (head + 1) % MAX_SEGMENTS
            mx = nmx // advance the smoother…
            my = nmy
            px = mouseX // …and the raw-prev point
            py = mouseY
          }
        }
      }

      // Full clear + redraw every living segment from its age. Easier to reason about
      // than translucent-rect fading and it can never accumulate ghost ink.
      ctx.clearRect(0, 0, w, h)

      // PASS 1 — Calcolo età ed eliminazione (Senza disegnare l'alone liquido)
      let live = 0
      for (let i = 0; i < MAX_SEGMENTS; i++) {
        const s = segs[(head + i) % MAX_SEGMENTS]
        if (!s.on) continue
        const age = now - s.born
        if (age >= LIFE) {
          s.on = false
          continue
        }
        const k = age / LIFE
        const fade = Math.pow(1 - k, FADE_POW)
        
        s._a = A_CORE * fade
        s._w = s.w
        live++
      }

      // PASS 2 — La Texture Graffite (Linee multiple sfalsate)
      for (let i = 0; i < MAX_SEGMENTS; i++) {
        const s = segs[(head + i) % MAX_SEGMENTS]
        if (!s.on) continue
        
        ctx.globalAlpha = s._a
        ctx.lineWidth = 0.8 // Tratto microscopico e tagliente
        
        // Disegniamo 3 micro-tratti per creare il "graffio" della mina sul foglio
        for (let j = -1; j <= 1; j++) {
          ctx.beginPath()
          // Offset per separare i tratti in base alla larghezza
          const offset = j * (s._w * 0.6)
          ctx.moveTo(s.ax + offset, s.ay + offset)
          ctx.quadraticCurveTo(s.bx + offset, s.by + offset, s.ex + offset, s.ey + offset)
          ctx.stroke()
        }
      }

      // Keep animating while ink lives OR a fresh move arrived mid-frame; otherwise
      // PARK the loop (the canvas is already cleared this frame) so the effect costs
      // nothing at rest. onMove / onResize re-arm it via kick().
      rafId = live > 0 || moved ? requestAnimationFrame(tick) : 0
    }

    // Start a frame only if one isn't already in flight (and we're not torn down).
    // The stale-but-nonzero rafId held DURING a tick is what blocks double-scheduling.
    const kick = () => {
      if (rafId === 0 && !disposed) rafId = requestAnimationFrame(tick)
    }

    // --- Listeners — the cheapest possible handlers (assign + kick) ----------
    const onMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      moved = true
      kick()
    }
    // Pointer left the viewport: break the stroke so re-entry elsewhere doesn't draw
    // a straight line across the whole screen. Existing ink keeps fading by itself.
    const onLeave = () => {
      hasPrev = false
    }
    const onResize = () => {
      dirtySize = true
      kick()
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    window.addEventListener('resize', onResize)

    // --- Strict, leak-free teardown (StrictMode double-mount safe) -----------
    // Every binding above is local to THIS effect run, so the first run's cleanup
    // fully dismantles itself before the second run builds its own world: the frame
    // is cancelled, the loop can never resurrect (disposed + the kick guard), and
    // all three listeners are detached.
    return () => {
      disposed = true
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="sumi-cursor" aria-hidden="true" />
}

/**
 * SumiCursor — public entry point.
 *
 * Renders NOTHING (and so spins up no rAF loop, no listeners, no GPU blend layer)
 * unless the visitor has a real hovering mouse AND has not asked for reduced
 * motion — exactly mirroring CustomCursor. Touch / coarse-pointer devices skip the
 * battery- and CPU-heavy global canvas, and reduced-motion users get a perfectly
 * still page. The check sits above every hook and the outer component holds none of
 * its own, so this early return is fully rules-of-hooks safe.
 */
export default function SumiCursor() {
  const enabled =
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !prefersReducedMotion()

  if (!enabled) return null

  return <InkTrail />
}
