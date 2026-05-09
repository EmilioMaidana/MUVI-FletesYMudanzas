/* global React */
const { useState, useEffect } = React;

function Wordmark({ size = 56, color = '#f5f5f5', withMark = true, gap = 14, label = 'FLETEA' }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap,
      lineHeight: 1,
    }}>
      {withMark && (
        <img
          src="../../assets/logo-fletea.png"
          alt=""
          style={{ width: size * 1.15, height: size * 1.15, display: 'block' }}
        />
      )}
      <span style={{
        fontFamily: "var(--t-display-font, 'Inter'), sans-serif",
        fontWeight: 900,
        fontSize: size,
        letterSpacing: '0.22em',
        color,
      }}>{label}</span>
    </div>
  );
}

function Isotype({ size = 96, animate = false }) {
  return (
    <img
      src="../../assets/logo-fletea.png"
      alt="Fletea"
      style={{
        width: size, height: size, display: 'block',
        animation: animate ? 'fletea-float 2.4s ease-in-out infinite' : 'none',
      }}
    />
  );
}

function Loader({ progress = 0 }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'var(--t-stage, #0a0a0f)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <Isotype size={88} animate />
        </div>
        <div style={{ marginBottom: '2rem' }}><Wordmark size={36} withMark={false} /></div>
        <div style={{
          width: 220, height: 3,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 2, overflow: 'hidden',
          margin: '0 auto 1rem',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'var(--t-accent, #e94560)',
            borderRadius: 2,
            transition: 'width .15s linear',
          }} />
        </div>
        <span style={{
          fontSize: '0.8rem',
          color: 'rgba(245,245,245,0.4)',
          fontWeight: 600,
          letterSpacing: '0.05em',
        }}>{progress}%</span>
      </div>
    </div>
  );
}

function ScrollArrow() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 4v16m0 0l-6-6m6 6l6-6"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

window.FleteaBrand = { Wordmark, Isotype, Loader, ScrollArrow };
window.MuviBrand = window.FleteaBrand; // back-compat
