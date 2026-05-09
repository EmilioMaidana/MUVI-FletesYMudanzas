/* global React, FleteaForm, FleteaBrand */
const { useState, useEffect, useRef } = React;
const { Field, FieldRow, PrimaryButton, SuccessButton, ErrorMsg } = FleteaForm;

const TOTAL_FRAMES = 160;
const LERP = 0.12;
const FRAMES = Array.from({ length: TOTAL_FRAMES }, (_, i) =>
  `../../assets/webp/camion_${String(i + 1).padStart(3, '0')}.webp`
);

/* ──────────────────────────────────────────────
   Frame preloader
   ────────────────────────────────────────────── */
function usePreloadedFrames() {
  const cacheRef = useRef([]);
  const [ready, setReady] = useState(0);
  useEffect(() => {
    let alive = true;
    const imgs = [];
    let loaded = 0;
    const loadBatch = (start) => {
      const end = Math.min(start + 20, TOTAL_FRAMES);
      const ps = [];
      for (let i = start; i < end; i++) {
        ps.push(new Promise((res) => {
          const img = new Image();
          img.src = FRAMES[i];
          img.onload = img.onerror = () => {
            imgs[i] = img; loaded++;
            if (alive) setReady(loaded);
            res();
          };
        }));
      }
      Promise.all(ps).then(() => { if (end < TOTAL_FRAMES && alive) loadBatch(end); });
    };
    loadBatch(0);
    cacheRef.current = imgs;
    return () => { alive = false; };
  }, []);
  return { imgs: cacheRef.current, ready };
}

/* ──────────────────────────────────────────────
   Loader splash (until first ~30 frames are ready)
   ────────────────────────────────────────────── */
function LoaderOverlay({ progress }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--t-stage, #0a0a0f)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <img src="../../assets/logo-fletea.png" alt="Fletea"
          style={{ width: 88, height: 88, display: 'block', margin: '0 auto 1.5rem',
            animation: 'fletea-float 2.4s ease-in-out infinite' }} />
        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#f5f5f5',
          letterSpacing: '0.3em', margin: '0 0 2rem' }}>FLETEA</h2>
        <div style={{ width: 220, height: 3, background: 'rgba(255,255,255,0.08)',
          borderRadius: 2, overflow: 'hidden', margin: '0 auto 1rem' }}>
          <div style={{ height: '100%', width: `${progress}%`,
            background: 'var(--t-accent)', borderRadius: 2, transition: 'width .15s linear' }} />
        </div>
        <span style={{ fontSize: '0.8rem', color: 'rgba(245,245,245,0.4)',
          fontWeight: 600, letterSpacing: '0.05em' }}>{progress}%</span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Cover overlay — sits over the scroll-bound canvas.
   At progress = 0, this is the "portada":
     · big title "¿Necesitás un flete?" centred
     · brand mark + "FLETEA" wordmark above
     · scroll cue + "Scrolleá para cotizar" below
   As progress grows, everything fades + blurs out
   so the truck animation reveals cleanly underneath.
   ────────────────────────────────────────────── */
