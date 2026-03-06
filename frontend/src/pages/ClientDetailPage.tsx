import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { clientsApi, calendarApi, credentialsApi, feesApi } from '../services/api';
import { Client, Vencimiento, Credential, Honorario, EstadoVencimiento, PlataformaCredencial } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────
const ESTADO_VENC_COLORS: Record<EstadoVencimiento, { bg: string; color: string }> = {
  pendiente:  { bg: '#FEF3C7', color: '#D97706' },
  completado: { bg: '#DCFCE7', color: '#15803D' },
  vencido:    { bg: '#FEE2E2', color: '#DC2626' },
  alertado:   { bg: '#FEF3C7', color: '#D97706' },
};

const PLATAFORMA_LABEL: Record<PlataformaCredencial, string> = {
  dgi: 'DGI',
  bps: 'BPS',
  facturacion_electronica: 'Facturación Electrónica',
  cjppu: 'CJPPU',
  fonasa: 'FONASA',
  banco: 'Banco',
  otro: 'Otro',
};

const PLATAFORMA_COLORS: Record<PlataformaCredencial, string> = {
  dgi: '#1e4976',
  bps: '#065F46',
  facturacion_electronica: '#6D28D9',
  cjppu: '#92400E',
  fonasa: '#1D4ED8',
  banco: '#374151',
  otro: '#475569',
};

