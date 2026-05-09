/* global React */
const stateMap = {
  exitoso:   { glyph: '\u2713', color: '#28a745', h1: '¡Pago exitoso!',
    body: 'Tu reserva fue confirmada. Nos pondremos en contacto contigo.' },
  fallido:   { glyph: '\u2717', color: '#dc3545', h1: 'Pago fallido',
    body: 'Hubo un problema con tu pago. Intentá nuevamente.' },
  pendiente: { glyph: '\u231b', color: '#ffc107', h1: 'Pago pendiente',
    body: 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.' },
};

function PagoResultado({ estado = 'exitoso', onVolver }) {
  const c = stateMap[estado];
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8f9fa', padding: '2rem',
    }}>
      <div style={{
        textAlign: 'center', padding: '3rem',
        background: '#fff', borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
        maxWidth: 500,
      }}>
        <div style={{
          fontSize: '4rem', marginBottom: '1rem',
          color: c.color, lineHeight: 1,
        }}>{c.glyph}</div>
        <h1 style={{
          marginBottom: '1rem', color: '#16213e',
          fontWeight: 700, letterSpacing: '-0.01em', margin: '0 0 1rem',
        }}>{c.h1}</h1>
        <p style={{
          color: '#6c757d', marginBottom: '2rem',
          fontSize: '1rem', lineHeight: 1.5, margin: '0 0 2rem',
        }}>{c.body}</p>
        <button onClick={onVolver} style={{
          display: 'inline-block',
          padding: '0.8rem 2rem',
          background: 'var(--t-accent)', color: '#fff',
          border: 0, borderRadius: 8,
          fontWeight: 600, fontSize: '0.95rem',
          fontFamily: 'inherit', cursor: 'pointer',
        }}>Volver al inicio</button>
      </div>
    </div>
  );
}

window.FleteaPagoResultado = PagoResultado;
window.MuviPagoResultado = PagoResultado; // back-compat
