# Handoff: Fletea — Landing + UI Kit redesign

## Overview

This handoff documents a **redesign of the Fletea (ex-Muvi) frontend** — a freight/moving service web app. The bundle covers three screens (Landing, Admin, Pago Resultado) but the **Landing** is where ~90% of the design work happened: a full-bleed scroll-driven truck animation, a quote form, social/trust UI, persistent brand header, and a popup cotization result modal.

The original codebase is **Angular 17** standalone components (`frontend/src/app/pages/{landing,admin,pago-resultado}/*.component.{ts,html,css}`). The bundled reference is implemented in **plain React (Babel-transpiled JSX)** as a design prototype — it is NOT a drop-in replacement for the Angular code.

## About the Design Files

The files in `reference/` are **design references created in HTML/JSX** — a working prototype showing the intended look, behavior, and interactions. They are **not production code to copy into the Angular codebase verbatim**.

**Your task:** recreate this design in the existing Angular 17 codebase, using its established standalone-component patterns. Map each React component (`Landing.jsx`, `Form.jsx`, etc.) to the equivalent Angular component (`landing.component.{ts,html,css}`), and lift the styling/markup/behavior into Angular templates + TS class methods.

If you find a component or pattern that is unclear, the React reference is the source of truth — open it, run it (just open `reference/index.html` in a browser), and observe.

## Fidelity

**High-fidelity (hifi).** Every color, spacing value, typography scale, animation curve, and interaction state is intentional. Recreate pixel-perfectly — do not "approximate" or substitute with a UI library's defaults.

## Target codebase mapping

| Reference file (React) | Maps to (Angular) |
|---|---|
| `reference/Landing.jsx` | `frontend/src/app/pages/landing/landing.component.{ts,html,css}` |
| `reference/Form.jsx` (Field, Buttons, etc.) | Inline in `landing.component.html` + `.css`, or new shared `components/` |
| `reference/Admin.jsx` | `frontend/src/app/pages/admin/admin.component.{ts,html,css}` |
| `reference/PagoResultado.jsx` | `frontend/src/app/pages/pago-resultado/pago-resultado.component.{ts,html,css}` |
| `reference/colors_and_type.css` | Merge into `frontend/src/styles.css` (replace `:root` tokens) |
| `reference/assets/*.{png,jpeg}` | Copy to `frontend/src/assets/` and reference via `assets/...` |

The truck animation frames (`assets/webp/camion_001.webp` … `camion_160.webp`) **are already in the repo** under `webp/` at the project root in the original repo. Move them to `frontend/src/assets/webp/` (or a CDN) before deploy.

---

## Screens / Views

### 1. Landing (`landing.component.*`)

**Purpose:** hero + scroll-driven truck animation + cotization form. The user lands on a static "portada" frame; as they scroll, 160 truck frames play scrubbed-to-scroll, and at ~92% of scroll a quote form fades in.

**Layout (1.2× viewport tall scroll section):**
- Position: `relative`, height `120vh`
- Sticky `<canvas>` at `inset: 0` renders the current truck frame
- Fixed `<PageLogo>` top-left, `<TrustChip>` bottom-right, `<SocialBar>` bottom-left
- 4 text overlays positioned absolutely inside the sticky container:
  1. Brand mark (top, ~7vh)
  2. Hero title group (centered, vertically)
  3. Scroll cue (bottom, ~6vh)
  4. Frame counter "XX / 100" (top-right, fades in at 5%+)
- Form slot (centered) appears at scroll ≥ 92%

**Components — exact specs:**

#### `<PageLogo>` (persistent header, fixed)
- Position: `fixed; top: 18px; left: 22px; z-index: 50`
- Element: `<a href="#top">` — clicks call `window.scrollTo({top:0, behavior:'smooth'})` to reset truck animation
- Layout: `flex; align-items: center; gap: 0.65rem`
- Image: `assets/logo-fletea.png`, 56×56px, `filter: drop-shadow(0 4px 14px rgba(233,69,96,.45))`
- Wordmark: text "FLETEA", `font-size: 1.33rem; font-weight: 900; letter-spacing: 0.32em; text-transform: uppercase; color: rgba(245,245,245,0.92); text-shadow: 0 2px 12px rgba(0,0,0,0.6)`
- Responsive:
  - `≤900px`: img 46×46, wordmark 1.05rem
  - `≤600px`: img 38×38, wordmark 0.92rem
  - `≤380px`: wordmark hidden

