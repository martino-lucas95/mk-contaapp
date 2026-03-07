import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useThemeStore } from '../../store/theme.store';

interface Contador {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: string;
  activo: boolean;
  createdAt: string;
}

const Badge = ({ activo }: { activo: boolean }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
    background: activo ? '#DCFCE7' : '#FEE2E2',
    color: activo ? '#15803D' : '#DC2626',
  }}>
    <span style={{
      width: 6, height: 6, borderRadius: '50%',
      background: activo ? '#22C55E' : '#EF4444',
      display: 'inline-block',
    }}/>
    {activo ? 'Activo' : 'Inactivo'}
  </span>
);

const EMPTY_FORM = { nombre: '', apellido: '', email: '', password: '' };

export default function ContadoresPage() {
  const { theme } = useThemeStore();
  const [contadores, setContadores] = useState<Contador[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Contador | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/users')
      .then(({ data }) => setContadores(data.filter((u: Contador) => u.role === 'contador')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/users', { ...form, role: 'contador' });
      setShowModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al crear el contador');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c: Contador) => {
    if (!c.activo) {
      await api.put(`/users/${c.id}`, { activo: true });
    } else {
      setConfirmDelete(c);
      return;
    }
    load();
  };

  const handleDeactivate = async () => {
    if (!confirmDelete) return;
    await api.delete(`/users/${confirmDelete.id}`);
    setConfirmDelete(null);
    load();
  };

  return (
    <div style={{ padding: '28px 32px', background: theme.mainBg, minHeight: '100%', color: theme.textPrimary }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>Contadores</h1>
          <p style={{ color: theme.textSecondary, fontSize: 14 }}>Gestión de usuarios contadores del sistema</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(''); setForm(EMPTY_FORM); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', borderRadius: 8,
            background: theme.accent, color: '#fff', border: 'none',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo contador
        </button>
      </div>

      {/* Tabla */}
      <div style={{ background: theme.cardBg, borderRadius: 12, boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}`, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.textMuted, fontSize: 14 }}>Cargando...</div>
        ) : contadores.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
            <div style={{ color: theme.textSecondary, fontSize: 14 }}>No hay contadores registrados</div>
            <div style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>Creá el primero con el botón de arriba</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: theme.tableHeaderBg, borderBottom: `1px solid ${theme.cardBorder}` }}>
                {['Nombre', 'Email', 'Estado', 'Creado', 'Acciones'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 12, fontWeight: 600, color: theme.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contadores.map((c, i) => (
                <tr key={c.id} style={{
                  borderBottom: i < contadores.length - 1 ? `1px solid ${theme.tableBorder}` : 'none',
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = theme.tableRowHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: theme.accentLight, color: theme.accentText,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>
                        {c.nombre[0]}{c.apellido[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: theme.textPrimary }}>
                          {c.nombre} {c.apellido}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: theme.textSecondary }}>{c.email}</td>
                  <td style={{ padding: '14px 16px' }}><Badge activo={c.activo} /></td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: theme.textMuted }}>
                    {new Date(c.createdAt).toLocaleDateString('es-UY')}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => handleToggle(c)}
                      style={{
                        padding: '5px 14px', borderRadius: 6, fontSize: 13,
                        cursor: 'pointer', fontWeight: 500,
                        background: c.activo ? '#FEE2E2' : '#DCFCE7',
                        color: c.activo ? '#DC2626' : '#15803D',
                        border: 'none',
                      }}
                    >
                      {c.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nuevo contador */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{
            background: theme.cardBg, borderRadius: 14, padding: '28px 28px 24px',
            width: 420, boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: `1px solid ${theme.cardBorder}`,
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary, marginBottom: 20 }}>
              Nuevo contador
            </h2>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <Field label="Nombre" value={form.nombre} onChange={v => setForm(f => ({ ...f, nombre: v }))} required theme={theme} />
                <Field label="Apellido" value={form.apellido} onChange={v => setForm(f => ({ ...f, apellido: v }))} required theme={theme} />
              </div>
              <Field label="Email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} required theme={theme} />
              <div style={{ marginTop: 12 }}>
                <Field label="Contraseña" type="password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} required theme={theme} />
              </div>
              {error && (
                <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 7, padding: '8px 12px', fontSize: 13, marginTop: 12 }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  padding: '8px 18px', borderRadius: 7, border: `1px solid ${theme.cardBorder}`,
                  background: theme.cardBg, color: theme.textSecondary, fontSize: 14, cursor: 'pointer',
                }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{
                  padding: '8px 20px', borderRadius: 7, border: 'none',
                  background: theme.accent, color: '#fff', fontSize: 14,
                  fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}>
                  {saving ? 'Creando...' : 'Crear contador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar desactivar */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: theme.cardBg, borderRadius: 14, padding: '28px',
            width: 380, boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: `1px solid ${theme.cardBorder}`,
          }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: theme.textPrimary, marginBottom: 10 }}>¿Desactivar contador?</h2>
            <p style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 20 }}>
              <strong>{confirmDelete.nombre} {confirmDelete.apellido}</strong> no podrá iniciar sesión hasta que lo vuelvas a activar.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={{
                padding: '8px 18px', borderRadius: 7, border: `1px solid ${theme.cardBorder}`,
                background: theme.cardBg, color: theme.textSecondary, fontSize: 14, cursor: 'pointer',
              }}>Cancelar</button>
              <button onClick={handleDeactivate} style={{
                padding: '8px 18px', borderRadius: 7, border: 'none',
                background: '#DC2626', color: '#fff', fontSize: 14,
                fontWeight: 500, cursor: 'pointer',
              }}>Desactivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Campo de formulario reutilizable ─────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', required, theme }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; theme: any;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: theme.textSecondary, marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#DC2626' }}> *</span>}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        required={required}
        style={{
          width: '100%', padding: '8px 11px', borderRadius: 7,
          border: `1px solid ${theme.inputBorder}`, fontSize: 14, color: theme.textPrimary,
          outline: 'none', boxSizing: 'border-box' as const,
          background: theme.inputBg,
        }}
        onFocus={e => (e.target.style.borderColor = theme.inputBorderFocus)}
        onBlur={e => (e.target.style.borderColor = theme.inputBorder)}
      />
    </div>
  );
}
