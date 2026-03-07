import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../services/api';
import { useThemeStore } from '../store/theme.store';
import { Notificacion, TipoNotificacion } from '../types';

const TIPO_CONFIG: Record<TipoNotificacion, { icon: string; color: string; bg: string }> = {
  vencimiento_proximo:  { icon: '📅', color: '#D97706', bg: '#FEF3C7' },
  boleto_pendiente:     { icon: '🧾', color: '#0EA5E9', bg: '#E0F2FE' },
  honorario_vencido:    { icon: '💰', color: '#DC2626', bg: '#FEE2E2' },
  pago_confirmado:      { icon: '✅', color: '#15803D', bg: '#DCFCE7' },
  consulta_recibida:    { icon: '💬', color: '#7C3AED', bg: '#EDE9FE' },
  consulta_respondida:  { icon: '💬', color: '#2563EB', bg: '#DBEAFE' },
  sistema:              { icon: '⚙️', color: '#64748B', bg: '#F1F5F9' },
};

function tiempoRelativo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  const hs   = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);
  if (mins < 1)  return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} min`;
  if (hs < 24)   return `Hace ${hs} h`;
  if (dias < 7)  return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
  return new Date(fecha).toLocaleDateString('es-UY');
}

export default function NotificationsPage() {
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const [notifs, setNotifs]       = useState<Notificacion[]>([]);
  const [loading, setLoading]     = useState(true);
  const [marking, setMarking]     = useState(false);
  const [filtro, setFiltro]       = useState<'todas' | 'sin_leer'>('todas');

  useEffect(() => {
    notificationsApi.getAll()
      .then(({ data }) => setNotifs(data))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleMarcarTodas = async () => {
    setMarking(true);
    try {
      await notificationsApi.markAllRead();
      setNotifs(ns => ns.map(n => ({ ...n, leido: true })));
    } finally {
      setMarking(false);
    }
  };

  const filtered = filtro === 'sin_leer'
    ? notifs.filter(n => !n.leido)
    : notifs;

  const sinLeer = notifs.filter(n => !n.leido).length;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 760 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>
            Notificaciones
            {sinLeer > 0 && (
              <span style={{
                marginLeft: 10, fontSize: 13, fontWeight: 600,
                background: '#FEF3C7', color: '#D97706',
                padding: '2px 10px', borderRadius: 20, verticalAlign: 'middle',
              }}>
                {sinLeer} sin leer
              </span>
            )}
          </h1>
          <p style={{ color: theme.textSecondary, fontSize: 14 }}>
            {notifs.length} notificación{notifs.length !== 1 ? 'es' : ''} en total
          </p>
        </div>
        {sinLeer > 0 && (
          <button
            onClick={handleMarcarTodas}
            disabled={marking}
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: `1px solid ${theme.cardBorder}`,
              background: theme.cardBg, color: theme.textSecondary,
              fontSize: 13, cursor: 'pointer', opacity: marking ? 0.6 : 1,
            }}
          >
            {marking ? 'Marcando...' : '✓ Marcar todas como leídas'}
          </button>
        )}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['todas', 'sin_leer'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: '6px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', border: 'none',
              background: filtro === f ? theme.accent : theme.cardBg,
              color: filtro === f ? '#fff' : theme.textSecondary,
              boxShadow: filtro === f ? 'none' : `0 0 0 1px ${theme.cardBorder}`,
            }}
          >
            {f === 'todas' ? 'Todas' : `Sin leer ${sinLeer > 0 ? `(${sinLeer})` : ''}`}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', color: theme.textMuted, padding: 48 }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 56,
          background: theme.cardBg, borderRadius: 12,
          boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}`,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
          <div style={{ color: theme.textSecondary, fontSize: 14 }}>
            {filtro === 'sin_leer' ? 'No tenés notificaciones sin leer' : 'No hay notificaciones'}
          </div>
        </div>
      ) : (
        <div style={{
          background: theme.cardBg, borderRadius: 12,
          boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}`,
          overflow: 'hidden',
        }}>
          {filtered.map((n, i) => {
            const cfg = TIPO_CONFIG[n.tipo] ?? TIPO_CONFIG.sistema;
            return (
              <div
                key={n.id}
                style={{
                  display: 'flex', gap: 14, padding: '16px 20px',
                  borderBottom: i < filtered.length - 1 ? `1px solid ${theme.tableBorder}` : 'none',
                  background: n.leido ? 'transparent' : theme.accentLight + '33',
                  transition: 'background 0.15s',
                  cursor: n.referenciaId ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (n.referenciaTipo === 'client' && n.referenciaId) {
                    navigate(`/clients/${n.referenciaId}`);
                  }
                }}
              >
                {/* Icono */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: cfg.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {cfg.icon}
                </div>

                {/* Contenido */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 14, color: theme.textPrimary,
                    fontWeight: n.leido ? 400 : 600,
                    lineHeight: 1.4, marginBottom: 4,
                  }}>
                    {n.mensaje}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 500,
                      color: cfg.color, background: cfg.bg,
                      padding: '2px 8px', borderRadius: 4,
                    }}>
                      {n.tipo.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: 12, color: theme.textMuted }}>
                      {tiempoRelativo(n.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Punto sin leer */}
                {!n.leido && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: theme.accent, flexShrink: 0, marginTop: 6,
                  }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