function CoverOverlay({ progress }) {
  // Title fades 0 → 1 over progress 0 → 0.45
  const t = Math.max(0, Math.min(1, progress / 0.45));
  const titleOpacity = 1 - t;
  const titleBlur = t * 12;
  const titleTy = -t * 60;
  const titleScale = 1 - t * 0.04;

  // Brand mark (top) — fades a bit later than title
  const tBrand = Math.max(0, Math.min(1, progress / 0.35));
  const brandOpacity = 1 - tBrand;

  // Scroll cue — disappears fast, after just a hint of scroll
  const tCue = Math.max(0, Math.min(1, progress / 0.12));
  const cueOpacity = 1 - tCue;

  return (
    <>
      {/* Brand mark (top center) — only visible at the start of the cover.
          The fixed page logo (top-left) is the persistent identity. */}
      <div style={{
        position: 'absolute', top: '7vh', left: 0, right: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 9, pointerEvents: 'none',
        opacity: brandOpacity * 0.9,
        transform: `translateY(${tBrand * -16}px)`,
        filter: `blur(${tBrand * 5}px)`,
        willChange: 'opacity, transform, filter',
      }}>
        <span style={{
          fontSize: '0.83rem', fontWeight: 700, letterSpacing: '0.42em',
          color: 'rgba(245,245,245,0.6)', textTransform: 'uppercase',
        }}>Fletes y mudanzas · al instante</span>
      </div>

      {/* Title block (centered) */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 2rem', zIndex: 9, textAlign: 'center', pointerEvents: 'none',
      }}>
        <h1 style={{
          fontSize: 'clamp(2.8rem, 8vw, 6.5rem)',
          fontFamily: 'var(--t-display-font), system-ui, sans-serif',
          fontWeight: 'var(--t-display-weight, 900)',
          color: '#fff',
          letterSpacing: 'var(--t-display-track, -0.03em)',
          lineHeight: 1.02,
          textWrap: 'balance',
          textShadow: '0 6px 60px rgba(0,0,0,0.75)',
          margin: 0,
          maxWidth: '14ch',
          opacity: titleOpacity,
          transform: `translateY(${titleTy}px) scale(${titleScale})`,
          filter: `blur(${titleBlur}px)`,
          willChange: 'opacity, transform, filter',
        }}>¿Necesitás un flete?</h1>
        <p style={{
          marginTop: '1.35rem',
          fontSize: 'clamp(1.1rem, 2vw, 1.38rem)',
          color: 'rgba(245,245,245,0.95)',
          fontWeight: 600,
          letterSpacing: '0.02em',
          textShadow: '0 2px 28px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.6)',
          opacity: titleOpacity,
          transform: `translateY(${titleTy * 0.85}px)`,
          filter: `blur(${titleBlur * 0.7}px)`,
          willChange: 'opacity, transform, filter',
        }}>Cotizá al instante · Reservá en minutos</p>
      </div>

      {/* Scroll cue (bottom, centred under the title) */}
      <div style={{
        position: 'absolute', bottom: '6vh', left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '0.72rem',
        zIndex: 9, pointerEvents: 'none',
        opacity: cueOpacity,
        animation: 'fletea-float 2.5s ease-in-out infinite',
      }}>
        <span style={{
          fontSize: '0.84rem', color: 'rgba(245,245,245,0.7)',
          textTransform: 'uppercase', letterSpacing: '0.24em', fontWeight: 700,
          textShadow: '0 2px 14px rgba(0,0,0,0.55)',
        }}>Scrolleá para cotizar</span>
        <div style={{ color: 'var(--t-accent)',
          animation: 'fletea-pulse 2s ease-in-out infinite' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 4v16m0 0l-6-6m6 6l6-6" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Frame counter (top-right) — fades IN as you scroll */}
      <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 9,
        fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'rgba(245,245,245,0.55)', fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        opacity: Math.min(1, progress * 4) }}>
        {String(Math.round(progress * 100)).padStart(2, '0')} / 100
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────
   Scroll-bound canvas section
   First frame is the "portada"; scrolling animates 1→160
   ────────────────────────────────────────────── */
function ScrollSection({ children }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const targetRef = useRef(0);
  const lerpedRef = useRef(0);
  const lastReportedRef = useRef(0);
  const showFormRef = useRef(false);
  const lastDrawnRef = useRef(null);
  const stageColorRef = useRef('#0a0a0f');
  const rafRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const { imgs, ready } = usePreloadedFrames();

  // Show loader until enough frames are buffered for a smooth first reveal
  const FIRST_BATCH = 32;
  const initialReady = ready >= FIRST_BATCH;
  const loadingProgress = Math.min(100, Math.round((ready / FIRST_BATCH) * 100));

  useEffect(() => {
    const onScroll = () => {
      const c = containerRef.current;
      if (!c) return;
      const rect = c.getBoundingClientRect();
      const scrollable = c.offsetHeight - window.innerHeight;
      targetRef.current = Math.max(0, Math.min(1, -rect.top / scrollable));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !ctx) return;

    // Cache stage color once per resize cycle (cheap to refresh, expensive to read every frame)
    const refreshStageColor = () => {
      stageColorRef.current = getComputedStyle(document.documentElement)
        .getPropertyValue('--t-stage').trim() || '#0a0a0f';
    };
    refreshStageColor();

    const draw = () => {
      const t = targetRef.current;
      lerpedRef.current += (t - lerpedRef.current) * LERP;
      const p = lerpedRef.current;
      const idx = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(p * (TOTAL_FRAMES - 1))));
      // Prefer the desired frame; else nearest preloaded frame; else last drawn (no jump-back)
      let img = imgs[idx];
      if (!img || !img.complete || !img.naturalWidth) {
        // search outward for the closest loaded frame
        for (let d = 1; d < TOTAL_FRAMES; d++) {
          const a = imgs[idx - d], b = imgs[idx + d];
          if (a && a.complete && a.naturalWidth) { img = a; break; }
          if (b && b.complete && b.naturalWidth) { img = b; break; }
        }
      }
      if (!img && lastDrawnRef.current) img = lastDrawnRef.current;
      if (img && img.complete && img.naturalWidth) {
        lastDrawnRef.current = img;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cw = canvas.width / dpr;
        const ch = canvas.height / dpr;
        const SCALE = 1.06;
        const ir = img.naturalWidth / img.naturalHeight;
        const cr = cw / ch;
        let dw, dh;
        if (ir > cr) { dh = ch * SCALE; dw = dh * ir; }
        else { dw = cw * SCALE; dh = dw / ir; }
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2 - dh * 0.02;
        ctx.fillStyle = stageColorRef.current;
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, dx, dy, dw, dh);
      }
      // Throttle React updates: only re-render when progress moves meaningfully
      if (Math.abs(p - lastReportedRef.current) > 0.004) {
        lastReportedRef.current = p;
        setProgress(p);
        const wantForm = p >= 0.92;
        if (wantForm !== showFormRef.current) {
          showFormRef.current = wantForm;
          setShowForm(wantForm);
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      refreshStageColor();
    };
    resize();
    window.addEventListener('resize', resize);
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [imgs]);

  return (
    <>
      {!initialReady && <LoaderOverlay progress={loadingProgress} />}
      <section ref={containerRef} style={{
        width: '100%', height: '500vh', position: 'relative',
        background: 'var(--t-stage)',
      }}>
        <div style={{ position: 'sticky', top: 0, width: '100%', height: '100vh', overflow: 'hidden' }}>
          {/* Truck animation canvas — frame 1 is the portada */}
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, display: 'block' }} />

          {/* Vignette + bottom gradient for legibility over frame 1 */}
          <div style={{
            position: 'absolute', inset: 0,
            background:
              'radial-gradient(ellipse at center, transparent 35%, rgba(10,10,15,.5) 100%),' +
              'linear-gradient(to bottom, rgba(10,10,15,.45) 0%, transparent 22%, transparent 60%, rgba(10,10,15,.85) 100%)',
            pointerEvents: 'none', zIndex: 1,
            opacity: Math.max(0.25, 1 - progress * 0.6),
          }} />

          {/* Cover overlay: title/brand/cue, fades on scroll */}
          <CoverOverlay progress={progress} />

          {/* Form — appears at the end of the animation */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '2rem',
            opacity: showForm ? 1 : 0, pointerEvents: showForm ? 'all' : 'none',
            transform: showForm ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1)',
            zIndex: 10,
          }}>{children}</div>
        </div>
      </section>
    </>
  );
}