#### Scroll-driven truck canvas
- 160 frames preloaded in batches of 20 from `assets/webp/camion_NNN.webp` (zero-padded 3 digits)
- Loader screen blocks render until first 32 frames are ready
- Scroll progress 0→1 maps to frame index 0→159 with **LERP smoothing** (factor 0.12) for inertia
- If a target frame isn't loaded yet, search radially for the nearest loaded frame; never fall back to frame 0 (would cause flash-to-start glitch)
- `getComputedStyle` for stage color is **cached**, refreshed only on resize (calling it per-frame causes layout flush thrash)
- Throttle React re-renders: only `setProgress` if delta > 0.4% (RAF runs at 60fps; setState would re-render overlays 60×/sec without this)

#### Hero text overlays
- All `pointer-events: none`, `z-index: 9`
- **Brand mark** (small overline at top): "FLETES Y MUDANZAS · AL INSTANTE", `font-size: clamp(0.72rem, 1.2vw, 0.83rem); letter-spacing: 0.32em; opacity: brandOpacity * 0.9`
- **Hero title** (centered): `<h1>¿Necesitás un flete?</h1>`, `font-family: var(--t-display-font, Inter); font-weight: var(--t-display-weight, 900); font-size: clamp(2.2rem, 6vw, 4.5rem); letter-spacing: var(--t-display-track, -0.035em); line-height: 1.05; color: #f5f5f5`
- **Subtitle**: "Cotizá en segundos. Reservá con seña.", `font-size: clamp(1.1rem, 2vw, 1.38rem); font-weight: 600; color: rgba(245,245,245,0.95); text-shadow: 0 2px 18px rgba(0,0,0,.6), 0 0 8px rgba(0,0,0,.4)`
- **Scroll cue**: down chevron 26×26 + "Scrolleá para cotizar" 0.84rem
- **Fade math** (driven by scroll progress `p` 0→1):
  - `cueOpacity = clamp(1 - p / 0.12, 0, 1)` — cue disappears first
  - `brandOpacity = clamp(1 - p / 0.35, 0, 1)`
  - `titleOpacity = clamp(1 - p / 0.45, 0, 1)`
  - `titleBlur = p * 12px` — title gets progressively blurry
  - `titleScale = 1 - p * 0.04`
  - `titleY = -p * 60px`

#### Frame counter (top-right)
- Position: `fixed; top: 18px; right: 22px` (or above nav if present)
- Format: `String(currentFrame).padStart(2,'0') + ' / 100'` (display 100 max for cleaner UX even though there are 160 frames)
- `opacity: p > 0.05 ? 1 : 0`, `transition: opacity .3s`
- Tabular figures: `font-variant-numeric: tabular-nums`

#### `<FormCard>` (cotization form)
- Position: shows up centered at scroll ≥ 92%, inside an absolutely-positioned slot that fades in (`opacity: showForm ? 1 : 0`, `transform: showForm ? translateY(0) : translateY(30px)`)
- Card style: `width: 100%; max-width: 420px; background: rgba(18,18,24,0.92); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2rem 1.6rem; box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset`
- **No internal scroll on mobile** — `max-height: none` (was `88vh` originally, removed). Padding tightened on `≤600px` to `1.25rem 1rem` and h2 to `1.25rem` so the entire form fits in the viewport without scrolling.
- Overline: "TU FLETE · PASO 1 DE 2" — `font-size: 11px; font-weight: 700; letter-spacing: 0.22em; color: var(--t-accent); text-transform: uppercase`
- Title: `<h2>Cotizá tu flete</h2>` — `font-size: 1.5rem; font-weight: 800; letter-spacing: -0.01em; color: #f5f5f5`
- Fields (in order): Nombre completo, Teléfono (tel), Email, Origen, Destino, Fecha (date) + Hora (time) — last two in a `FieldRow` (50/50 flex)
- Field style: `padding: 0.75rem 1rem; border: 1.5px solid; border-radius: 10px; font-size: 0.95rem; background: rgba(255,255,255,0.04)`
  - Default border: `rgba(255,255,255,0.1)`
  - Focused border: `var(--t-accent)`, background: `rgba(255,255,255,0.07)`, box-shadow: `0 0 0 3px rgba(233,69,96,0.15)`
