/* global React, FleteaForm, FleteaBrand */
const { useState: useStateA } = React;
const { Badge, RefreshButton, Field, PrimaryButton, ErrorMsg } = FleteaForm;

const FAKE_RESERVAS = [
  { id: 142, nombreCompleto: 'María Fernández', telefono: '11-3456-7890', email: 'maria.f@gmail.com',
    origen: 'Av. Cabildo 2500, CABA', destino: 'San Isidro, Bs. As.',
    fecha: '2026-05-12', hora: '09:00', distanciaKm: 28.4, costoTotal: 114350, estado: 'RESERVADO' },
  { id: 141, nombreCompleto: 'Lucas Pereyra', telefono: '11-2233-4455', email: 'lucasp@hotmail.com',
    origen: 'Caballito, CABA', destino: 'Tigre, Bs. As.',
    fecha: '2026-05-11', hora: '14:30', distanciaKm: 41.2, costoTotal: 165830, estado: 'PENDIENTE_PAGO' },
  { id: 140, nombreCompleto: 'Florencia Díaz', telefono: '11-9988-7766', email: 'flordiaz@gmail.com',
    origen: 'Adolfo Alsina 2034, CABA', destino: 'Belgrano, CABA',
    fecha: '2026-05-09', hora: '11:00', distanciaKm: 12.7, costoTotal: 51120, estado: 'COMPLETADO' },
  { id: 139, nombreCompleto: 'Tomás Iglesias', telefono: '11-5566-7788', email: 'tomi@outlook.com',
    origen: 'Palermo, CABA', destino: 'Vicente López, Bs. As.',
    fecha: '2026-05-08', hora: '08:30', distanciaKm: 15.6, costoTotal: 62790, estado: 'RESERVADO' },
  { id: 138, nombreCompleto: 'Martina Suárez', telefono: '11-1212-3434', email: 'martisuarez@gmail.com',
    origen: 'Recoleta, CABA', destino: 'Puerto Madero, CABA',
    fecha: '2026-05-08', hora: '16:00', distanciaKm: 6.3, costoTotal: 25360, estado: 'COMPLETADO' },
];

function AdminLogin({ onLogin }) {
  const [user, setUser] = useStateA('admin');
  const [pass, setPass] = useStateA('');
  const [err, setErr] = useStateA('');
  const [loading, setLoading] = useStateA(false);
  const submit = (e) => {
    e?.preventDefault?.();
    if (!user || !pass) return;
    setErr(''); setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (pass.length >= 4) onLogin?.();
      else setErr('Usuario o contraseña incorrectos');
    }, 500);
  };
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--t-stage, #0a0a0f)', padding: '2rem',
    }}>
      <form onSubmit={submit} style={{
        width: '100%', maxWidth: 400,
        background: 'var(--t-surface, #111118)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, padding: '2.5rem 2rem',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img src="../../assets/logo-fletea.png" alt="Fletea"
            style={{ width: 60, height: 60, opacity: 0.9 }} />
        </div>
        <h1 style={{
          textAlign: 'center', color: '#f5f5f5',
          fontSize: '1.4rem', fontWeight: 700,
          margin: '0 0 0.4rem', letterSpacing: '-0.01em',
        }}>Panel de Administración</h1>
        <p style={{ textAlign: 'center', color: 'rgba(245,245,245,0.5)',
          fontSize: '0.9rem', margin: '0 0 2rem' }}>
          Ingresá tus credenciales para continuar
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Field id="username" label="Usuario" placeholder="admin"
            value={user} onChange={setUser} autoComplete="username" />
          <Field id="password" label="Contraseña" type="password" placeholder="••••••••"
            value={pass} onChange={setPass} autoComplete="current-password" />
          {err && <ErrorMsg>{err}</ErrorMsg>}
          <PrimaryButton type="submit" disabled={loading || !user || !pass}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}

function AdminPanel({ onBack, onLogout }) {
  const fmt = (n, d = 0) => n.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '2rem' }}>
      <header style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap',
      }}>
        <h1 style={{
          fontSize: '1.8rem', color: '#16213e', margin: 0,
          fontWeight: 700, letterSpacing: '-0.01em',
        }}>
          Panel de Administración · Fletea
        </h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {onBack && <RefreshButton onClick={onBack}>Volver</RefreshButton>}
          <RefreshButton>Actualizar</RefreshButton>
          {onLogout && (
            <button onClick={onLogout} style={{
              padding: '0.6rem 1.5rem', background: 'transparent',
              color: '#6c757d', border: '1px solid #ddd',
              borderRadius: 8, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.95rem', minHeight: 44,
            }}>Cerrar sesión</button>
          )}
        </div>
      </header>

      <div style={{
        overflowX: 'auto', background: '#fff',
        borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0a0a0f', color: '#fff' }}>
              {['ID','Cliente','Teléfono','Email','Origen','Destino','Fecha','Hora','Distancia','Costo Total','Estado']
                .map(h => <th key={h} style={{
                  padding: '0.85rem 1rem', textAlign: 'left',
                  fontWeight: 600, fontSize: '0.85rem',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {FAKE_RESERVAS.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={td}>{r.id}</td>
                <td style={td}>{r.nombreCompleto}</td>
                <td style={td}>{r.telefono}</td>
                <td style={td}>{r.email}</td>
                <td style={td}>{r.origen}</td>
                <td style={td}>{r.destino}</td>
                <td style={td}>{r.fecha}</td>
                <td style={td}>{r.hora}</td>
                <td style={td}>{fmt(r.distanciaKm, 1)} km</td>
                <td style={td}>$ {fmt(r.costoTotal)}</td>
                <td style={td}><Badge estado={r.estado} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const td = {
  padding: '0.85rem 1rem',
  fontSize: '0.9rem',
  color: '#16213e',
  whiteSpace: 'nowrap',
};

function Admin({ onBack, startLoggedIn = false }) {
  const [auth, setAuth] = useStateA(startLoggedIn);
  if (!auth) return <AdminLogin onLogin={() => setAuth(true)} />;
  return <AdminPanel onBack={onBack} onLogout={() => setAuth(false)} />;
}

window.FleteaAdmin = Admin;
window.MuviAdmin = Admin; // back-compat