/* ──────────────────────────────────────────────
   Form
   ────────────────────────────────────────────── */
function FormCard({ onReservar }) {
  const [data, setData] = useState({ nombreCompleto: '', telefono: '', email: '', origen: '', destino: '', fecha: '', hora: '' });
  const [cotizacion, setCotizacion] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setData(d => ({ ...d, [k]: v }));
  const cotizar = () => {
    setError('');
    if (!data.origen || !data.destino) { setError('Completá origen y destino para cotizar.'); return; }
    setCalculando(true);
    setTimeout(() => {
      const km = 18 + Math.random() * 12;
      const total = km * 4025;
      setCotizacion({ distanciaKm: km, costoTotal: total, montoSena: total * 0.15 });
      setCalculando(false);
    }, 700);
  };
  return (
    <React.Fragment>
      <div className="fletea-form-card" style={{
        width: '100%', maxWidth: 420,
        background: 'rgba(18,18,24,0.92)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
        padding: '2rem 1.6rem',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.22em',
          color: 'var(--t-accent)', textTransform: 'uppercase',
          marginBottom: '0.5rem',
        }}>Tu flete · paso 1 de 2</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f5f5f5',
          letterSpacing: '-0.01em', margin: '0 0 1.1rem' }}>Cotizá tu flete</h2>
        <Field id="nombre" label="Nombre completo" placeholder="Tu nombre completo" value={data.nombreCompleto} onChange={set('nombreCompleto')} />
        <Field id="telefono" label="Teléfono" type="tel" placeholder="11-XXXX-XXXX" value={data.telefono} onChange={set('telefono')} />
        <Field id="email" label="Email" type="email" placeholder="tu@email.com" value={data.email} onChange={set('email')} />
        <Field id="origen" label="Origen" placeholder="¿Desde dónde retiramos?" value={data.origen} onChange={set('origen')} />
        <Field id="destino" label="Destino" placeholder="¿A dónde llevamos?" value={data.destino} onChange={set('destino')} />
        <FieldRow>
          <Field id="fecha" label="Fecha" type="date" value={data.fecha} onChange={set('fecha')} />
          <Field id="hora" label="Hora" type="time" value={data.hora} onChange={set('hora')} />
        </FieldRow>
        <PrimaryButton disabled={calculando} onClick={cotizar}>
          {calculando ? 'Calculando...' : 'Calcular precio'}
        </PrimaryButton>
        <ErrorMsg>{error}</ErrorMsg>
      </div>
      {cotizacion && (
        <QuoteModal
          cotizacion={cotizacion}
          onClose={() => setCotizacion(null)}
          onReservar={onReservar}
        />
      )}
    </React.Fragment>
  );
}

