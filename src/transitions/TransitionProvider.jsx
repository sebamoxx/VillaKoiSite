import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { prefersReducedMotion } from '../utils/animations'
import { TransitionContext } from './transitionContext'
import './transitions.css'

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase)

// The viscous "silk" feel, registered at import so the named eases exist before any
// gesture can ever build — never dependent on a mount-effect firing first.
// easeInQuint gathers then drops hard; easeOutQuint lands fast then settles on a long
// tail. Guarded so React Fast Refresh / re-imports don't redefine them needlessly.
if (!CustomEase.get('silkIn')) {
  CustomEase.create('silkIn', 'M0,0 C0.64,0 0.78,0 1,1')
  CustomEase.create('silkOut', 'M0,0 C0.22,1 0.36,1 1,1')
}

/**
 * TransitionProvider — the centralized "Liquid Silk / Sumi-e ink curtain" engine.
 *
 * THE GESTURE
 * -----------
 * A single heavy sheet of ink (#0a0908) drops from the top of the screen. Its
 * leading edge is NOT flat — it's an organic quadratic curve that bellies downward
 * as it falls, accelerates into a full black cover, the route swaps behind the
 * dark, and then the sheet keeps *flowing downward* — peeling off the bottom edge
 * with a trailing curve — to reveal the new page. Cover from the top, exit through
 * the bottom: one continuous downward flow, never a yo-yo.
 *
 * THE ZERO-LAG ARCHITECTURE (the whole reason this is an SVG, not a <div>)
 * -----------------------------------------------------------------------
 * The curtain is one <svg viewBox="0 0 100 100" preserveAspectRatio="none"> sized
 * to the viewport. Because the viewBox is a fixed 0–100 grid stretched to whatever
 * the screen is, we author the path in clean 0–100 units and NEVER read
 * window.innerWidth/innerHeight per frame — the single biggest cause of jank on
 * iOS Safari. GSAP morphs the <path>'s `d` string directly: every state below is a
 * 5-point shape (M, L, L, Q, Z) with an identical command count, so GSAP's core
 * interpolates the numbers number-for-number with NO MorphSVG plugin required.
 * The sheet rides its own compositor layer (see transitions.css), so re-rasterizing
 * the path never repaints the live page beneath it. (We also dropped the old
 * backdrop-blur void entirely — opaque ink needs no blur, and backdrop-filter was
 * the one genuinely expensive surface in the old transition.)
 *
 * WHY AN OVERLAY CURTAIN SIDESTEPS THE PINNED-SECTION BUG
 * ------------------------------------------------------
 * The CTA that launches the route change sits at the end of the Collection's
 * *pinned* horizontal scroll, so at click time that section is `position: fixed`
 * (a ScrollTrigger pin). Putting a `transform` on any ANCESTOR of a fixed element
 * re-bases it and yanks it across the screen. The curtain is an independent fixed
 * SVG that transforms *nothing* on the page — so it is immune to that bug by
 * construction (the old code fought it with backdrop-filter; we no longer have to).
 *
 * STATE OWNERSHIP (kept verbatim from the void engine, still load-bearing)
 * -----------------------------------------------------------------------
 *   1. Lenis. The exit FREEZES scrolling (`lenis.stop()`) the instant the gesture
 *      starts and THAWS it (`lenis.start()`) only once the new page has emerged, so
 *      it must live here and be shared, not hidden in App's effect.
 *   2. The fixed curtain, mounted once above every route so the drop (exit) and the
 *      flow-off (entrance) are two halves of one continuous, un-remounted gesture.
 *
 * ACCESSIBILITY
 * -------------
 * `prefers-reduced-motion` skips ALL of the path math and falls back to a simple,
 * elegant opacity crossfade on a flat black rectangle (the same SVG, no morph).
 * Touch devices run no Lenis, so the ~1.7s gesture is scroll-locked via the
 * `is-transitioning` class instead.
 */

/* ---------------------------------------------------------------------------
   THE PATH VOCABULARY (viewBox units, 0–100)

   Every string is M, L, L, Q, Z — five points, identical structure — which is the
   ONLY contract GSAP's native `d` interpolation needs. Two "vocabularies":

   COVER is anchored to the TOP edge; its leading (bottom) edge is the curve.
   REVEAL is anchored to the BOTTOM edge; its trailing (top) edge is the curve.

   The hand-off between them is a single instantaneous `gsap.set` at peak-dark from
   FULL_COVER to FULL_COVER_B. Both paint the IDENTICAL black rectangle, so the swap
   is invisible — and it is precisely what lets the sheet keep flowing DOWN off the
   bottom instead of lifting back up the way it came.
   ------------------------------------------------------------------------- */