- Label style: `font-size: 0.7rem; font-weight: 700; color: rgba(245,245,245,0.5); text-transform: uppercase; letter-spacing: 0.08em`
- "Calcular precio" button (`PrimaryButton`): full-width, `padding: 0.9rem 1.5rem; border-radius: 10px; background: var(--t-accent); color: #fff; font-weight: 700; box-shadow: 0 4px 20px rgba(233,69,96,0.35)`. Hover: `translateY(-2px)`, shadow grows to `0.45` alpha.
- Validation: requires `origen` and `destino` non-empty, else show `<ErrorMsg>` ("Completá origen y destino para cotizar."). `ErrorMsg` style: `padding: 0.7rem 1rem; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; color: #fca5a5; font-size: 0.85rem`
- On submit: 700ms delay, then compute mock km (`18 + Math.random()*12`) → `total = km * 4025` → `montoSena = total * 0.15`. In production, replace with API call.

#### `<QuoteModal>` (cotization result — popup)
- Trigger: opens when `cotizacion` state is set (i.e. after Calcular precio succeeds)
- Backdrop: `position: fixed; inset: 0; z-index: 200; background: rgba(5,5,9,0.72); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fleteaModalFadeIn .25s ease`
- Click backdrop → close. Esc key → close. Body scroll locked while open.
- Modal card: `max-width: 460px; background: rgba(18,18,24,0.98); border: 1px solid rgba(255,255,255,0.10); border-radius: 20px; padding: 1.75rem 1.6rem 1.5rem; box-shadow: 0 40px 120px rgba(0,0,0,0.7); animation: fleteaModalSlideUp .3s cubic-bezier(.2,.8,.2,1)`
- Mobile (`≤600px`): padding reduced to `1.4rem 1.1rem 1.2rem`, border-radius 18px
- Close button: top-right corner, 34×34 round, `background: rgba(255,255,255,0.06)` (hover `0.12`), white × icon
- Overline: "TU COTIZACIÓN · PASO 2 DE 2"
- Title: "Listo, tu flete" — h2 1.45rem, weight 800
- Three rows (using `<Row>` component):
  - "Distancia total" → `${km.toFixed(1)} km`
  - "Costo total" → `$ ${total}` (es-AR locale formatting)
  - "Seña a abonar (15%)" → highlighted: bigger (1.2rem), accent color, with top border separator
- "Reservar y pagar seña" button (`SuccessButton`): full-width green `#22c55e`, hover `#16a34a`. On click: 700ms, then `onReservar()` callback (navigates to pago-resultado).

#### `<TrustChip>` (bottom-right tab)
- Position: `fixed; bottom: 12px; right: 0; z-index: 50` (right edge flush)
- Shape: pill with **left side rounded (radius 999) and right side flat** — looks like a tab emerging from the right edge
- Border: `1px solid rgba(255,255,255,0.10)` on top/left/bottom only; `border-right: none`
- Background: `rgba(18,18,24,0.85); backdrop-filter: blur(14px)`
- Shadow: `-10px 8px 28px rgba(0,0,0,0.5)` (skewed left to reinforce edge-emergence)
- Padding (desktop expanded): `0.77rem 1.6rem 0.77rem 0.98rem`
- Content: red disc 31×31 (`background: var(--t-accent)`) with white check icon (path `M5 12l5 5L20 7`, stroke 3) + text "+1.000 fletes realizados" (font 17px, weight 700, letter-spacing 0.03em)
- **Mobile collapse behavior** (`≤600px`): collapses to a small disc (52px max-width). Tap → expands to full pill. State is mutually exclusive with `<SocialBar>` (only one open at a time — see "Mutual exclusion" below).
- Animation: `transition: max-width .35s cubic-bezier(.2,.8,.2,1), padding .3s, gap .3s`. Text inside fades + translates (`opacity .25s ease .05s, transform .25s ease`).
- Small `×` close button appears top-right when expanded on mobile (16×16, `rgba(255,255,255,0.10)`)

