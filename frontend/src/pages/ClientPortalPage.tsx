import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';
import api from '../services/api';
import { Vencimiento, EstadoVencimiento, Honorario, EstadoHonorario } from '../types';

const ESTADO_VENC: Record<EstadoVencimiento, { bg: string; color: string; label: string }> = {
  pendiente:  { bg: '#FEF3C7', color: '#D97706', label: 'Pendiente' },
  alertado:   { bg: '#FEE2E2', color: '#DC2626', label: 'Por vencer' },
  vencido:    { bg: '#FEE2E2', color: '#DC2626', label: 'Vencido' },
  completado: { bg: '#DCFCE7', color: '#15803D', label: 'Completado' },
};

const ESTADO_HON: Record<EstadoHonorario, { bg: string; color: string; label: string }> = {
  al_dia:    { bg: '#DCFCE7', color: '#15803D', label: 'Al día' },
  pendiente: { bg: '#FEF3C7', color: '#D97706', label: 'Pendiente' },
  vencido:   { bg: '#FEE2E2', color: '#DC2626', label: 'Vencido' },
};

export default function ClientPortalPage() {
  const { theme } = useThemeStore();
  const user = useAuthStore(s => s.user);
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([]);
  const [honorarios, setHonorarios]     = useState<Honorario[]>([]);
  const [loading, setLoading]           = useState(true);
  const [clientId, setClientId]         = useState<string | null>(null);

  useEffect(() => {
    // Para el rol cliente, el backend debería devolver el cliente asociado al usuario
    api.get('/clients/me')
      .then(({ data }) => {
        setClientId(data.id);
        return Promise.all([
          api.get(`/calendar/client/${data.id}`),
          api.get(`/fees/client/${data.id}`),
        ]);
      })
      .then(([v, h]) => {
        setVencimientos(v.data);
        setHonorarios(h.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const proximos = vencimientos
    .filter(v => v.estado !== 'completado')
    .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())
    .slice(0, 8);

  const honPendientes = honorarios.filter(h => h.estado !== 'al_dia');
  const totalDeuda    = honPendientes.reduce((s, h) => s + (Number(h.montoAcordado) - Number(h.montoCobrado)), 0);

  const fmt = (n: number) => `$${n.toLocaleString('es-UY')}`;

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: theme.textMuted }}>Cargando...</div>;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>
      {/* Saludo */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>
          Hola, {user?.nombre} 👋
        </h1>
        <p style={{ color: theme.textSecondary, fontSize: 14 }}>
          Este es tu portal de seguimiento contable. Acá podés ver tus vencimientos y el estado de tus honorarios.
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          {
            icon: '📅',
            label: 'Vencimientos próximos',
            value: vencimientos.filter(v => v.estado === 'alertado' || v.estado === 'pendiente').length,
            color: '#D97706', bg: '#FEF3C7',
          },
          {
            icon: '⚠️',
            label: 'Vencidos',
            value: vencimientos.filter(v => v.estado === 'vencido').length,
            color: '#DC2626', bg: '#FEE2E2',
          },
          {
            icon: '💰',
            label: 'Honorarios pendientes',
            value: fmt(totalDeuda),
            color: honPendientes.length > 0 ? '#D97706' : '#15803D',
            bg: honPendientes.length > 0 ? '#FEF3C7' : '#DCFCE7',
          },
        ].map(({ icon, label, value, color, bg }) => (
          <div key={label} style={{ background: theme.cardBg, borderRadius: 12, padding: '20px', boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}` }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Vencimientos próximos */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, marginBottom: 14 }}>
          📅 Próximos vencimientos
        </h2>
        {proximos.length === 0 ? (
          <div style={{ background: theme.cardBg, borderRadius: 12, padding: 32, textAlign: 'center', border: `1px solid ${theme.cardBorder}` }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
            <div style={{ color: theme.textSecondary, fontSize: 14 }}>No tenés vencimientos pendientes</div>
          </div>
        ) : (
          <div style={{ background: theme.cardBg, borderRadius: 12, boxShadow: theme.cardShadow, overflow: 'hidden', border: `1px solid ${theme.cardBorder}` }}>
            {proximos.map((v, i) => {
              const sc = ESTADO_VENC[v.estado];
              const dias = Math.ceil((new Date(v.fechaVencimiento).getTime() - Date.now()) / 86400000);
              return (
                <div key={v.id} style={{
                  display: 'flex', alignItems: 'center', padding: '14px 20px', gap: 16,
                  borderBottom: i < proximos.length - 1 ? `1px solid ${theme.tableBorder}` : 'none',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: theme.textPrimary }}>
                      {v.tipo.replace(/_/g, ' ').toUpperCase()}
                      {v.periodo && <span style={{ fontSize: 12, color: theme.textMuted, marginLeft: 6 }}>({v.periodo})</span>}
                    </div>
                    <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                      Vence el {new Date(v.fechaVencimiento).toLocaleDateString('es-UY')}
                    </div>
                  </div>
                  {dias >= 0 && dias <= 7 && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>
                      {dias === 0 ? '¡Hoy!' : `${dias}d`}
                    </span>
                  )}
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Honorarios */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, marginBottom: 14 }}>
          💰 Honorarios
        </h2>
        {honorarios.length === 0 ? (
          <div style={{ background: theme.cardBg, borderRadius: 12, padding: 32, textAlign: 'center', border: `1px solid ${theme.cardBorder}` }}>
            <div style={{ color: theme.textSecondary, fontSize: 14 }}>No hay honorarios registrados</div>
          </div>
        ) : (
          <div style={{ background: theme.cardBg, borderRadius: 12, boxShadow: theme.cardShadow, overflow: 'hidden', border: `1px solid ${theme.cardBorder}` }}>
            {honorarios.slice(0, 6).map((h, i) => {
              const sc = ESTADO_HON[h.estado];
              const pendiente = Number(h.montoAcordado) - Number(h.montoCobrado);
              return (
                <div key={h.id} style={{
                  display: 'flex', alignItems: 'center', padding: '14px 20px', gap: 16,
                  borderBottom: i < Math.min(honorarios.length, 6) - 1 ? `1px solid ${theme.tableBorder}` : 'none',
                }}>
                  <div style={{ minWidth: 80 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: theme.textPrimary }}>{h.periodo}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: theme.textSecondary }}>
                      Acordado: <strong style={{ color: theme.textPrimary }}>{fmt(Number(h.montoAcordado))}</strong>
                      {Number(h.montoCobrado) > 0 && (
                        <span style={{ marginLeft: 8, color: '#15803D' }}>Cobrado: {fmt(Number(h.montoCobrado))}</span>
                      )}
                    </div>
                  </div>
                  {pendiente > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#D97706' }}>
                      Debe: {fmt(pendiente)}
                    </span>
                  )}
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