function QuoteModal({ cotizacion, onClose, onReservar }) {
  const [procesando, setProcesando] = useState(false);
  const fmt = (n, d = 0) => n.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const handle = () => { setProcesando(true); setTimeout(() => { setProcesando(false); onReservar?.(); }, 700); };

  // Lock body scroll while open + close on Esc
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Resultado de cotización"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(5,5,9,0.72)', backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fleteaModalFadeIn .25s ease',
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="fletea-quote-modal"
        style={{
          width: '100%', maxWidth: 460,
          background: 'rgba(18,18,24,0.98)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 20,
          padding: '1.75rem 1.6rem 1.5rem',
          boxShadow: '0 40px 120px rgba(0,0,0,0.7)',
          position: 'relative',
          animation: 'fleteaModalSlideUp .3s cubic-bezier(.2,.8,.2,1)',
        }}>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 34, height: 34, borderRadius: '50%', border: 0,
            background: 'rgba(255,255,255,0.06)', color: '#f5f5f5',
            cursor: 'pointer', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            transition: 'background .2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.22em',
          color: 'var(--t-accent)', textTransform: 'uppercase',
          marginBottom: '0.4rem',
        }}>Tu cotización · paso 2 de 2</div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f5f5f5',
          margin: '0 0 1.2rem', letterSpacing: '-0.01em' }}>Listo, tu flete</h2>
        <Row label="Distancia total" value={`${fmt(cotizacion.distanciaKm, 1)} km`} />
        <Row label="Costo total" value={`$ ${fmt(cotizacion.costoTotal)}`} />
        <Row label="Seña a abonar (15%)" value={`$ ${fmt(cotizacion.montoSena)}`} highlight />
        <SuccessButton disabled={procesando} onClick={handle}>
          {procesando ? 'Procesando...' : 'Reservar y pagar seña'}
        </SuccessButton>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: highlight ? '0.75rem 0 0.55rem' : '0.55rem 0',
      borderTop: highlight ? '1px solid rgba(255,255,255,0.06)' : 'none',
      fontSize: highlight ? '1.05rem' : '0.9rem', color: '#f5f5f5' }}>
      <span style={{ color: 'rgba(245,245,245,0.5)' }}>{label}</span>
      <strong style={{ color: highlight ? 'var(--t-accent)' : '#f5f5f5',
        fontSize: highlight ? '1.2rem' : 'inherit', fontWeight: 700 }}>{value}</strong>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Persistent page logo (fixed top-left, stays through scroll)
   ────────────────────────────────────────────── */