// COVER — drops from the top. Control point dives past 100 to deepen the belly
// while the corners lag, so the leading edge reads as a heavy liquid drip.
const HIDDEN_TOP = 'M 0 0 L 100 0 L 100 0 Q 50 0 0 0 Z' //   zero-height at top → invisible
const BULGE_DOWN = 'M 0 0 L 100 0 L 100 58 Q 50 108 0 58 Z' // mid-fall, leading edge curved
const FULL_COVER = 'M 0 0 L 100 0 L 100 100 Q 50 100 0 100 Z' // flat bottom → solid full screen

// REVEAL — keeps flowing down and off the bottom. FULL_COVER_B is the same solid
// rectangle as FULL_COVER, described from the bottom up, so swapping is seamless.
const FULL_COVER_B = 'M 0 100 L 100 100 L 100 0 Q 50 0 0 0 Z' //  solid (bottom-anchored)
const TRAIL_DOWN = 'M 0 100 L 100 100 L 100 50 Q 50 100 0 50 Z' // top edge slides down, curved
const GONE_BOTTOM = 'M 0 100 L 100 100 L 100 100 Q 50 100 0 100 Z' // slid off bottom → invisible

const INK = '#0a0908' // the same warm near-black as the old void: ink, not a dead screen

// One timing language for the whole gesture (seconds). Tuned heavy & viscous.
const DROP_IN = 0.5 //  HIDDEN_TOP → BULGE_DOWN : the accelerating fall
const DROP_SET = 0.34 // BULGE_DOWN → FULL_COVER : the belly settling into full cover
const LIFT_IN = 0.42 //  FULL_COVER_B → TRAIL_DOWN : the sheet begins to slide off
const LIFT_OUT = 0.6 //  TRAIL_DOWN → GONE_BOTTOM : the long viscous exit past the bottom
const FADE = 0.34 //     reduced-motion crossfade, each half

