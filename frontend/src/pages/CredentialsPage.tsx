import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { clientsApi, credentialsApi, authApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';
import { Client, Credential, PlataformaCredencial } from '../types';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

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

const PLATAFORMA_COLOR: Record<PlataformaCredencial, string> = {
  dgi: '#1e4976',
  bps: '#065F46',
  facturacion_electronica: '#6D28D9',
  cjppu: '#92400E',
  fonasa: '#1D4ED8',
  banco: '#374151',
  'gub.uy': '#0F172A',
  otro: '#475569',
};

type CredConCliente = Credential & { clienteNombre?: string; clienteId?: string };

export default function CredentialsPage() {
  const theme = useThemeStore((s) => s.theme);
  const isMobile = useIsMobile();
  const [credentials, setCredentials] = useState<CredConCliente[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroPlataforma, setFiltroPlataforma] = useState<PlataformaCredencial | 'todas'>('todas');
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealing, setRevealing] = useState<string | null>(null);

  useEffect(() => {
    clientsApi.getAll().then(async ({ data: cs }) => {
      setClients(cs);
      const allCreds: CredConCliente[] = [];
      await Promise.all(
        cs.map(async (c: Client) => {
          try {
            const { data } = await credentialsApi.getByClient(c.id);
            data.forEach((cr: Credential) => allCreds.push({ ...cr, clienteNombre: `${c.nombre} ${c.apellido}`, clienteId: c.id }));
          } catch { }
        })
      );
      setCredentials(allCreds);
    }).finally(() => setLoading(false));
  }, []);

  const { credentialsToken, setCredentialsToken } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [pendingRevealId, setPendingRevealId] = useState<string | null>(null);

  const handleReveal = async (credId: string) => {
    if (revealed[credId]) {
      setRevealed(r => { const n = { ...r }; delete n[credId]; return n; });
      return;
    }

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

  const handleWebAuthnRegister = async () => {
    try {
      setAuthError('');
      const opts = await authApi.webauthnRegisterOptions();
      const attResp = await startRegistration(opts.data);
      await authApi.webauthnRegisterVerify(attResp);
      alert('Dispositivo registrado correctamente con Huella/FaceID');
    } catch (error: any) {
      if (error.name !== 'NotAllowedError') {
        setAuthError('Error al registrar dispositivo: ' + error.message);
      }
    }
  };

  const handleWebAuthnLogin = async () => {
    try {
      setAuthError('');
      const opts = await authApi.webauthnLoginOptions();
      const asseResp = await startAuthentication(opts.data);
      const { data } = await authApi.webauthnLoginVerify(asseResp);
      setCredentialsToken(data.token);
      setShowAuthModal(false);
      if (pendingRevealId) {
        await performReveal(pendingRevealId, data.token);
        setPendingRevealId(null);
      }
    } catch (error: any) {
      if (error.name !== 'NotAllowedError') {
        setAuthError('Error en autenticación biométrica: ' + error.message);
      }
    }
  };

  const handleDelete = async (credId: string) => {
    if (!confirm('¿Eliminar esta credencial?')) return;
    await credentialsApi.delete(credId);
    setCredentials(cs => cs.filter(c => c.id !== credId));
  };

  const filtered = credentials.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (c.clienteNombre ?? '').toLowerCase().includes(q) ||
      (c.usuario ?? '').toLowerCase().includes(q) ||
      PLATAFORMA_LABEL[c.plataforma].toLowerCase().includes(q);
    const matchPlataforma = filtroPlataforma === 'todas' || c.plataforma === filtroPlataforma;
    return matchSearch && matchPlataforma;
  });

  // Agrupar por cliente
  const porCliente: Record<string, CredConCliente[]> = {};
  filtered.forEach(c => {
    const key = c.clienteId ?? 'sin-cliente';
    if (!porCliente[key]) porCliente[key] = [];
    porCliente[key].push(c);
  });

  return (
    <div style={{ padding: isMobile ? '16px' : '28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 19 : 22, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>Credenciales</h1>
        <p style={{ color: theme.textSecondary, fontSize: 14 }}>
          {loading ? 'Cargando...' : `${credentials.length} credencial${credentials.length !== 1 ? 'es' : ''} de ${clients.length} clientes`}
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' as const }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
            width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text" placeholder="Buscar por cliente, usuario, plataforma..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 34px',
              borderRadius: 8, border: `1px solid ${theme.cardBorder}`,
              fontSize: 14, color: theme.textPrimary, outline: 'none', boxSizing: 'border-box',
              background: theme.inputBg,
            }}
            onFocus={e => (e.target.style.borderColor = theme.accent)}
            onBlur={e => (e.target.style.borderColor = theme.cardBorder)}
          />
        </div>
        <select
          value={filtroPlataforma}
          onChange={e => setFiltroPlataforma(e.target.value as any)}
          style={{ padding: '9px 12px', borderRadius: 8, border: `1px solid ${theme.cardBorder}`, fontSize: 14, background: theme.inputBg, color: theme.textPrimary }}
        >
          <option value="todas">Todas las plataformas</option>
          {Object.entries(PLATAFORMA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Contenido */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#94A3B8', padding: 48 }}>Cargando credenciales...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 56, background: theme.cardBg, borderRadius: 12, boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
          <div style={{ color: theme.textSecondary, fontSize: 14 }}>
            {search || filtroPlataforma !== 'todas' ? 'No se encontraron resultados' : 'No hay credenciales registradas'}
          </div>
          <div style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>
            Ingresá al detalle de cada cliente para agregar sus credenciales
          </div>
        </div>
      ) : (
        Object.entries(porCliente).map(([clienteId, creds]) => {
          const nombre = creds[0]?.clienteNombre ?? '—';
          return (
            <div key={clienteId} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: theme.accentLight, color: theme.accentText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <Link to={`/clients/${clienteId}`} style={{ fontSize: 15, fontWeight: 600, color: theme.textPrimary, textDecoration: 'none' }}>
                  {nombre}
                </Link>
                <span style={{ fontSize: 12, color: theme.textMuted }}>{creds.length} credencial{creds.length !== 1 ? 'es' : ''}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {creds.map(cred => {
                  const color = PLATAFORMA_COLOR[cred.plataforma] ?? '#475569';
                  return (
                    <div key={cred.id} style={{ background: theme.cardBg, borderRadius: 10, padding: '16px 18px', boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}`, borderTop: `3px solid ${color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {PLATAFORMA_LABEL[cred.plataforma]}
                          {cred.nombrePlataforma && ` – ${cred.nombrePlataforma}`}
                        </span>
                        <button onClick={() => handleDelete(cred.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontSize: 14 }} title="Eliminar">✕</button>
                      </div>
                      {cred.usuario && (
                        <div style={{ marginBottom: 6 }}>
                          <div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 1 }}>USUARIO</div>
                          <div style={{ fontSize: 13, color: theme.textPrimary, fontFamily: 'monospace' }}>{cred.usuario}</div>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 1 }}>CONTRASEÑA</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontFamily: 'monospace', flex: 1, color: theme.textPrimary }}>
                            {revealed[cred.id] ?? '••••••••'}
                          </span>
                          <button
                            onClick={() => handleReveal(cred.id)}
                            disabled={revealing === cred.id}
                            style={{ border: `1px solid ${theme.cardBorder}`, borderRadius: 5, background: theme.cardBg, padding: '2px 8px', fontSize: 11, cursor: 'pointer', color: theme.accentText }}
                          >
                            {revealing === cred.id ? '...' : revealed[cred.id] ? 'Ocultar' : 'Ver'}
                          </button>
                        </div>
                      </div>
                      {cred.pin && (
                        <div style={{ marginTop: 6 }}>
                          <div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 1 }}>PIN</div>
                          <div style={{ fontSize: 13, fontFamily: 'monospace', color: theme.textPrimary }}>{cred.pin}</div>
                        </div>
                      )}
                      {!cred.vigente && (
                        <div style={{ marginTop: 8, padding: '2px 8px', background: '#FEE2E2', color: '#DC2626', borderRadius: 4, fontSize: 11, display: 'inline-block' }}>
                          Inactiva
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
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
                <p style={{ fontSize: 13, color: theme.textSecondary, margin: '2px 0 0 0' }}>Para ver la contraseña, verifica tu identidad.</p>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <button type="button" onClick={handleWebAuthnLogin} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', marginBottom: 16 }}>
                <span style={{ fontSize: 18 }}>👆</span> Usar Huella / FaceID
              </button>

              <div style={{ textAlign: 'center', marginBottom: 16, color: theme.textSecondary, fontSize: 13 }}>
                — O usa tu contraseña de contador —
              </div>

              <form onSubmit={handleAuthSubmit}>
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
                    fontSize: 15, background: theme.inputBg, color: theme.textPrimary, boxSizing: 'border-box',
                    marginBottom: 12
                  }}
                />

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" onClick={() => setShowAuthModal(false)} style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${theme.cardBorder}`, background: 'transparent', color: theme.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}>
                    Cancelar
                  </button>
                  <button type="submit" style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: `0 4px 12px ${theme.accent}40`, transition: 'all 0.2s' }}>
                    Autorizar
                  </button>
                </div>
              </form>
            </div>

            {authError && <div style={{ color: '#EF4444', fontSize: 13, marginTop: 10, fontWeight: 500, textAlign: 'center', background: '#FEF2F2', padding: 8, borderRadius: 6 }}>{authError}</div>}

            <div style={{ borderTop: `1px solid ${theme.cardBorder}`, marginTop: 20, paddingTop: 16, textAlign: 'center' }}>
              <button type="button" onClick={handleWebAuthnRegister} style={{ background: 'none', border: 'none', color: theme.accent, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                + Registrar dispositivo (Passkey)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