// ── Tab Button ─────────────────────────────────────────────────────────────────
const TabBtn = ({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) => (
  <button
    onClick={onClick}
    style={{
      padding: '9px 18px', borderRadius: '8px 8px 0 0', border: 'none',
      background: active ? '#fff' : 'transparent',
      borderBottom: active ? '2px solid #6D28D9' : '2px solid transparent',
      color: active ? '#6D28D9' : '#64748B',
      fontWeight: active ? 600 : 400, fontSize: 14, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6,
    }}
  >
    {label}
    {count !== undefined && (
      <span style={{
        background: active ? '#EDE9FE' : '#F1F5F9',
        color: active ? '#6D28D9' : '#94A3B8',
        borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 600,
      }}>{count}</span>
    )}
  </button>
);

// ── InfoRow ────────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 13, color: '#94A3B8', minWidth: 130 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500 }}>{value}</span>
    </div>
  ) : null;

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [honorarios, setHonorarios] = useState<Honorario[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'info' | 'vencimientos' | 'credenciales' | 'honorarios'>('info');

  // credential reveal
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealing, setRevealing] = useState<string | null>(null);

  // new credential modal
  const [showCredModal, setShowCredModal] = useState(false);
  const [credForm, setCredForm] = useState({ plataforma: 'dgi' as PlataformaCredencial, nombrePlataforma: '', usuario: '', password: '', pin: '', notas: '' });
  const [savingCred, setSavingCred] = useState(false);
  const [credError, setCredError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      clientsApi.getOne(id),
      calendarApi.getByClient(id),
      credentialsApi.getByClient(id),
      feesApi.getByClient(id),
    ]).then(([c, v, cr, h]) => {
      setClient(c.data);
      setVencimientos(v.data);
      setCredentials(cr.data);
      setHonorarios(h.data);
    }).catch(() => navigate('/clients'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReveal = async (credId: string) => {
    if (revealed[credId]) { setRevealed(r => { const n = { ...r }; delete n[credId]; return n; }); return; }
    setRevealing(credId);
    try {
      const { data } = await credentialsApi.reveal(credId);
      setRevealed(r => ({ ...r, [credId]: data.password }));
    } finally { setRevealing(null); }
  };

  const handleDeleteCred = async (credId: string) => {
    if (!confirm('¿Eliminar esta credencial?')) return;
    await credentialsApi.delete(credId);
    setCredentials(cs => cs.filter(c => c.id !== credId));
  };

  const handleSaveCred = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCred(true); setCredError('');
    try {
      await credentialsApi.create({ ...credForm, clientId: id });
      const { data } = await credentialsApi.getByClient(id!);
      setCredentials(data);
      setShowCredModal(false);
      setCredForm({ plataforma: 'dgi', nombrePlataforma: '', usuario: '', password: '', pin: '', notas: '' });
    } catch (err: any) {
      setCredError(err?.response?.data?.message || 'Error al guardar');
    } finally { setSavingCred(false); }
  };

  const handleGenerarVencimientos = async () => {
    if (!id) return;
    await calendarApi.generar(id);
    const { data } = await calendarApi.getByClient(id);
    setVencimientos(data);
  };

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>Cargando...</div>;
  if (!client) return null;

  const vencProximos = vencimientos.filter(v => v.estado === 'pendiente' || v.estado === 'alertado').length;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960 }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: '#94A3B8' }}>
        <Link to="/clients" style={{ color: '#6D28D9', textDecoration: 'none', fontWeight: 500 }}>Clientes</Link>
        <span>/</span>
        <span style={{ color: '#0F172A' }}>{client.nombre} {client.apellido}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: '#EDE9FE', color: '#6D28D9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700,
          }}>
            {client.nombre[0]}{client.apellido[0]}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>
              {client.nombre} {client.apellido}
            </h1>
            {client.razonSocial && <div style={{ fontSize: 13, color: '#64748B' }}>{client.razonSocial}</div>}
            {client.rut && <div style={{ fontSize: 12, color: '#94A3B8' }}>RUT: {client.rut}</div>}
          </div>
        </div>
        <span style={{
          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
          background: client.estado === 'activo' ? '#DCFCE7' : '#FEE2E2',
          color: client.estado === 'activo' ? '#15803D' : '#DC2626',
        }}>
          {client.estado.charAt(0).toUpperCase() + client.estado.slice(1)}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #E2E8F0', marginBottom: 24 }}>
        <TabBtn label="Información" active={tab === 'info'} onClick={() => setTab('info')} />
        <TabBtn label="Vencimientos" active={tab === 'vencimientos'} onClick={() => setTab('vencimientos')} count={vencProximos || undefined} />
        <TabBtn label="Credenciales" active={tab === 'credenciales'} onClick={() => setTab('credenciales')} count={credentials.length || undefined} />
        <TabBtn label="Honorarios" active={tab === 'honorarios'} onClick={() => setTab('honorarios')} count={honorarios.length || undefined} />
      </div>

      {/* ── TAB: INFO ── */}
      {tab === 'info' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>📋 Datos personales</h3>
            <InfoRow label="CI" value={client.ci} />
            <InfoRow label="Email" value={client.email} />
            <InfoRow label="Teléfono" value={client.telefono} />
            <InfoRow label="Dirección" value={client.direccion} />
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>🏢 Datos empresa</h3>
            <InfoRow label="Razón social" value={client.razonSocial} />
            <InfoRow label="RUT" value={client.rut} />
            <InfoRow label="Tipo empresa" value={client.tipoEmpresa ?? undefined} />
            <InfoRow label="Giro" value={client.giro} />
            <InfoRow label="Inicio actividades" value={client.fechaInicioActividades ? new Date(client.fechaInicioActividades).toLocaleDateString('es-UY') : undefined} />
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>📊 Perfil tributario</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { key: 'contribuyenteIva', label: 'Contribuyente IVA' },
                { key: 'liquidaIrae', label: 'Liquida IRAE' },
                { key: 'irpfCat1', label: 'IRPF Categoría I' },
                { key: 'irpfCat2', label: 'IRPF Categoría II' },
                { key: 'empleadorBps', label: 'Empleador BPS' },
                { key: 'fonasa', label: 'FONASA' },
                { key: 'cjppu', label: 'CJPPU' },
                { key: 'fondoSolidaridad', label: 'Fondo de Solidaridad' },
              ].map(({ key, label }) => (
                <span key={key} style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  background: (client as any)[key] ? '#EDE9FE' : '#F1F5F9',
                  color: (client as any)[key] ? '#6D28D9' : '#94A3B8',
                  border: `1px solid ${(client as any)[key] ? '#C4B5FD' : '#E2E8F0'}`,
                }}>
                  {(client as any)[key] ? '✓' : '–'} {label}
                </span>
              ))}
            </div>
          </div>
          {client.notas && (
            <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', gridColumn: '1 / -1' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>📝 Notas</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{client.notas}</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: VENCIMIENTOS ── */}
      {tab === 'vencimientos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#64748B' }}>{vencimientos.length} vencimiento{vencimientos.length !== 1 ? 's' : ''} registrado{vencimientos.length !== 1 ? 's' : ''}</p>
            <button
              onClick={handleGenerarVencimientos}
              style={{
                padding: '7px 16px', borderRadius: 8, border: '1px solid #E2E8F0',
                background: '#fff', color: '#475569', fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              ↻ Regenerar vencimientos
            </button>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            {vencimientos.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
                <div style={{ color: '#64748B', fontSize: 14 }}>No hay vencimientos generados</div>
                <div style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>Hacé clic en "Regenerar vencimientos" para crearlos según el perfil tributario</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    {['Tipo', 'Período', 'Vencimiento', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vencimientos
                    .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())
                    .map((v, i) => {
                      const c = ESTADO_VENC_COLORS[v.estado];
                      return (
                        <tr key={v.id} style={{ borderBottom: i < vencimientos.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                          <td style={{ padding: '13px 16px', fontSize: 14, color: '#0F172A', fontWeight: 500 }}>
                            {v.tipo.replace(/_/g, ' ').toUpperCase()}
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748B' }}>{v.periodo ?? '—'}</td>
                          <td style={{ padding: '13px 16px', fontSize: 13, color: '#0F172A' }}>
                            {new Date(v.fechaVencimiento).toLocaleDateString('es-UY')}
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: c.bg, color: c.color }}>
                              {v.estado.charAt(0).toUpperCase() + v.estado.slice(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: CREDENCIALES ── */}
      {tab === 'credenciales' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#64748B' }}>{credentials.length} credencial{credentials.length !== 1 ? 'es' : ''}</p>
            <button
              onClick={() => { setShowCredModal(true); setCredError(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 8, border: 'none',
                background: '#6D28D9', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              + Nueva credencial
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {credentials.length === 0 ? (
              <div style={{ gridColumn: '1/-1', padding: 48, textAlign: 'center', background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔑</div>
                <div style={{ color: '#64748B', fontSize: 14 }}>No hay credenciales guardadas</div>
              </div>
            ) : credentials.map(cred => {
              const color = PLATAFORMA_COLORS[cred.plataforma] ?? '#475569';
              return (
                <div key={cred.id} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', borderTop: `3px solid ${color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {PLATAFORMA_LABEL[cred.plataforma]}
                      </span>
                      {cred.nombrePlataforma && (
                        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{cred.nombrePlataforma}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteCred(cred.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', fontSize: 16, padding: 2 }}
                      title="Eliminar"
                    >✕</button>
                  </div>
                  {cred.usuario && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>USUARIO</div>
                      <div style={{ fontSize: 13, color: '#0F172A', fontWeight: 500, fontFamily: 'monospace' }}>{cred.usuario}</div>
                    </div>
                  )}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>CONTRASEÑA</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: '#0F172A', fontFamily: 'monospace', flex: 1 }}>
                        {revealed[cred.id] ?? '••••••••'}
                      </span>
                      <button
                        onClick={() => handleReveal(cred.id)}
                        disabled={revealing === cred.id}
                        style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 5, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: '#6D28D9' }}
                      >
                        {revealing === cred.id ? '...' : revealed[cred.id] ? 'Ocultar' : 'Ver'}
                      </button>
                    </div>
                  </div>
                  {cred.pin && (
                    <div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>PIN</div>
                      <div style={{ fontSize: 13, color: '#0F172A', fontFamily: 'monospace' }}>{cred.pin}</div>
                    </div>
                  )}
                  {cred.notas && <div style={{ marginTop: 10, fontSize: 12, color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>{cred.notas}</div>}
                </div>
              );
            })}
          </div>

          {/* Modal nueva credencial */}
          {showCredModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
              onClick={e => e.target === e.currentTarget && setShowCredModal(false)}>
              <div style={{ background: '#fff', borderRadius: 14, padding: '28px', width: 420, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Nueva credencial</h2>
                <form onSubmit={handleSaveCred}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Plataforma <span style={{ color: '#DC2626' }}>*</span></label>
                      <select value={credForm.plataforma} onChange={e => setCredForm(f => ({ ...f, plataforma: e.target.value as PlataformaCredencial }))}
                        style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: '1px solid #D1D5DB', fontSize: 14, background: '#fff', boxSizing: 'border-box' as const }}>
                        {Object.entries(PLATAFORMA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    {credForm.plataforma === 'otro' && (
                      <CredField label="Nombre plataforma" value={credForm.nombrePlataforma} onChange={v => setCredForm(f => ({ ...f, nombrePlataforma: v }))} />
                    )}
                    <CredField label="Usuario" value={credForm.usuario} onChange={v => setCredForm(f => ({ ...f, usuario: v }))} />
                    <CredField label="Contraseña" type="password" value={credForm.password} onChange={v => setCredForm(f => ({ ...f, password: v }))} />
                    <CredField label="PIN (opcional)" value={credForm.pin} onChange={v => setCredForm(f => ({ ...f, pin: v }))} />
                    <CredField label="Notas" value={credForm.notas} onChange={v => setCredForm(f => ({ ...f, notas: v }))} />
                  </div>
                  {credError && <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 7, padding: '8px 12px', fontSize: 13, marginTop: 12 }}>{credError}</div>}
                  <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setShowCredModal(false)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#fff', color: '#475569', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
                    <button type="submit" disabled={savingCred} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: '#6D28D9', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: savingCred ? 0.7 : 1 }}>
                      {savingCred ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: HONORARIOS ── */}
      {tab === 'honorarios' && (
        <div>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            {honorarios.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>💰</div>
                <div style={{ color: '#64748B', fontSize: 14 }}>No hay honorarios registrados</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    {['Período', 'Acordado', 'Cobrado', 'Estado', 'Forma de pago'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {honorarios.map((h, i) => {
                    const estadoColors = {
                      al_dia: { bg: '#DCFCE7', color: '#15803D' },
                      pendiente: { bg: '#FEF3C7', color: '#D97706' },
                      vencido: { bg: '#FEE2E2', color: '#DC2626' },
                    };
                    const c = estadoColors[h.estado] ?? estadoColors.pendiente;
                    return (
                      <tr key={h.id} style={{ borderBottom: i < honorarios.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <td style={{ padding: '13px 16px', fontSize: 14, color: '#0F172A', fontWeight: 500 }}>{h.periodo}</td>
                        <td style={{ padding: '13px 16px', fontSize: 14, color: '#0F172A' }}>
                          ${h.montoAcordado.toLocaleString('es-UY')}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 14, color: '#0F172A' }}>
                          ${h.montoCobrado.toLocaleString('es-UY')}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: c.bg, color: c.color }}>
                            {h.estado.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748B' }}>{h.formaPago ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small field component ──────────────────────────────────────────────────────
function CredField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: '1px solid #D1D5DB', fontSize: 14, color: '#0F172A', outline: 'none', boxSizing: 'border-box' as const }}
        onFocus={e => (e.target.style.borderColor = '#6D28D9')}
        onBlur={e => (e.target.style.borderColor = '#D1D5DB')} />
    </div>
  );
}