function PageLogo() {
  const handleReset = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  return (
    <a
      href="#top"
      onClick={handleReset}
      aria-label="Volver al inicio"
      className="fletea-page-logo"
      style={{
      position: 'fixed', top: 18, left: 22, zIndex: 50,
      display: 'flex', alignItems: 'center', gap: '0.65rem',
      textDecoration: 'none', cursor: 'pointer',
    }}>
      <img src="../../assets/logo-fletea.png" alt="Fletea"
        className="fletea-page-logo__img"
        style={{
          width: 56, height: 56,
          filter: 'drop-shadow(0 4px 14px rgba(233,69,96,.45))',
        }} />
      <span className="fletea-page-logo__wordmark" style={{
        fontSize: '1.33rem', fontWeight: 900, letterSpacing: '0.32em',
        color: 'rgba(245,245,245,0.92)', textTransform: 'uppercase',
        textShadow: '0 2px 12px rgba(0,0,0,0.6)',
      }}>FLETEA</span>
    </a>
  );
}

/* ──────────────────────────────
   Social bar (fixed bottom-right) — also tapa la marca de agua
   ────────────────────────────── */
const SOCIAL_LINKS = [
  { name: 'WhatsApp',  href: 'https://wa.me/541100000000',      img: '../../assets/social-whatsapp.jpeg' },
  { name: 'Instagram', href: 'https://instagram.com/fletea',    img: '../../assets/social-instagram.jpeg' },
  { name: 'Facebook',  href: 'https://facebook.com/fletea',     img: '../../assets/social-facebook.jpeg' },
  { name: 'TikTok',    href: 'https://tiktok.com/@fletea',      img: '../../assets/social-tiktok.jpeg' },
];

