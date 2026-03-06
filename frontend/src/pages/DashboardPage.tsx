import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { clientsApi, calendarApi, feesApi, notificationsApi } from '../services/api';

interface KPIs {
  clientesActivos: number;
  clientesTotal: number;
  vencimientosProximos: number;
  vencimientosVencidos: number;
  honorariosPendientes: number;
}

const KPICard = ({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color: string;
  icon: ReactNode;
}) => (
  <div
    style={{
      background: '#fff',
      borderRadius: 12,
      padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      borderLeft: `4px solid ${color}`,
    }}
  >
    <div
      style={{
        width: 46,
        height: 46,
        borderRadius: 10,
        background: color + '15',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [proximos, setProximos] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([clientsApi.getAll(), calendarApi.getProximos(), feesApi.resumen(), notificationsApi.unreadCount()])
      .then(([clients, venc, fees, notif]) => {
        const cs = clients.data ?? [];
        const vencimientos = venc.data ?? [];
        setKpis({
          clientesActivos: cs.filter((c: any) => c.estado === 'activo').length,
          clientesTotal: cs.length,
          vencimientosProximos: vencimientos.filter((v: any) => v.estado === 'pendiente' || v.estado === 'alertado').length,
          vencimientosVencidos: vencimientos.filter((v: any) => v.estado === 'vencido').length,
          honorariosPendientes: fees.data?.pendientes ?? 0,
        });
        setProximos(vencimientos.slice(0, 8));
        setUnread(notif.data?.count ?? 0);
      })
      .catch(() => {
        setKpis({
          clientesActivos: 0,
          clientesTotal: 0,
          vencimientosProximos: 0,
          vencimientosVencidos: 0,
          honorariosPendientes: 0,
        });
        setProximos([]);
        setUnread(0);
      })
      .finally(() => setLoading(false));
  }, []);

  const hora = new Date().getHours();
  let saludo = 'Buenas noches';
  if (hora < 12) saludo = 'Buenos días';
  else if (hora < 19) saludo = 'Buenas tardes';

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
          {saludo}, {user?.nombre ?? 'contador'} 👋
        </h1>
        <p style={{ color: '#64748B', fontSize: 14 }}>
          {new Date().toLocaleDateString('es-UY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {unread > 0 && (
            <span
              style={{
                marginLeft: 12,
                padding: '2px 10px',
                borderRadius: 20,
                background: '#FEF3C7',
                color: '#D97706',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              🔔 {unread} notificación{unread === 1 ? '' : 'es'} sin leer
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <div style={{ color: '#94A3B8', fontSize: 14 }}>Cargando...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            <KPICard
              label="Clientes activos"
              value={kpis?.clientesActivos ?? 0}
              sub={`de ${kpis?.clientesTotal ?? 0} en total`}
              color="#6D28D9"
              icon={
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
            <KPICard
              label="Vencimientos próximos"
              value={kpis?.vencimientosProximos ?? 0}
              sub="pendientes o por vencer"
              color="#0EA5E9"
              icon={
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
            />
            <KPICard
              label="Vencimientos vencidos"
              value={kpis?.vencimientosVencidos ?? 0}
              sub="requieren atención"
              color="#DC2626"
              icon={
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              }
            />
            <KPICard
              label="Honorarios pendientes"
              value={kpis?.honorariosPendientes ?? 0}
              sub="sin cobrar"
              color="#D97706"
              icon={
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
            />
          </div>

          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Vencimientos próximos</h2>
              <button
                onClick={() => navigate('/calendar')}
                style={{ background: 'none', border: 'none', color: '#6D28D9', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
              >
                Ver todos →
              </button>
            </div>
            {proximos.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>No hay vencimientos próximos</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Cliente', 'Obligación', 'Vence', 'Estado'].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proximos.map((v: any) => (
                    <tr
                      key={v.id ?? `${v.clienteId ?? 'no-client'}-${v.tipo ?? 'sin-tipo'}-${v.fechaVencimiento ?? 'sin-fecha'}`}
                      style={{ borderTop: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => v.clienteId && navigate(`/clients/${v.clienteId}`)}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#0F172A', fontWeight: 500 }}>{v.clienteNombre ?? v.client?.nombre ?? '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{v.tipo?.replaceAll('_', ' ').toUpperCase()}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#0F172A' }}>{new Date(v.fechaVencimiento).toLocaleDateString('es-UY')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: '#FEF3C7', color: '#D97706' }}>{v.estado ?? 'pendiente'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