#### `<SocialBar>` (bottom-left)
- Position: `fixed; bottom: 22px; left: 22px; z-index: 50`
- Layout: `flex; flex-direction: row; gap: 13px` (4 bubbles in a row)
- 4 social bubbles, each: 57×57 circle, `border-radius: 50%; overflow: hidden`, `<img>` inside scaled `transform: scale(1.32)` to crop the white margins of the source JPEGs
- Images: `assets/social-{whatsapp,instagram,facebook,tiktok}.jpeg`
- Hover: `translateY(-3px) scale(1.06)`, box-shadow grows + adds `0 0 0 2px rgba(233,69,96,0.45)` red ring
- Links: `https://wa.me/541100000000`, `https://instagram.com/fletea`, `https://facebook.com/fletea`, `https://tiktok.com/@fletea` (all `target="_blank" rel="noreferrer"` — **placeholders, replace with real handles**)
- **Mobile collapse behavior** (`≤600px`): all 4 bubbles hide behind a 44×44 `+` FAB (rotates 45° to `×` when open). Tap FAB → bubbles slide in **horizontally** with `max-width: 0 → 320px` animation, opacity 0 → 1.
- Bubble size on mobile: 42×42, gap 8px

#### Mutual exclusion: TrustChip ↔ SocialBar
- State `openPanel: 'chip' | 'social' | null` is lifted to the `Landing` parent
- Both children receive `openPanel` and `setOpenPanel` props
- Opening one auto-closes the other
- Auto-collapses when leaving mobile (resize from 600 → 1024px clears the open panel)

#### Loader (initial)
- Full-bleed (`fixed; inset: 0; z-index: 9999`); shown until ≥32 frames preloaded
- Background: `var(--t-stage, #0a0a0f)`
- Content (centered): wordmark "FLETEA" pulsing + small loading bar (`width: 200px; height: 2px; background: rgba(255,255,255,0.1)`) with red fill animating to `width: ${loadingProgress}%`
- Progress text: "Cargando flota... XX%"

---

### 2. Admin (`admin.component.*`)

Simpler screen — table of reservations with status badges. See `reference/Admin.jsx`.

- Background: `var(--bg-light)` light theme, `min-height: 100vh; padding: 2rem`
- Header: title "Panel de Administración - Fletea" + refresh button (red, accent)
- Table with columns: ID, Nombre, Teléfono, Origen → Destino, Fecha, Costo, Estado, Acciones
- Status badges (using `<Badge>` component): `PENDIENTE_PAGO` yellow, `RESERVADO` green, `COMPLETADO` blue
- Empty state: centered icon + "No hay reservas todavía"

---

### 3. Pago Resultado (`pago-resultado.component.*`)

Three states driven by `estado: 'exitoso' | 'fallido' | 'pendiente'` (from URL query in production):

- **Exitoso** (success): green check icon, "¡Pago exitoso!", reservation summary, "Volver al inicio" button
- **Fallido**: red X icon, "El pago no se pudo procesar", retry button + back button
- **Pendiente**: amber clock icon, "Tu pago está siendo procesado"

Each state: full-screen centered card, dark background, animation on icon entry.

---

## Interactions & Behavior

### Scroll → truck animation (Landing)
- Bind to `scroll` event on `window`, throttle via `requestAnimationFrame`
- Compute progress: `(window.scrollY - containerTop) / (containerHeight - viewportHeight)`, clamped 0..1
- LERP target frame each RAF tick: `current += (target - current) * 0.12`
- Draw to canvas via `ctx.drawImage(frames[Math.round(current)], 0, 0, w, h)`
- Resize handler: re-set canvas width/height to devicePixelRatio-aware values

### Form submission flow
1. User fills fields → clicks "Calcular precio"
2. Validate origen + destino (else `ErrorMsg`)
3. 700ms loading state on button ("Calculando...")
4. `cotizacion` state set → `<QuoteModal>` mounts with fade-in + slide-up animations
5. User clicks "Reservar y pagar seña" → 700ms loading ("Procesando...") → `onReservar()` navigates to pago-resultado screen with state=exitoso

