# Claude Code Prompt: The Entry (sky → Delhi → theka → the Wall)

> **Before you run this:** unzip `entry-port.zip` into the **repo root** so that `entry-reference/index.html` and `entry-reference/assets/` exist. Run `/clear` in Claude Code first. Then paste everything below the line.

---

You're in the `dripTheka` repo (Next.js 16, React 19, TS, Tailwind v4, GSAP) on branch `redesign/v2`. The Wall is already the home route (`components/theka/wall/`). It's approved and it stays as it is. Your job is to add **the Entry** in front of it.

## 0. Pre-flight
1. `git status` should be clean. Commit anything pending first.
2. Confirm that `entry-reference/index.html`, `entry-reference/wall.html` and `entry-reference/assets/` exist (35 files). **If they're missing, stop and tell me.** Don't redraw or replace any image.
3. Open `entry-reference/index.html` in Chrome, from a local server (`npx serve entry-reference`), and scroll through it slowly, twice. **That page is the spec. Port it exactly; don't redesign it.**

## 1. What the Entry is
One unbroken, scroll-driven camera move. The camera **only ever moves forward**: no cuts, no zoom-outs, no blur filters, no black flashes.
1. **Above the clouds (0 → 2.7):** night sky, moon, stars and Delhi's orange horizon glow, over a **live WebGL volumetric cloud deck** (a raw fragment shader in the reference, with no three.js). The real wordmark `logo_word.png` sits left, above `EST. MMXXVI · NEW DELHI` and `SERVING FITS, NOT DRINKS`, with a scroll cue at the bottom.
2. **Through the clouds (1.2 → 2.7):** the camera descends and pitches down. The uniform `RV` makes the clouds break apart, and the shader's **alpha** goes transparent so the aerial photo (`aerial.jpg`, sitting *behind* the canvas) shows through the gaps.
3. **The lane (1.2 → 4.4):** one long push (z 1 → 2.05) toward the glowing lane, with the copy "SOMEWHERE DOWN THERE, / ONE SHUTTER'S STILL UP."
4. **The theka (3.8 → 6.1):** the street fades in while the forward motion continues (z 1 → 1.14 → 1.2). The lane's glow lines up with the doorway. A frosted card reads `THE THEKA · POUR #001 / NOW POURING / … / [Walk in →]`.
5. **Shutter (6.1 → 7.4):** the rolling shutter rises (yPercent −94), with warm light spill on the street. **Through the doorway you see the actual Wall.**
6. **Walk in (7.6 → 9.7):** the camera pushes until the doorway covers the screen (`walkZ()`). The scooter and spill fade, and "WELCOME, REGULAR. / आइए, बैठिए" appears. At the end the Entry is gone and **you're standing at the Wall**, with nothing reloaded and nothing jumping.

## 2. The one architectural idea: the doorway is a real hole
- `store_cut.webp` has a **transparent doorway** (scene rect `694,240 → 1114,736` in 1536×864 image space).
- In the reference, an `<iframe src="wall.html?embed=1">` sits **behind** every Entry layer as a stand-in for the Wall. **In the port, don't use an iframe. Render the real `<TheWall>` underneath the Entry, full-screen at 1:1.** The Entry is a fixed overlay on top. When the street layer is up, the Wall is visible only through the doorway hole.
- Layer order, bottom → top: `TheWall` (chrome hidden, non-interactive) → `skyfb` gradient → aerial → cloud canvas → street (blurred `streetBg` letterbox on mobile, with an evenodd `clip-path` hole cut to match the doorway, plus the scene: `store_cut`, tube glow, `#opening` holding the warm overlay and the shutter, spill, scooter) → vignette → Entry copy and header.
- `skyfb` and aerial are set to opacity 0 at 4.55, so the hole shows the Wall, not the sky gradient.

## 3. Files
**Assets**
- `public/theka/entry/`: `aerial.jpg`, `store_cut.webp`, `shutter.jpg`, `scooter.png`.
- `public/brand/`: `logo_word.png`, `logo_glass.png` (cream), `logo_glass_blue.png`, `logo_dt.png`. These are the brand's **real** marks.
- **Also replace the hand-drawn SVG glass in `WallHeader` (and anywhere else the logo appears) with `/brand/logo_glass.png`.**
- The Wall assets are already in `public/theka/wall/`. Don't duplicate them.