export function TransitionProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()

  // Stable for the session (an OS-level pref), so it can gate every branch below.
  const [reduced] = useState(prefersReducedMotion)

  const lenisRef = useRef(null)
  const svgRef = useRef(null)
  const pathRef = useRef(null)

  // True from the first frame of the drop until the new page has fully emerged.
  // It is the REAL double-navigation guard (a second click while busy is ignored);
  // the curtain's pointer-events toggle is merely belt-and-suspenders on top of it.
  const busyRef = useRef(false)
  // The live gesture timeline, owned by hand so a route change never reverts it
  // mid-flight (the exact failure mode useGSAP's auto-revert would cause here).
  const tlRef = useRef(null)

  // --- Smooth scrolling (Lenis ⇄ GSAP ticker ⇄ ScrollTrigger) ----------------
  // Lifted here so the gesture can freeze/thaw it. Native scroll under reduced
  // motion and on touch/phones (where there is no curtain freeze to coordinate).
  useEffect(() => {
    if (reduced) return

    const isTouch =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(pointer: coarse)').matches ||
        window.innerWidth < 768)
    if (isTouch) return

    const lenis = new Lenis({
      anchors: {
        offset: 0,
        duration: 1.6,
        easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      },
    })
    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [reduced])

  // --- Static setup: park the curtain inert in its at-rest state --------------
  // useGSAP owns this (and only this): its revert() on unmount cleanly restores the
  // initial gsap.set. The gesture timelines themselves are deliberately NOT here —
  // they outlive a route change and are killed by hand instead (see tlRef).
  useGSAP(
    () => {
      const svg = svgRef.current
      const path = pathRef.current
      if (reduced) {
        // Reduced motion never morphs — the path is a flat black rect we crossfade.
        gsap.set(path, { attr: { d: FULL_COVER } })
        gsap.set(svg, { autoAlpha: 0, pointerEvents: 'none' })
      } else {
        gsap.set(path, { attr: { d: HIDDEN_TOP } })
        // The sheet is visible but degenerate (zero area) at rest, so autoAlpha stays
        // 1 and visibility is owned purely by the path geometry — nothing to fade.
        gsap.set(svg, { autoAlpha: 1, pointerEvents: 'none' })
      }
    },
    { dependencies: [reduced] },
  )

  // --- Close out a gesture: unfreeze the world, re-arm the curtain ------------
  const finishGesture = useCallback(() => {
    const svg = svgRef.current
    const path = pathRef.current
    svg.style.pointerEvents = 'none'
    document.documentElement.classList.remove('is-transitioning')
    lenisRef.current?.start()
    busyRef.current = false
    if (reduced) {
      gsap.set(svg, { autoAlpha: 0 }) // rect parked transparent (still FULL_COVER)
    } else {
      gsap.set(path, { attr: { d: HIDDEN_TOP } }) // re-hang the curtain at the top
    }
  }, [reduced])

  // --- The public API: navigate, but drop the ink curtain first --------------
  const navigateWithTransition = useCallback(
    (to) => {
      if (!to || to === location.pathname) return
      // A gesture is already mid-flight — ignore the second click. This is the true
      // guard against overlapping navigations; nothing below can race it.
      if (busyRef.current) return
      busyRef.current = true

      const svg = svgRef.current
      const path = pathRef.current
      tlRef.current?.kill()

      // Freeze the world. Desktop: stop Lenis. Touch (no Lenis): CSS scroll-lock.
      lenisRef.current?.stop()
      document.documentElement.classList.add('is-transitioning')

      if (reduced) {
        // No path math — a simple, elegant crossfade through a flat black rectangle.
        const tl = gsap.timeline({ onComplete: () => navigate(to) })
        tl.set(svg, { pointerEvents: 'auto', autoAlpha: 0 })
          .set(path, { attr: { d: FULL_COVER } })
          .to(svg, { autoAlpha: 1, duration: FADE, ease: 'power1.inOut' })
        tlRef.current = tl
        return
      }

      // COVER — the heavy ink curtain drops from the top, leading edge bellying
      // downward, then flattening into absolute black. Route swaps only at the end,
      // when the screen is fully dark.
      const tl = gsap.timeline({ onComplete: () => navigate(to) })
      tl.set(svg, { pointerEvents: 'auto' })
        .set(path, { attr: { d: HIDDEN_TOP } })
        .to(path, {
          keyframes: [
            { attr: { d: BULGE_DOWN }, duration: DROP_IN, ease: 'silkIn' },
            { attr: { d: FULL_COVER }, duration: DROP_SET, ease: 'silkOut' },
          ],
        })
      tlRef.current = tl
    },
    [location.pathname, navigate, reduced],
  )

  // --- Route changed: reset scroll, re-measure, flow the curtain away --------
  // A plain layout effect (NOT useGSAP) on purpose: useGSAP reverts its context when
  // the dep changes, which would claw back the curtain's full-cover state the instant
  // the route swaps and flash the page through. The timeline is owned manually
  // (tlRef) and killed by hand, so nothing reverts mid-gesture. Runs after the
  // incoming page mounts — its child layout effects (ScrollTriggers) fire before this
  // parent one — and before paint.
  useLayoutEffect(
    () => {
      const lenis = lenisRef.current
      const svg = svgRef.current
      const path = pathRef.current

      // Always land at the top of the new page. `force` lets the reset land even
      // while Lenis is stopped from the drop.
      lenis?.scrollTo(0, { immediate: true, force: true })
      window.scrollTo(0, 0)

      // Let the new DOM commit a frame, then re-measure every pinned/scrubbed
      // section for the page we just landed on.
      const raf = requestAnimationFrame(() => ScrollTrigger.refresh())

      if (busyRef.current) {
        tlRef.current?.kill()
        if (reduced) {
          // ENTRANCE (reduced) — fade the black rectangle back out.
          const tl = gsap.timeline({ onComplete: finishGesture })
          tl.to(svg, { autoAlpha: 0, duration: FADE, ease: 'power1.inOut' })
          tlRef.current = tl
        } else {
          // ENTRANCE — invisible swap to the bottom-anchored rectangle, then keep
          // flowing DOWN until the sheet has slid entirely off the bottom edge.
          const tl = gsap.timeline({ onComplete: finishGesture })
          tl.set(path, { attr: { d: FULL_COVER_B } })
            .to(path, {
              keyframes: [
                { attr: { d: TRAIL_DOWN }, duration: LIFT_IN, ease: 'silkIn' },
                { attr: { d: GONE_BOTTOM }, duration: LIFT_OUT, ease: 'silkOut' },
              ],
            })
          tlRef.current = tl
        }
      } else {
        // Fresh load / deep-link: the curtain was never raised. Make sure it's parked.
        if (reduced) gsap.set(svg, { autoAlpha: 0, pointerEvents: 'none' })
        else gsap.set(path, { attr: { d: HIDDEN_TOP } })
      }

      return () => cancelAnimationFrame(raf)
    },
    [location.pathname, reduced, finishGesture],
  )

  // Kill any in-flight timeline if the whole app tears down.
  useEffect(() => () => tlRef.current?.kill(), [])

  return (
    <TransitionContext.Provider value={{ navigate: navigateWithTransition }}>
      {children}
      {/* The ink curtain. One fixed 0–100 grid stretched to the viewport; GSAP owns
          the path geometry and the pointer-events toggle. aria-hidden: it is pure
          decoration and must never be announced. */}
      <svg
        ref={svgRef}
        className="transition-curtain"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path ref={pathRef} d={HIDDEN_TOP} fill={INK} />
      </svg>
    </TransitionContext.Provider>
  )
}