### Logo reset
- `<a href="#top">` on PageLogo, `onClick={(e) => { e.preventDefault(); window.scrollTo({top:0, behavior:'smooth'}); }}`
- Smooth scroll triggers the truck animation in reverse (back to frame 0)

### Modal escape paths
- Click backdrop (anywhere outside modal card) → close
- Esc key → close
- × button → close
- All paths set `cotizacion` state to `null` on parent, body scroll restored

---

## State Management

### Landing
```ts
data: { nombreCompleto, telefono, email, origen, destino, fecha, hora }
cotizacion: null | { distanciaKm, costoTotal, montoSena }
calculando: boolean
error: string
openPanel: null | 'chip' | 'social'  // for mobile collapse mutex
scrollProgress: number  // 0..1, throttled at 0.4% delta
```

### Replace mock cotization with API call
The reference uses `setTimeout(700)` + `Math.random()` — replace with the existing Fletea backend's quote endpoint (Spring Boot, see `backend/` in original repo).

---

## Design Tokens

### Colors
```css
--t-accent:        #e94560;  /* signal red, brand primary */
--t-accent-hover:  #d63851;
--t-accent-soft:   rgba(233,69,96,.15);
--t-stage:         #0a0a0f;  /* anthracite, page background */
--t-stage-2:       #111118;  /* surface, one step up */
/* text */
--text-primary:    #f5f5f5;
--text-secondary:  rgba(245,245,245,0.7);
--text-tertiary:   rgba(245,245,245,0.5);
--text-overline:   rgba(245,245,245,0.5);
/* borders / surfaces */
--border-subtle:   rgba(255,255,255,0.08);
--border-default:  rgba(255,255,255,0.10);
--surface-light:   rgba(255,255,255,0.04);
--surface-medium:  rgba(255,255,255,0.07);
/* semantic (rich palette) */
--success: #10b981; --warning: #f59e0b; --error: #f43f5e; --info: #6366f1;
/* badge backgrounds (admin table) */
--badge-pending-bg: #fff3cd;  --badge-pending-fg: #856404;
--badge-reserved-bg:#d4edda;  --badge-reserved-fg:#155724;
--badge-done-bg:    #d1ecf1;  --badge-done-fg:    #0c5460;
```

See `reference/colors_and_type.css` for full token list.

### Typography
- **Family**: Inter (Google Fonts), weights 400/600/700/800/900
- **Display**: weight 900, letter-spacing -0.035em (configurable via tweak panel — production should pick one)
- **Body**: 16px / line-height 1.5
- **Scale**: see `clamp()` values inline in component specs above

### Spacing / radii
- 8/12/16/20px common border-radii
- Form fields: radius 10px
- Cards: radius 20px (modal, form-card), 16px on mobile
- FAB / bubbles: 50% (circle)

### Shadows
- Form card: `0 30px 80px rgba(0,0,0,0.6)` + `inset 0 0 0 1px rgba(255,255,255,0.04)`
- Modal: `0 40px 120px rgba(0,0,0,0.7)`
- Trust chip: `-10px 8px 28px rgba(0,0,0,0.5)` (skewed for edge-emerge effect)
- Social bubble (resting): `0 5px 16px rgba(0,0,0,0.45)`
- Social bubble (hover): `0 10px 28px rgba(0,0,0,0.55), 0 0 0 2px rgba(233,69,96,0.45)`
- Primary button: `0 4px 20px rgba(233,69,96,0.35)` → hover `0 8px 25px rgba(233,69,96,0.45)`

### Animations / easings
- Modal fade-in: `0.25s ease`
- Modal slide-up: `0.3s cubic-bezier(.2,.8,.2,1)`
- Bubble hover: `0.25s cubic-bezier(.2,.8,.2,1)`
- Trust chip expand/collapse: `0.35s cubic-bezier(.2,.8,.2,1)` on max-width
- Frame LERP: factor 0.12 per RAF tick
- Button hover translateY: `0.2s`

---

## Responsive breakpoints

