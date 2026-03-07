import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { clientsApi, calendarApi, credentialsApi, feesApi, movementsApi } from '../services/api';
import { useThemeStore } from '../store/theme.store';
import { Client, Vencimiento, Credential, Honorario, Movimiento, TipoMovimiento, EstadoVencimiento, PlataformaCredencial, FormaPago } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────
const ESTADO_VENC_COLORS: Record<EstadoVencimiento, { bg: string; color: string }> = {
  pendiente: { bg: '#FEF3C7', color: '#D97706' },
  completado: { bg: '#DCFCE7', color: '#15803D' },
  vencido: { bg: '#FEE2E2', color: '#DC2626' },
  alertado: { bg: '#FEF3C7', color: '#D97706' },
};

const PLATAFORMA_LABEL: Record<PlataformaCredencial, string> = {
  dgi: 'DGI',
  bps: 'BPS',
  facturacion_electronica: 'Facturación Electrónica',
  cjppu: 'CJPPU',
  fonasa: 'FONASA',
  banco: 'Banco',
  'gub.uy': 'Gub.uy',
  otro: 'Otro',
};

const PLATAFORMA_COLORS: Record<PlataformaCredencial, string> = {
  dgi: '#1e4976',
  bps: '#065F46',
  facturacion_electronica: '#6D28D9',
  cjppu: '#92400E',
  fonasa: '#1D4ED8',
  banco: '#374151',
  'gub.uy': '#0F172A',
  otro: '#475569',
};

// ── Tab Button ─────────────────────────────────────────────────────────────────
const TabBtn = ({ label, active, onClick, count, theme }: { label: string; active: boolean; onClick: () => void; count?: number; theme: any }) => (
  <button
    onClick={onClick}
    style={{
      padding: '9px 14px', borderRadius: '8px 8px 0 0', border: 'none',
      background: active ? theme.cardBg : 'transparent',
      borderBottom: active ? `2px solid ${theme.accent}` : '2px solid transparent',
      color: active ? theme.accentText : theme.textMuted,
      fontWeight: active ? 600 : 400, fontSize: 13, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 5,
      flexShrink: 0, whiteSpace: 'nowrap' as const,
    }}
  >
    {label}
    {count !== undefined && (
      <span style={{
        background: active ? theme.accentLight : theme.tableHeaderBg,
        color: active ? theme.accentText : theme.textMuted,
        borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 600,
      }}>{count}</span>
    )}
  </button>
);

// ── InfoRow ────────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, theme }: { label: string; value?: string | null; theme?: any }) =>
  value ? (
    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 13, color: theme?.textMuted ?? '#94A3B8', minWidth: 130 }}>{label}</span>
      <span style={{ fontSize: 13, color: theme?.textPrimary ?? '#0F172A', fontWeight: 500 }}>{value}</span>
    </div>
  ) : null;