**Components:** `components/theka/entry/`
| File | Responsibility |
|---|---|
| `Entry.tsx` (client) | Owns the 900vh scroll track, the GSAP `ScrollTrigger` timeline (scrub 1.1) with the exact times above, header + skip, copy blocks, and completion. |
| `SkyCanvas.tsx` | Raw WebGL. Copy the fragment shader **verbatim**. Renders **on demand**: on uniform change, plus a 15fps idle drift only while `u < .02`. Resolution: 640 rows on desktop and 520 on mobile, × min(DPR, 1.5). `premultipliedAlpha`, clear to transparent. Stops rendering after timeline time 3.1. Falls back to the CSS gradient if WebGL fails. |
| `entryCamera.ts` | **Pure** functions: `cover(fx,fy,vw,vh)`, `streetBase(vw,vh)` (the mobile special case: `s=vw/560`, `x=vw/2−938s`, `y=max(60, vh·.44−450s)`), `camTransform(base,{z,fx,fy})`, `walkZ(base,vw,vh)`, `doorwayHoleClip(...)`. Unit-test them the same way you tested `wallLayout`. |
| `StreetScene.tsx` | The 1536×864 scene, with the layers in §2. |

**Wiring on the home route**
- Render `<TheWall entering={phase!=="done"} />` underneath and `<Entry onDone={…} />` on top.
- Add an `entering` prop to `TheWall`. While it's true: no lights-on intro, header / tag / foot / story link hidden, no pointer or keyboard handling. When it becomes false, fade the chrome in (0.9s, stagger 0.08, y −6 → 0), exactly like `wall.html?entered=1` in the reference.
- **On completion:** unmount the Entry, remove the scroll track, `scrollTo(0,0)`, then hand control to the Wall. Because the Wall is already on screen at 1:1, this must be **visually seamless**.

**When the Entry plays**
- First visit in a session plays it. Store `sessionStorage['dt_entered']` on completion **or** skip.
- Later visits in the session go straight to the Wall, keeping its normal lights-on intro.
- **Deep links skip it:** `/?fit=slug` goes straight to the Wall, zoomed on that fit, as it does today, and the product pages' `← Collection` keeps working.
- **"Skip to the wall →"**: fade the Entry out over 0.4s, then hand over to the Wall.
- **"Walk in"**: tween `window.scrollY` to the end over 4.6s (`power1.inOut`).
- **Reduced motion:** no scroll journey. Show the sky still with the wordmark and an "Enter the theka" button, which crossfades to the Wall.

## 4. Exact numbers (from the reference; don't eyeball)
- **Zoom anchors:**
  - Aerial: `fx 785, fy 330`, base `cover(785, mob?420:400)`.
  - Street: `fx 904, fy 488` (the doorway centre), base `cover(880,450)` on desktop and the special case above on mobile.
- **Timeline:** copy every `.to/.fromTo/.set` line from `build()` with its position, duration and ease. In particular:
  - `P.u` 0 → 1 over 2.7 (`power1.inOut`).
  - `P.r` 0 → 1 at 1.25 over 1.0 (`power2.out`).
  - The canvas fades out at 2.55.
- **The camera transform** uses `translate3d(...) scale(...)`. Never animate `filter: blur` anywhere.
- **Fonts:** Mukta 800 uppercase tight (`.disp`: `letter-spacing −.035em`, `line-height .9`) for headlines, and JetBrains Mono for labels. **No Fraunces in the Entry.**

## 5. Performance (the home route already has a Lighthouse budget)
- Preload only `logo_word.png`.
- Load `aerial.jpg`, `store_cut.webp`, `shutter.jpg` and `scooter.png` with `fetchPriority="low"` after first paint, but before the user can scroll past ~10% (start them on mount).
- The shader compiles once, and the WebGL context is lost or released on unmount.
- No Lenis on this route. Native scroll plus scrub smoothing.
- Re-run Lighthouse mobile on `/` and report before/after. Target: don't drop below today's score by more than 5 points.

## 6. VERIFY
1. A fresh session at `/`: the cloud deck renders, the wordmark shows, and scrolling plays the whole journey. **Zero hard cuts, zero blur**, and the camera never zooms out.
2. At the shutter, the doorway shows the **live Wall**, not a picture of it.
3. At the end, the Entry disappears and the Wall is interactive with **no visible jump**: same tee positions before and after the handoff. Compare screenshots taken just before and just after.
4. Reload in the same tab and you land on the Wall. `/?fit=ek-peg-aur` skips the Entry and opens zoomed.
5. "Skip" and "Walk in" both work. Scrolling back up mid-journey reverses cleanly.
6. Mobile 390×844: the sign is fully visible at the theka, the card docks at the bottom, the letterbox backdrop never covers the doorway, and nothing scrolls sideways.
7. Reduced motion: the Enter button crossfades to the Wall.
8. `tsc`, `lint`, tests and `build` pass.
9. **Side by side with `entry-reference/index.html`** at 1440×900 and 390×844, at scroll progress 0, .17, .3, .55, .72, .86 and 1. It should match. Fix any difference by moving toward the reference.

Then move `entry-reference/` to `docs/reference/entry/` and commit:
`feat(theka): the entry — sky to theka to wall, one continuous camera (redesign/v2)`

Report back with: files created and changed, any deviation from the reference and why, the Lighthouse before/after, and the before/after-handoff screenshots.