```css
@media (max-width: 900px) { /* tablet — logo/wordmark scale down, social bubbles 50px */ }
@media (max-width: 600px) { /* mobile — collapsible chip + social, form padding tight, modal full-bleed feel */ }
@media (max-width: 380px) { /* tiny — wordmark hidden, chip text hidden */ }
@media (max-height: 640px) { /* landscape phone — form even tighter */ }
```

See `reference/index.html` `<style>` block for the full responsive cascade with `!important` overrides (necessary because base styles are inline-React).

In Angular, **drop the `!important`** — use proper CSS specificity in `landing.component.css`.

---

## Assets

All in `reference/assets/`:

| File | Use | Notes |
|---|---|---|
| `logo-fletea.png` | Brand isotipo (logo mark) | Drop-shadow in CSS, not baked-in |
| `social-whatsapp.jpeg` | WhatsApp bubble | AI-generated, brand palette baked in (anthracite + red ring + white glyph) |
| `social-instagram.jpeg` | Instagram bubble | Same |
| `social-facebook.jpeg` | Facebook bubble | Same |
| `social-tiktok.jpeg` | TikTok bubble | Same |

**Truck animation frames** (`camion_001.webp` … `camion_160.webp`): not bundled here — already in the repo at `webp/` (160 files, ~17MB total). Move to `frontend/src/assets/webp/` for the Angular build.

🚩 **Logo:** if a real Fletea logo file exists, replace `logo-fletea.png` with it. The current one is a working stand-in.

🚩 **Social bubbles:** the 4 JPEGs were AI-generated to match the brand palette. For production, you may want to replace with the official brand SVGs of each network — but those are full-color (green WhatsApp, gradient Instagram, etc.) and won't match the anthracite-and-red look. Discuss with the design owner.

🚩 **Social hrefs:** all 4 are placeholders (`wa.me/541100000000`, `instagram.com/fletea`, etc.). Replace with the real Fletea handles before deploy.

---

## Files in this bundle

```
reference/
├── index.html              ← entry point: open in browser to see the design running
├── Landing.jsx             ← scroll truck + form + modal + chip + social
├── Form.jsx                ← Field, FieldRow, PrimaryButton, SuccessButton, ErrorMsg, Badge
├── Brand.jsx               ← logo + wordmark component
├── Admin.jsx               ← admin table screen
├── PagoResultado.jsx       ← pago resultado screen (3 states)
├── colors_and_type.css     ← design tokens
└── assets/
    ├── logo-fletea.png
    ├── social-whatsapp.jpeg
    ├── social-instagram.jpeg
    ├── social-facebook.jpeg
    └── social-tiktok.jpeg
```

## How to run the reference

```bash
cd reference/
python3 -m http.server 8000
# open http://localhost:8000
```

Or any other static server. The reference is fully client-side (React via CDN, no build step).

---

## Implementation order (suggestion)

1. **Tokens first**: merge `colors_and_type.css` into `frontend/src/styles.css`. Replace the existing `:root` block.
2. **Landing scaffold**: create the scroll container + sticky canvas in `landing.component.html`. Wire up the frame preloader in `landing.component.ts` (Angular's `ngOnInit` + `HostListener('window:scroll')` or RxJS `fromEvent`).
3. **Hero overlays**: brand mark, title, subtitle, scroll cue. Bind opacity/transform to a scroll progress signal.
4. **Page logo + frame counter**: standalone components or inline.
5. **Form**: port `<FormCard>` to template + reactive forms (Angular `FormBuilder`). Mock the cotization with a service stub at first; replace with real API later.
6. **Modal**: port `<QuoteModal>` — Angular CDK `Overlay` is a good fit, or a simple `*ngIf` + `[@modalAnim]` animation.
7. **TrustChip + SocialBar**: standalone components with the mobile collapse logic. Use a shared service or an `@Input()/@Output()` from Landing for the mutex state.
8. **Responsive**: write the media queries in `landing.component.css` (drop the `!important`s — Angular's view-encapsulated styles don't need them).
9. **Admin + Pago**: simpler, follow the same pattern.

Once the Landing is complete, hook the form's `onReservar` to the Angular Router → navigate to `/pago-resultado?estado=exitoso`.