// ── Main ───────────────────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isMobile = useIsMobile();

  const [client, setClient] = useState<Client | null>(null);
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [honorarios, setHonorarios] = useState<Honorario[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'info' | 'vencimientos' | 'credenciales' | 'honorarios' | 'movimientos'>('info');

  // ── Honorarios state ──
  const [showHonModal, setShowHonModal] = useState(false);
  const [honEditId, setHonEditId] = useState<string | null>(null);
  const [showPagoModal, setShowPagoModal] = useState<Honorario | null>(null);
  const [honForm, setHonForm] = useState({ periodo: '', montoAcordado: '', montoCobrado: '0', formaPago: '' as FormaPago | '', notas: '' });
  const [pagoForm, setPagoForm] = useState({ montoCobrado: '', fechaCobro: '', formaPago: 'transferencia' as FormaPago, notas: '' });
  const [savingHon, setSavingHon] = useState(false);
  const [honError, setHonError] = useState('');

  // movimientos state
  const [showMovModal, setShowMovModal] = useState(false);
  const [movEditId, setMovEditId] = useState<string | null>(null);
  const [movForm, setMovForm] = useState({ tipo: 'venta' as TipoMovimiento, fecha: '', descripcion: '', monto: '', ivaIncluido: true, tasaIva: '22', nroComprobante: '', notas: '' });
  const [savingMov, setSavingMov] = useState(false);
  const [movError, setMovError] = useState('');
  const [movFiltroTipo, setMovFiltroTipo] = useState<TipoMovimiento | ''>('');
  const [movResumen, setMovResumen] = useState<any>(null);

  // credential reveal
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealing, setRevealing] = useState<string | null>(null);

  // new credential modal
  const [showCredModal, setShowCredModal] = useState(false);
  const [credForm, setCredForm] = useState({ plataforma: 'dgi' as PlataformaCredencial, nombrePlataforma: '', usuario: '', password: '', pin: '', notas: '' });
  const [savingCred, setSavingCred] = useState(false);
  const [credError, setCredError] = useState('');

  // auth modal for reveal
  const { credentialsToken, setCredentialsToken } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [pendingRevealId, setPendingRevealId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      clientsApi.getOne(id),
      calendarApi.getByClient(id),
      credentialsApi.getByClient(id),
      feesApi.getByClient(id),
      movementsApi.getByClient(id),
    ]).then(([c, v, cr, h, m]) => {
      setClient(c.data);
      setVencimientos(v.data);
      setCredentials(cr.data);
      setHonorarios(h.data);
      setMovimientos(m.data);
    }).catch(() => navigate('/clients'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReveal = async (credId: string) => {
    if (revealed[credId]) { setRevealed(r => { const n = { ...r }; delete n[credId]; return n; }); return; }

    // Check if we have a valid token
    if (!credentialsToken) {
      setPendingRevealId(credId);
      setShowAuthModal(true);
      return;
    }

    await performReveal(credId, credentialsToken);
  };

  const performReveal = async (credId: string, token: string) => {
    setRevealing(credId);
    try {
      const { data } = await credentialsApi.reveal(credId, token);
      setRevealed(r => ({ ...r, [credId]: data.password }));
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Token expired
        setPendingRevealId(credId);
        setShowAuthModal(true);
      } else {
        alert('Error al visualizar contraseña');
      }
    } finally { setRevealing(null); }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const { data } = await authApi.getCredentialsToken(authPassword);
      setCredentialsToken(data.token);
      setShowAuthModal(false);
      setAuthPassword('');
      if (pendingRevealId) {
        await performReveal(pendingRevealId, data.token);
        setPendingRevealId(null);
      }
    } catch (err: any) {
      setAuthError('Contraseña incorrecta');
    }
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

  // ── Honorarios handlers ──
  const openNewHon = () => {
    const now = new Date();
    const defaultPeriodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setHonForm({ periodo: defaultPeriodo, montoAcordado: '', montoCobrado: '0', formaPago: '', notas: '' });
    setHonEditId(null);
    setHonError('');
    setShowHonModal(true);
  };

  const openEditHon = (h: Honorario) => {
    setHonForm({
      periodo: h.periodo,
      montoAcordado: String(h.montoAcordado),
      montoCobrado: String(h.montoCobrado),
      formaPago: h.formaPago ?? '',
      notas: h.notas ?? '',
    });
    setHonEditId(h.id);
    setHonError('');
    setShowHonModal(true);
  };

  const handleSaveHon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingHon(true); setHonError('');
    try {
      const payload = {
        periodo: honForm.periodo,
        montoAcordado: parseFloat(honForm.montoAcordado),
        montoCobrado: parseFloat(honForm.montoCobrado || '0'),
        formaPago: honForm.formaPago || undefined,
        notas: honForm.notas || undefined,
      };
      if (honEditId) {
        await feesApi.marcarPago(honEditId, payload);
      } else {
        await feesApi.create(id, payload);
      }
      const { data } = await feesApi.getByClient(id);
      setHonorarios(data);
      setShowHonModal(false);
    } catch (err: any) {
      setHonError(err?.response?.data?.message || 'Error al guardar');
    } finally { setSavingHon(false); }
  };

  const openPago = (h: Honorario) => {
    setPagoForm({
      montoCobrado: String(h.montoAcordado),
      fechaCobro: new Date().toISOString().slice(0, 10),
      formaPago: 'transferencia',
      notas: '',
    });
    setShowPagoModal(h);
  };

  const handleSavePago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPagoModal || !id) return;
    setSavingHon(true); setHonError('');
    try {
      await feesApi.marcarPago(showPagoModal.id, {
        montoCobrado: parseFloat(pagoForm.montoCobrado),
        fechaCobro: pagoForm.fechaCobro,
        formaPago: pagoForm.formaPago,
        notas: pagoForm.notas || undefined,
      });
      const { data } = await feesApi.getByClient(id);
      setHonorarios(data);
      setShowPagoModal(null);
    } catch (err: any) {
      setHonError(err?.response?.data?.message || 'Error al registrar pago');
    } finally { setSavingHon(false); }
  };

  const handleDeleteHon = async (honId: string) => {
    if (!confirm('¿Eliminar este honorario?') || !id) return;
    await feesApi.delete(honId);
    setHonorarios(hs => hs.filter(h => h.id !== honId));
  };

  // ── Movimientos handlers ──
  const openNewMov = () => {
    setMovForm({ tipo: 'venta', fecha: new Date().toISOString().slice(0, 10), descripcion: '', monto: '', ivaIncluido: true, tasaIva: '22', nroComprobante: '', notas: '' });
    setMovEditId(null);
    setMovError('');
    setShowMovModal(true);
  };

  const openEditMov = (m: Movimiento) => {
    setMovForm({
      tipo: m.tipo,
      fecha: m.fecha.slice(0, 10),
      descripcion: m.descripcion ?? '',
      monto: String(m.monto),
      ivaIncluido: m.ivaIncluido,
      tasaIva: String(m.tasaIva ?? 22),
      nroComprobante: m.nroComprobante ?? '',
      notas: m.notas ?? '',
    });
    setMovEditId(m.id);
    setMovError('');
    setShowMovModal(true);
  };

  const handleSaveMov = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingMov(true); setMovError('');
    try {
      const payload = {
        tipo: movForm.tipo,
        fecha: movForm.fecha,
        descripcion: movForm.descripcion || undefined,
        monto: parseFloat(movForm.monto),
        ivaIncluido: movForm.ivaIncluido,
        tasaIva: movForm.tipo === 'gasto' ? undefined : parseFloat(movForm.tasaIva),
        nroComprobante: movForm.nroComprobante || undefined,
        notas: movForm.notas || undefined,
      };
      if (movEditId) {
        await movementsApi.update(movEditId, payload);
      } else {
        await movementsApi.create(id, payload);
      }
      const { data } = await movementsApi.getByClient(id);
      setMovimientos(data);
      // refrescar resumen del mes actual si ya está cargado
      if (movResumen) {
        const periodo = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const { data: r } = await movementsApi.resumenMensual(id, periodo);
        setMovResumen(r);
      }
      setShowMovModal(false);
    } catch (err: any) {
      setMovError(err?.response?.data?.message || 'Error al guardar');
    } finally { setSavingMov(false); }
  };

  const handleDeleteMov = async (movId: string) => {
    if (!confirm('¿Eliminar este movimiento?') || !id) return;
    await movementsApi.delete(movId);
    setMovimientos(ms => ms.filter(m => m.id !== movId));
  };

  const cargarResumenMes = async () => {
    if (!id) return;
    const periodo = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const { data } = await movementsApi.resumenMensual(id, periodo);
    setMovResumen(data);
  };

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>Cargando...</div>;
  if (!client) return null;

  const vencProximos = vencimientos.filter(v => v.estado === 'pendiente' || v.estado === 'alertado').length;

  return (
    <div style={{ padding: isMobile ? '16px' : '28px 32px', maxWidth: 960, background: theme.mainBg, minHeight: '100%' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: theme.textMuted }}>
        <Link to="/clients" style={{ color: theme.accentText, textDecoration: 'none', fontWeight: 500 }}>Clientes</Link>
        <span>/</span>
        <span style={{ color: theme.textPrimary }}>{client.nombre} {client.apellido}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: theme.accentLight, color: theme.accentText,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700,
          }}>
            {client.nombre[0]}{client.apellido[0]}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.textPrimary, marginBottom: 2 }}>
              {client.nombre} {client.apellido}
            </h1>
            {client.razonSocial && <div style={{ fontSize: 13, color: theme.textSecondary }}>{client.razonSocial}</div>}
            {client.rut && <div style={{ fontSize: 12, color: theme.textMuted }}>RUT: {client.rut}</div>}
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

      {/* Tabs — scroll horizontal en mobile */}
      <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${theme.cardBorder}`, marginBottom: 20, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' as any }}>
        <TabBtn theme={theme} label="Información" active={tab === 'info'} onClick={() => setTab('info')} />
        <TabBtn theme={theme} label="Vencimientos" active={tab === 'vencimientos'} onClick={() => setTab('vencimientos')} count={vencProximos || undefined} />
        <TabBtn theme={theme} label="Credenciales" active={tab === 'credenciales'} onClick={() => setTab('credenciales')} count={credentials.length || undefined} />
        <TabBtn theme={theme} label="Honorarios" active={tab === 'honorarios'} onClick={() => setTab('honorarios')} count={honorarios.length || undefined} />
        <TabBtn theme={theme} label="Movimientos" active={tab === 'movimientos'} onClick={() => { setTab('movimientos'); if (!movResumen) cargarResumenMes(); }} count={movimientos.length || undefined} />
      </div>

      {/* ── TAB: INFO ── */}
      {tab === 'info' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: theme.cardBg, borderRadius: 12, padding: '20px 24px', boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.textPrimary, marginBottom: 16 }}>📋 Datos personales</h3>
            <InfoRow theme={theme} label="CI" value={client.ci} />
            <InfoRow theme={theme} label="Email" value={client.email} />
            <InfoRow theme={theme} label="Teléfono" value={client.telefono} />
            <InfoRow theme={theme} label="Dirección" value={client.direccion} />
          </div>
          <div style={{ background: theme.cardBg, borderRadius: 12, padding: '20px 24px', boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.textPrimary, marginBottom: 16 }}>🏢 Datos empresa</h3>
            <InfoRow theme={theme} label="Razón social" value={client.razonSocial} />
            <InfoRow theme={theme} label="RUT" value={client.rut} />
            <InfoRow theme={theme} label="Nro. BPS" value={client.nroBps} />
            <InfoRow theme={theme} label="Tipo empresa" value={client.tipoEmpresa ?? undefined} />
            <InfoRow theme={theme} label="Giro" value={client.giro} />
            <InfoRow theme={theme} label="Inicio actividades" value={client.fechaInicioActividades ? new Date(client.fechaInicioActividades).toLocaleDateString('es-UY') : undefined} />
          </div>
          <div style={{ background: theme.cardBg, borderRadius: 12, padding: '20px 24px', boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}`, gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.textPrimary, marginBottom: 16 }}>📊 Perfil tributario</h3>
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
                  background: (client as any)[key] ? theme.accentLight : theme.tableHeaderBg,
                  color: (client as any)[key] ? theme.accentText : theme.textMuted,
                  border: `1px solid ${(client as any)[key] ? theme.accent + '44' : theme.cardBorder}`,
                }}>
                  {(client as any)[key] ? '✓' : '–'} {label}
                </span>
              ))}
            </div>

            {(client.exoneracionIva || client.exoneracionIrae) && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${theme.cardBorder}` }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Exoneraciones vigentes</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {client.exoneracionIva && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#065F46' }}>✓ Exoneración de IVA</div>}
                  {client.exoneracionIrae && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#065F46' }}>✓ Exoneración de IRAE</div>}
                  {client.exoneracionDetalle && (
                    <div style={{ marginTop: 4, padding: '8px 12px', background: theme.tableHeaderBg, borderRadius: 6, fontSize: 12, color: theme.textSecondary }}>
                      <strong>Detalle/Resolución:</strong> {client.exoneracionDetalle}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {client.notas && (
            <div style={{ background: theme.cardBg, borderRadius: 12, padding: '20px 24px', boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}`, gridColumn: '1 / -1' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.textPrimary, marginBottom: 8 }}>📝 Notas</h3>
              <p style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.6 }}>{client.notas}</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: VENCIMIENTOS ── */}
      {tab === 'vencimientos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: theme.textSecondary }}>{vencimientos.length} vencimiento{vencimientos.length !== 1 ? 's' : ''} registrado{vencimientos.length !== 1 ? 's' : ''}</p>
            <button
              onClick={handleGenerarVencimientos}
              style={{
                padding: '7px 16px', borderRadius: 8, border: `1px solid ${theme.cardBorder}`,
                background: theme.cardBg, color: theme.textSecondary, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              ↻ Regenerar vencimientos
            </button>
          </div>
          <div style={{ background: theme.cardBg, borderRadius: 12, boxShadow: theme.cardShadow, overflow: 'hidden', border: `1px solid ${theme.cardBorder}` }}>
            {vencimientos.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
                <div style={{ color: theme.textSecondary, fontSize: 14 }}>No hay vencimientos generados</div>
                <div style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>Hacé clic en "Regenerar vencimientos" para crearlos según el perfil tributario</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: theme.tableHeaderBg, borderBottom: `1px solid ${theme.cardBorder}` }}>
                    {['Tipo', 'Período', 'Vencimiento', 'Estado', ''].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vencimientos
                    .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())
                    .map((v, i) => {
                      const c = ESTADO_VENC_COLORS[v.estado];
                      return (
                        <tr key={v.id} style={{ borderBottom: i < vencimientos.length - 1 ? `1px solid ${theme.tableBorder}` : 'none' }}>
                          <td style={{ padding: '13px 16px', fontSize: 14, color: theme.textPrimary, fontWeight: 500 }}>
                            {v.tipo.replace(/_/g, ' ').toUpperCase()}
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: 13, color: theme.textSecondary }}>{v.periodo ?? '—'}</td>
                          <td style={{ padding: '13px 16px', fontSize: 13, color: theme.textPrimary }}>
                            {new Date(v.fechaVencimiento).toLocaleDateString('es-UY')}
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: c.bg, color: c.color }}>
                              {v.estado.charAt(0).toUpperCase() + v.estado.slice(1)}
                            </span>
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            {v.estado !== 'completado' && (
                              <button
                                onClick={async () => {
                                  await calendarApi.completar(v.id);
                                  setVencimientos(vs => vs.map(x => x.id === v.id ? { ...x, estado: 'completado' as EstadoVencimiento } : x));
                                }}
                                style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#DCFCE7', color: '#15803D', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                              >
                                ✓ Completar
                              </button>
                            )}
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
                background: theme.accent, color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              + Nueva credencial
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {credentials.length === 0 ? (
              <div style={{ gridColumn: '1/-1', padding: 48, textAlign: 'center', background: theme.cardBg, borderRadius: 12, boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}` }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔑</div>
                <div style={{ color: theme.textSecondary, fontSize: 14 }}>No hay credenciales guardadas</div>
              </div>
            ) : credentials.map(cred => {
              const color = PLATAFORMA_COLORS[cred.plataforma] ?? '#475569';
              return (
                <div key={cred.id} style={{ background: theme.cardBg, borderRadius: 12, padding: '18px 20px', boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}`, borderTop: `3px solid ${color}` }}>
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
                      <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 2 }}>USUARIO</div>
                      <div style={{ fontSize: 13, color: theme.textPrimary, fontWeight: 500, fontFamily: 'monospace' }}>{cred.usuario}</div>
                    </div>
                  )}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 2 }}>CONTRASEÑA</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: theme.textPrimary, fontFamily: 'monospace', flex: 1 }}>
                        {revealed[cred.id] ?? '••••••••'}
                      </span>
                      <button
                        onClick={() => handleReveal(cred.id)}
                        disabled={revealing === cred.id}
                        style={{ background: 'none', border: `1px solid ${theme.cardBorder}`, borderRadius: 5, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: theme.accentText }}
                      >
                        {revealing === cred.id ? '...' : revealed[cred.id] ? 'Ocultar' : 'Ver'}
                      </button>
                    </div>
                  </div>
                  {cred.pin && (
                    <div>
                      <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 2 }}>PIN</div>
                      <div style={{ fontSize: 13, color: theme.textPrimary, fontFamily: 'monospace' }}>{cred.pin}</div>
                    </div>
                  )}
                  {cred.url && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 2 }}>URL</div>
                      <a href={cred.url.startsWith('http') ? cred.url : `https://${cred.url}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: theme.accent, textDecoration: 'none' }}>
                        {cred.url}
                      </a>
                    </div>
                  )}
                  {cred.mfa && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, padding: '2px 6px', background: '#FEF3C7', color: '#D97706', borderRadius: 4, fontWeight: 600 }}>MFA Requerido</span>
                    </div>
                  )}
                  {cred.notas && <div style={{ marginTop: 10, fontSize: 12, color: theme.textMuted, borderTop: `1px solid ${theme.tableBorder}`, paddingTop: 8 }}>{cred.notas}</div>}
                </div>
              );
            })}
          </div>

          {/* Modal nueva credencial */}
          {showCredModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
              onClick={e => e.target === e.currentTarget && setShowCredModal(false)}>
              <div style={{ background: theme.cardBg, borderRadius: 14, padding: '28px', width: 420, boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: `1px solid ${theme.cardBorder}` }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: theme.textPrimary, marginBottom: 20 }}>Nueva credencial</h2>
                <form onSubmit={handleSaveCred}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: theme.textSecondary, marginBottom: 5 }}>Plataforma <span style={{ color: '#DC2626' }}>*</span></label>
                      <select value={credForm.plataforma} onChange={e => setCredForm(f => ({ ...f, plataforma: e.target.value as PlataformaCredencial }))}
                        style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: `1px solid ${theme.inputBorder}`, fontSize: 14, background: theme.inputBg, color: theme.textPrimary, boxSizing: 'border-box' as const }}>
                        {Object.entries(PLATAFORMA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    {credForm.plataforma === 'otro' && (
                      <CredField label="Nombre plataforma" value={credForm.nombrePlataforma} onChange={v => setCredForm(f => ({ ...f, nombrePlataforma: v }))} />
                    )}
                    <CredField label="Usuario" value={credForm.usuario} onChange={v => setCredForm(f => ({ ...f, usuario: v }))} />
                    <CredField label="Contraseña" type="password" value={credForm.password} onChange={v => setCredForm(f => ({ ...f, password: v }))} />
                    <CredField label="PIN (opcional)" value={credForm.pin} onChange={v => setCredForm(f => ({ ...f, pin: v }))} />
                    <CredField label="URL Plataforma (opcional)" value={(credForm as any).url || ''} onChange={v => setCredForm(f => ({ ...f, url: v }))} placeholder="https://..." />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: theme.textPrimary, cursor: 'pointer', marginTop: 4 }}>
                      <input type="checkbox" checked={(credForm as any).mfa || false} onChange={e => setCredForm(f => ({ ...f, mfa: e.target.checked }))} style={{ accentColor: theme.accent, width: 16, height: 16 }} />
                      Requiere MFA / Token
                    </label>
                    <CredField label="Notas" value={credForm.notas} onChange={v => setCredForm(f => ({ ...f, notas: v }))} />
                  </div>
                  {credError && <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 7, padding: '8px 12px', fontSize: 13, marginTop: 12 }}>{credError}</div>}
                  <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setShowCredModal(false)} style={{ padding: '8px 18px', borderRadius: 7, border: `1px solid ${theme.cardBorder}`, background: theme.cardBg, color: theme.textSecondary, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
                    <button type="submit" disabled={savingCred} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: theme.accent, color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: savingCred ? 0.7 : 1 }}>
                      {savingCred ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Autenticación Contador para ver credenciales */}
          {showAuthModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(2px)' }}
              onClick={e => e.target === e.currentTarget && setShowAuthModal(false)}>
              <div style={{ background: theme.cardBg, borderRadius: 16, padding: '32px', width: 400, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: `1px solid ${theme.cardBorder}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    🔒
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>Acceso Seguro</h2>
                    <p style={{ fontSize: 13, color: theme.textSecondary, margin: '2px 0 0 0' }}>Ingresa tu contraseña para continuar</p>
                  </div>
                </div>

                <form onSubmit={handleAuthSubmit}>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: theme.textSecondary, marginBottom: 8 }}>Contraseña de contador</label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={e => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      autoFocus
                      required
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 8,
                        border: `1px solid ${authError ? '#EF4444' : theme.inputBorder}`,
                        fontSize: 15, background: theme.inputBg, color: theme.textPrimary, boxSizing: 'border-box'
                      }}
                    />
                    {authError && <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6, fontWeight: 500 }}>{authError}</div>}
                  </div>

                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setShowAuthModal(false)} style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${theme.cardBorder}`, background: 'transparent', color: theme.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}>
                      Cancelar
                    </button>
                    <button type="submit" style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: `0 4px 12px ${theme.accent}40`, transition: 'all 0.2s' }}>
                      Autorizar
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: theme.textSecondary }}>
              {honorarios.length} honorario{honorarios.length !== 1 ? 's' : ''} registrado{honorarios.length !== 1 ? 's' : ''}
            </p>
            <button onClick={openNewHon} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 8, border: 'none',
              background: theme.accent, color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>
              + Nuevo honorario
            </button>
          </div>

          <div style={{ background: theme.cardBg, borderRadius: 12, boxShadow: theme.cardShadow, overflow: 'hidden', border: `1px solid ${theme.cardBorder}` }}>
            {honorarios.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>💰</div>
                <div style={{ color: theme.textSecondary, fontSize: 14 }}>No hay honorarios registrados</div>
                <div style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>Creá el primero con el botón de arriba</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: theme.tableHeaderBg, borderBottom: `1px solid ${theme.cardBorder}` }}>
                    {['Período', 'Acordado', 'Cobrado', 'Pendiente', 'Estado', 'Forma de pago', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {honorarios.map((h, i) => {
                    const estadoColors = {
                      al_dia: { bg: '#DCFCE7', color: '#15803D', label: 'Al día' },
                      pendiente: { bg: '#FEF3C7', color: '#D97706', label: 'Pendiente' },
                      vencido: { bg: '#FEE2E2', color: '#DC2626', label: 'Vencido' },
                    };
                    const sc = estadoColors[h.estado] ?? estadoColors.pendiente;
                    const pendiente = Number(h.montoAcordado) - Number(h.montoCobrado);
                    return (
                      <tr key={h.id} style={{ borderBottom: i < honorarios.length - 1 ? `1px solid ${theme.tableBorder}` : 'none' }}>
                        <td style={{ padding: '13px 16px', fontSize: 14, color: theme.textPrimary, fontWeight: 600 }}>{h.periodo}</td>
                        <td style={{ padding: '13px 16px', fontSize: 14, color: theme.textPrimary }}>
                          ${Number(h.montoAcordado).toLocaleString('es-UY')}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 14, color: '#15803D', fontWeight: 500 }}>
                          ${Number(h.montoCobrado).toLocaleString('es-UY')}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 14, color: pendiente > 0 ? '#D97706' : theme.textMuted, fontWeight: pendiente > 0 ? 600 : 400 }}>
                          {pendiente > 0 ? `${pendiente.toLocaleString('es-UY')}` : '—'}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: sc.bg, color: sc.color }}>
                            {sc.label}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: theme.textSecondary }}>
                          {h.formaPago ? h.formaPago.charAt(0).toUpperCase() + h.formaPago.slice(1) : '—'}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {h.estado !== 'al_dia' && (
                              <button onClick={() => openPago(h)} title="Registrar pago"
                                style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#DCFCE7', color: '#15803D', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                💳 Pagar
                              </button>
                            )}
                            <button onClick={() => openEditHon(h)} title="Editar"
                              style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${theme.cardBorder}`, background: theme.cardBg, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <svg width="13" height="13" fill="none" stroke={theme.textSecondary} strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button onClick={() => handleDeleteHon(h.id)} title="Eliminar"
                              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #FEE2E2', background: '#FFF5F5', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <svg width="13" height="13" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Modal nuevo/editar honorario */}
          {showHonModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
              onClick={e => e.target === e.currentTarget && setShowHonModal(false)}>
              <div style={{ background: theme.cardBg, borderRadius: 14, padding: '28px', width: 420, boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: `1px solid ${theme.cardBorder}` }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: theme.textPrimary, marginBottom: 20 }}>
                  {honEditId ? 'Editar honorario' : 'Nuevo honorario'}
                </h2>
                <form onSubmit={handleSaveHon}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    <HonField label="Período (YYYY-MM)" value={honForm.periodo} onChange={v => setHonForm(f => ({ ...f, periodo: v }))} placeholder="2026-03" required />
                    <HonField label="Monto acordado ($)" value={honForm.montoAcordado} onChange={v => setHonForm(f => ({ ...f, montoAcordado: v }))} type="number" required />
                    <HonField label="Monto cobrado ($)" value={honForm.montoCobrado} onChange={v => setHonForm(f => ({ ...f, montoCobrado: v }))} type="number" />
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: theme.textSecondary, marginBottom: 5 }}>Forma de pago</label>
                      <select value={honForm.formaPago} onChange={e => setHonForm(f => ({ ...f, formaPago: e.target.value as FormaPago | '' }))}
                        style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: `1px solid ${theme.inputBorder}`, fontSize: 14, background: theme.inputBg, color: theme.textPrimary, boxSizing: 'border-box' as const }}>
                        <option value="">Sin especificar</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                    <HonField label="Notas" value={honForm.notas} onChange={v => setHonForm(f => ({ ...f, notas: v }))} />
                  </div>
                  {honError && <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 7, padding: '8px 12px', fontSize: 13, marginTop: 12 }}>{honError}</div>}
                  <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setShowHonModal(false)} style={{ padding: '8px 18px', borderRadius: 7, border: `1px solid ${theme.cardBorder}`, background: theme.cardBg, color: theme.textSecondary, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
                    <button type="submit" disabled={savingHon} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: theme.accent, color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: savingHon ? 0.7 : 1 }}>
                      {savingHon ? 'Guardando...' : honEditId ? 'Guardar cambios' : 'Crear honorario'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal registrar pago */}
          {showPagoModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
              onClick={e => e.target === e.currentTarget && setShowPagoModal(null)}>
              <div style={{ background: theme.cardBg, borderRadius: 14, padding: '28px', width: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: `1px solid ${theme.cardBorder}` }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>Registrar pago</h2>
                <p style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 20 }}>
                  Honorario <strong>{showPagoModal.periodo}</strong> — acordado: <strong>${Number(showPagoModal.montoAcordado).toLocaleString('es-UY')}</strong>
                </p>
                <form onSubmit={handleSavePago}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    <HonField label="Monto cobrado ($)" value={pagoForm.montoCobrado} onChange={v => setPagoForm(f => ({ ...f, montoCobrado: v }))} type="number" required />
                    <HonField label="Fecha de cobro" value={pagoForm.fechaCobro} onChange={v => setPagoForm(f => ({ ...f, fechaCobro: v }))} type="date" required />
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: theme.textSecondary, marginBottom: 5 }}>Forma de pago <span style={{ color: '#DC2626' }}>*</span></label>
                      <select value={pagoForm.formaPago} onChange={e => setPagoForm(f => ({ ...f, formaPago: e.target.value as FormaPago }))}
                        style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: `1px solid ${theme.inputBorder}`, fontSize: 14, background: theme.inputBg, color: theme.textPrimary, boxSizing: 'border-box' as const }}>
                        <option value="transferencia">Transferencia</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                    <HonField label="Notas (opcional)" value={pagoForm.notas} onChange={v => setPagoForm(f => ({ ...f, notas: v }))} />
                  </div>
                  {honError && <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 7, padding: '8px 12px', fontSize: 13, marginTop: 12 }}>{honError}</div>}
                  <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setShowPagoModal(null)} style={{ padding: '8px 18px', borderRadius: 7, border: `1px solid ${theme.cardBorder}`, background: theme.cardBg, color: theme.textSecondary, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
                    <button type="submit" disabled={savingHon} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: '#15803D', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: savingHon ? 0.7 : 1 }}>
                      {savingHon ? 'Guardando...' : '💳 Confirmar pago'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: MOVIMIENTOS ── */}
      {tab === 'movimientos' && (
        <div>
          {/* Resumen del mes actual */}
          {movResumen && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Ventas', value: movResumen.totalVentas, color: '#15803D' },
                { label: 'Compras', value: movResumen.totalCompras, color: '#D97706' },
                { label: 'Gastos', value: movResumen.totalGastos, color: '#DC2626' },
                { label: 'Débito IVA', value: movResumen.debitoIva, color: theme.accentText },
                { label: 'Crédito IVA', value: movResumen.creditoIva, color: theme.accentText },
                { label: 'Saldo IVA', value: movResumen.saldoIva, color: movResumen.saldoIva > 0 ? '#DC2626' : '#15803D' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: theme.cardBg, borderRadius: 10, padding: '14px 16px', boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}`, borderTop: `3px solid ${color}` }}>
                  <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color }}>${Number(value).toLocaleString('es-UY', { maximumFractionDigits: 0 })}</div>
                  <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>{movResumen.periodo} • neto</div>
                </div>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10, flexWrap: 'wrap' as const }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['', 'venta', 'compra', 'gasto'] as const).map(t => (
                <button key={t} onClick={() => setMovFiltroTipo(t as TipoMovimiento | '')}
                  style={{
                    padding: '5px 14px', borderRadius: 20, border: `1px solid ${movFiltroTipo === t ? theme.accent : theme.cardBorder}`,
                    background: movFiltroTipo === t ? theme.accentLight : theme.cardBg,
                    color: movFiltroTipo === t ? theme.accentText : theme.textSecondary,
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  }}>
                  {t === '' ? 'Todos' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}
                </button>
              ))}
            </div>
            <button onClick={openNewMov} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              + Nuevo movimiento
            </button>
          </div>

          {/* Tabla */}
          <div style={{ background: theme.cardBg, borderRadius: 12, boxShadow: theme.cardShadow, overflow: 'hidden', border: `1px solid ${theme.cardBorder}` }}>
            {(() => {
              const filtered = movFiltroTipo ? movimientos.filter(m => m.tipo === movFiltroTipo) : movimientos;
              const TIPO_COLORS: Record<TipoMovimiento, { bg: string; color: string; label: string }> = {
                venta: { bg: '#DCFCE7', color: '#15803D', label: '↑ Venta' },
                compra: { bg: '#FEF3C7', color: '#D97706', label: '↓ Compra' },
                gasto: { bg: '#FEE2E2', color: '#DC2626', label: '↓ Gasto' },
              };
              if (filtered.length === 0) return (
                <div style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                  <div style={{ color: theme.textSecondary, fontSize: 14 }}>No hay movimientos registrados</div>
                  <div style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>Registrá ventas, compras y gastos del cliente</div>
                </div>
              );
              return (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: theme.tableHeaderBg, borderBottom: `1px solid ${theme.cardBorder}` }}>
                      {['Tipo', 'Fecha', 'Descripción', 'Comprobante', 'Monto', 'IVA', 'Acciones'].map(h => (
                        <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' as const }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m, i) => {
                      const tc = TIPO_COLORS[m.tipo];
                      const tasa = m.tasaIva ?? 22;
                      const montoNum = Number(m.monto);
                      const ivaMonto = m.tipo !== 'gasto'
                        ? (m.ivaIncluido ? montoNum * (tasa / (100 + tasa)) : montoNum * (tasa / 100))
                        : 0;
                      return (
                        <tr key={m.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${theme.tableBorder}` : 'none' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: tc.bg, color: tc.color }}>{tc.label}</span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: theme.textSecondary, whiteSpace: 'nowrap' as const }}>
                            {new Date(m.fecha).toLocaleDateString('es-UY')}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: theme.textPrimary, maxWidth: 200 }}>
                            {m.descripcion || <span style={{ color: theme.textMuted }}>—</span>}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: theme.textMuted, fontFamily: 'monospace' }}>
                            {m.nroComprobante || '—'}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: theme.textPrimary, whiteSpace: 'nowrap' as const }}>
                            ${montoNum.toLocaleString('es-UY')}
                            {m.ivaIncluido && <span style={{ fontSize: 10, color: theme.textMuted, fontWeight: 400, marginLeft: 4 }}>c/IVA</span>}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: theme.textMuted, whiteSpace: 'nowrap' as const }}>
                            {m.tipo !== 'gasto' && ivaMonto > 0
                              ? <span>${ivaMonto.toLocaleString('es-UY', { maximumFractionDigits: 0 })} ({tasa}%)</span>
                              : '—'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => openEditMov(m)}
                                style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${theme.cardBorder}`, background: theme.cardBg, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <svg width="13" height="13" fill="none" stroke={theme.textSecondary} strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              </button>
                              <button onClick={() => handleDeleteMov(m.id)}
                                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #FEE2E2', background: '#FFF5F5', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <svg width="13" height="13" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
          </div>

          {/* Modal nuevo/editar movimiento */}
          {showMovModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
              onClick={e => e.target === e.currentTarget && setShowMovModal(false)}>
              <div style={{ background: theme.cardBg, borderRadius: 14, padding: '28px', width: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: `1px solid ${theme.cardBorder}` }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: theme.textPrimary, marginBottom: 20 }}>
                  {movEditId ? 'Editar movimiento' : 'Nuevo movimiento'}
                </h2>
                <form onSubmit={handleSaveMov}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: theme.textSecondary, marginBottom: 5 }}>Tipo <span style={{ color: '#DC2626' }}>*</span></label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {(['venta', 'compra', 'gasto'] as TipoMovimiento[]).map(t => (
                          <button key={t} type="button" onClick={() => setMovForm(f => ({ ...f, tipo: t }))}
                            style={{
                              flex: 1, padding: '8px', borderRadius: 7,
                              border: `2px solid ${movForm.tipo === t ? theme.accent : theme.inputBorder}`,
                              background: movForm.tipo === t ? theme.accentLight : theme.inputBg,
                              color: movForm.tipo === t ? theme.accentText : theme.textSecondary,
                              fontWeight: 600, fontSize: 13, cursor: 'pointer',
                            }}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <HonField label="Fecha" value={movForm.fecha} onChange={v => setMovForm(f => ({ ...f, fecha: v }))} type="date" required />
                    <HonField label="Descripción" value={movForm.descripcion} onChange={v => setMovForm(f => ({ ...f, descripcion: v }))} placeholder="Ej: Venta factura 123" />
                    <HonField label="Monto ($)" value={movForm.monto} onChange={v => setMovForm(f => ({ ...f, monto: v }))} type="number" required />
                    {movForm.tipo !== 'gasto' && (
                      <>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: theme.textSecondary, cursor: 'pointer' }}>
                          <input type="checkbox" checked={movForm.ivaIncluido} onChange={e => setMovForm(f => ({ ...f, ivaIncluido: e.target.checked }))} style={{ width: 15, height: 15 }} />
                          IVA incluido en el monto
                        </label>
                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: theme.textSecondary, marginBottom: 5 }}>Tasa IVA (%)</label>
                          <select value={movForm.tasaIva} onChange={e => setMovForm(f => ({ ...f, tasaIva: e.target.value }))}
                            style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: `1px solid ${theme.inputBorder}`, fontSize: 14, background: theme.inputBg, color: theme.textPrimary }}>
                            <option value="22">22% (General)</option>
                            <option value="10">10% (Mínima)</option>
                            <option value="0">0% (Exento)</option>
                          </select>
                        </div>
                      </>
                    )}
                    <HonField label="Nº Comprobante" value={movForm.nroComprobante} onChange={v => setMovForm(f => ({ ...f, nroComprobante: v }))} placeholder="Ej: A-0001234" />
                    <HonField label="Notas" value={movForm.notas} onChange={v => setMovForm(f => ({ ...f, notas: v }))} />
                  </div>
                  {movError && <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 7, padding: '8px 12px', fontSize: 13, marginTop: 12 }}>{movError}</div>}
                  <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setShowMovModal(false)} style={{ padding: '8px 18px', borderRadius: 7, border: `1px solid ${theme.cardBorder}`, background: theme.cardBg, color: theme.textSecondary, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
                    <button type="submit" disabled={savingMov} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: theme.accent, color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: savingMov ? 0.7 : 1 }}>
                      {savingMov ? 'Guardando...' : movEditId ? 'Guardar cambios' : 'Registrar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Small field components (usan theme del store via prop o fallback neutral) ──
function CredField({ label, value, onChange, type = 'text', theme }: { label: string; value: string; onChange: (v: string) => void; type?: string; theme?: any }) {
  const { theme: storeTheme } = useThemeStore();
  const t = theme ?? storeTheme;
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: t.textSecondary, marginBottom: 5 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: `1px solid ${t.inputBorder}`, fontSize: 14, color: t.textPrimary, background: t.inputBg, outline: 'none', boxSizing: 'border-box' as const }}
        onFocus={e => (e.target.style.borderColor = t.accent)}
        onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
    </div>
  );
}

function HonField({ label, value, onChange, type = 'text', required, placeholder, theme }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string; theme?: any;
}) {
  const { theme: storeTheme } = useThemeStore();
  const t = theme ?? storeTheme;
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: t.textSecondary, marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#DC2626' }}> *</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        required={required} placeholder={placeholder}
        style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: `1px solid ${t.inputBorder}`, fontSize: 14, color: t.textPrimary, background: t.inputBg, outline: 'none', boxSizing: 'border-box' as const }}
        onFocus={e => (e.target.style.borderColor = t.accent)}
        onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
    </div>
  );
}
