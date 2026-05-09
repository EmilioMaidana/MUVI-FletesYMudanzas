/* global React */
const { useState } = React;

const fieldStyles = {
  group: { marginBottom: '0.9rem' },
  label: {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'rgba(245,245,245,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '0.4rem',
  },
  input: (focused) => ({
    width: '100%',
    padding: '0.75rem 1rem',
    border: `1.5px solid ${focused ? 'var(--t-accent)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10,
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    color: '#f5f5f5',
    background: focused ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
    boxShadow: focused ? '0 0 0 3px rgba(233,69,96,0.15)' : 'none',
    transition: 'border-color .25s, background .25s, box-shadow .25s',
    outline: 'none',
    boxSizing: 'border-box',
  }),
};

function Field({ label, type = 'text', placeholder, value, onChange, id }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={fieldStyles.group}>
      <label htmlFor={id} style={fieldStyles.label}>{label}</label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={fieldStyles.input(focused)}
      />
    </div>
  );
}

function FieldRow({ children }) {
  return <div style={{ display: 'flex', gap: '0.75rem' }}>
    {React.Children.map(children, c => <div style={{ flex: 1 }}>{c}</div>)}
  </div>;
}

const baseBtn = {
  width: '100%',
  padding: '0.9rem 1.5rem',
  border: 0,
  borderRadius: 10,
  fontSize: '1rem',
  fontWeight: 700,
  fontFamily: 'inherit',
  cursor: 'pointer',
  marginTop: '1rem',
  transition: 'transform .2s, box-shadow .2s, background .25s',
};

function PrimaryButton({ children, disabled, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseBtn,
        background: disabled ? 'var(--t-accent)' : (hover ? 'var(--t-accent-hover)' : 'var(--t-accent)'),
        color: '#fff',
        boxShadow: disabled ? 'none' : (hover
          ? '0 8px 25px rgba(233,69,96,0.45)'
          : '0 4px 20px rgba(233,69,96,0.35)'),
        transform: !disabled && hover ? 'translateY(-2px)' : 'none',
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >{children}</button>
  );
}

function SuccessButton({ children, disabled, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseBtn,
        background: disabled ? '#22c55e' : (hover ? '#16a34a' : '#22c55e'),
        color: '#fff',
        boxShadow: disabled ? 'none' : (hover
          ? '0 8px 25px rgba(34,197,94,0.45)'
          : '0 4px 20px rgba(34,197,94,0.35)'),
        transform: !disabled && hover ? 'translateY(-2px)' : 'none',
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >{children}</button>
  );
}

function RefreshButton({ children, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        padding: '0.6rem 1.5rem',
        background: hover ? 'var(--t-accent-hover)' : 'var(--t-accent)',
        color: '#fff',
        border: 0,
        borderRadius: 8,
        fontWeight: 600,
        fontFamily: 'inherit',
        fontSize: '0.95rem',
        cursor: 'pointer',
        transition: 'background .3s',
      }}
    >{children}</button>
  );
}

const badgeMap = {
  PENDIENTE_PAGO: { bg: '#fff3cd', fg: '#856404', label: 'Pendiente de pago' },
  RESERVADO:      { bg: '#d4edda', fg: '#155724', label: 'Reservado' },
  COMPLETADO:     { bg: '#d1ecf1', fg: '#0c5460', label: 'Completado' },
};

function Badge({ estado }) {
  const c = badgeMap[estado] || { bg: '#fff3cd', fg: '#856404', label: estado };
  return (
    <span style={{
      padding: '0.3rem 0.8rem',
      borderRadius: 20,
      fontSize: '0.75rem',
      fontWeight: 600,
      background: c.bg,
      color: c.fg,
    }}>{c.label}</span>
  );
}

function ErrorMsg({ children }) {
  if (!children) return null;
  return (
    <div style={{
      marginTop: '0.75rem',
      padding: '0.7rem 1rem',
      background: 'rgba(239,68,68,0.12)',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 8,
      color: '#fca5a5',
      fontSize: '0.85rem',
      lineHeight: 1.4,
    }}>{children}</div>
  );
}

window.FleteaForm = { Field, FieldRow, PrimaryButton, SuccessButton, RefreshButton, Badge, ErrorMsg };
window.MuviForm = window.FleteaForm; // back-compat