function useIsMobile(bp = 600) {
  const [m, setM] = useState(
    typeof window !== 'undefined' ? window.matchMedia(`(max-width:${bp}px)`).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp}px)`);
    const onChange = () => setM(mq.matches);
    mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
    return () => mq.removeEventListener
      ? mq.removeEventListener('change', onChange) : mq.removeListener(onChange);
  }, [bp]);
  return m;
}

function SocialBar({ openPanel, setOpenPanel }) {
  const [hover, setHover] = useState(null);
  const isMobile = useIsMobile(600);
  const open = openPanel === 'social';
  const setOpen = (v) => setOpenPanel(typeof v === 'function' ? (v(open) ? 'social' : null) : (v ? 'social' : null));
  // Auto-collapse when leaving mobile
  useEffect(() => { if (!isMobile && openPanel === 'social') setOpenPanel(null); }, [isMobile, openPanel, setOpenPanel]);

  const showItems = !isMobile || open;

  return (
    <div className="fletea-social-bar" style={{
      position: 'fixed', bottom: 22, left: 22, zIndex: 50,
      display: 'flex', flexDirection: 'row', gap: 13,
      alignItems: 'flex-start',
    }}>
      {isMobile && (
        <button
          aria-label={open ? 'Cerrar redes' : 'Abrir redes'}
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          className="fletea-social-toggle"
          style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(18,18,24,0.85)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            color: '#f5f5f5',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
            cursor: 'pointer', padding: 0,
            transition: 'transform .25s cubic-bezier(.2,.8,.2,1), background .2s',
            transform: open ? 'rotate(45deg)' : 'none',
          }}>
          {/* share / plus glyph that rotates to a close X when open */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" />
          </svg>
        </button>
      )}
      <div
        className="fletea-social-bubbles"
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: isMobile ? 8 : 13,
          // Horizontal collapse on mobile (max-width animates from 0 to full)
          maxWidth: isMobile ? (showItems ? '320px' : '0px') : 'none',
          opacity: showItems ? 1 : 0,
          pointerEvents: showItems ? 'auto' : 'none',
          overflow: isMobile ? 'hidden' : 'visible',
          transform: isMobile && !showItems ? 'translateX(-8px)' : 'none',
          transition: 'max-width .35s cubic-bezier(.2,.8,.2,1), opacity .25s ease, transform .25s ease',
        }}>
        {SOCIAL_LINKS.map((s) => (
          <a key={s.name} href={s.href} target="_blank" rel="noreferrer"
            aria-label={s.name}
            className="fletea-social-bubble"
            onMouseEnter={() => setHover(s.name)}
            onMouseLeave={() => setHover(null)}
            style={{
              width: 57, height: 57, borderRadius: '50%',
              display: 'block', overflow: 'hidden',
              boxShadow: hover === s.name
                ? '0 10px 28px rgba(0,0,0,0.55), 0 0 0 2px rgba(233,69,96,0.45)'
                : '0 5px 16px rgba(0,0,0,0.45)',
              transform: hover === s.name ? 'translateY(-3px) scale(1.06)' : 'none',
              transition: 'transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s ease',
              cursor: 'pointer',
            }}>
            <img src={s.img} alt={s.name}
              style={{ width: '100%', height: '100%', display: 'block',
                objectFit: 'cover', transform: 'scale(1.32)' }} />
          </a>
        ))}
      </div>
    </div>
  );
}

function TrustChip({ openPanel, setOpenPanel }) {
  const isMobile = useIsMobile(600);
  const open = openPanel === 'chip';
  const setOpen = (v) => setOpenPanel(typeof v === 'function' ? (v(open) ? 'chip' : null) : (v ? 'chip' : null));
  useEffect(() => { if (!isMobile && openPanel === 'chip') setOpenPanel(null); }, [isMobile, openPanel, setOpenPanel]);
  const expanded = !isMobile || open;

  // On mobile collapsed: show only the check disc (round FAB pinned to right edge).
  // On mobile expanded OR on desktop: show the full pill.
  return (
    <a
      href="#"
      className="fletea-trust-chip"
      onClick={(e) => {
        if (isMobile && !open) { e.preventDefault(); setOpen(true); }
      }}
      aria-expanded={expanded}
      aria-label={expanded ? '+1.000 fletes realizados' : 'Mostrar fletes realizados'}
      style={{
        position: 'fixed', bottom: 12, right: 0, zIndex: 50,
        display: 'inline-flex', alignItems: 'center',
        gap: expanded ? '0.77rem' : 0,
        padding: expanded ? '0.77rem 1.6rem 0.77rem 0.98rem' : '0.5rem 0.5rem 0.5rem 0.5rem',
        background: 'rgba(18,18,24,0.85)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRight: 'none',
        borderTopLeftRadius: 999,
        borderBottomLeftRadius: 999,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        color: '#f5f5f5', textDecoration: 'none',
        fontSize: 17, fontWeight: 700, letterSpacing: '0.03em',
        boxShadow: '-10px 8px 28px rgba(0,0,0,0.5)',
        cursor: 'pointer',
        overflow: 'hidden',
        maxWidth: expanded ? '320px' : '52px',
        transition: 'max-width .35s cubic-bezier(.2,.8,.2,1), padding .3s ease, gap .3s ease',
      }}>
      <span style={{
        width: 31, height: 31, borderRadius: '50%',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--t-accent)', color: '#fff',
        flexShrink: 0,
      }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span style={{
        whiteSpace: 'nowrap',
        opacity: expanded ? 1 : 0,
        transform: expanded ? 'translateX(0)' : 'translateX(-6px)',
        transition: 'opacity .25s ease .05s, transform .25s ease',
        // When collapsed, remove from layout so the disc sits centered in the small pill
        width: expanded ? 'auto' : 0,
        marginLeft: expanded ? 0 : '-0.4rem',
      }}>+1.000 fletes realizados</span>
      {/* Subtle close hint when expanded on mobile */}
      {isMobile && open && (
        <span
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); }}
          aria-label="Cerrar"
          style={{
            position: 'absolute', top: 4, right: 6,
            width: 16, height: 16, borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.10)', color: '#f5f5f5',
            fontSize: 10, lineHeight: 1, cursor: 'pointer',
          }}>×</span>
      )}
    </a>
  );
}

function Landing({ onReservar }) {
  // Mutually-exclusive panel state: 'chip' | 'social' | null
  const [openPanel, setOpenPanel] = useState(null);
  return (
    <main style={{ width: '100%' }}>
      <PageLogo />
      <TrustChip openPanel={openPanel} setOpenPanel={setOpenPanel} />
      <SocialBar openPanel={openPanel} setOpenPanel={setOpenPanel} />
      <ScrollSection><FormCard onReservar={onReservar} /></ScrollSection>
    </main>
  );
}

window.FleteaLanding = Landing;
window.MuviLanding = Landing; // alias for compat
