import { useEffect, useState } from 'react';
<<<<<<< HEAD
import { useAuthStore } from '../store/auth.store';
import { clientsApi } from '../services/api';
import { calendarApi } from '../services/api';
import { feesApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  const [stats, setStats] = useState({ clientes: 0, proximos: 0, vencidos: 0, honorariosPendientes: 0 });
  const [proximos, setProximos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      clientsApi.getAll(),
      calendarApi.getProximos(),
      feesApi.resumen(),
    ]).then(([clientesRes, calendarRes, feesRes]) => {
      const clientes = clientesRes.status === 'fulfilled' ? clientesRes.value.data : [];
      const vencimientos = calendarRes.status === 'fulfilled' ? calendarRes.value.data : [];
      const resumen = feesRes.status === 'fulfilled' ? feesRes.value.data : {};

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const proxList = vencimientos.filter((v: any) => {
        const f = new Date(v.fecha);
        f.setHours(0, 0, 0, 0);
        return f >= hoy && v.estado === 'pendiente';
      });
      const vencidosList = vencimientos.filter((v: any) => {
        const f = new Date(v.fecha);
        f.setHours(0, 0, 0, 0);
        return f < hoy && v.estado === 'pendiente';
      });

      setStats({
        clientes: clientes.filter((c: any) => c.activo).length,
        proximos: proxList.length,
        vencidos: vencidosList.length,
        honorariosPendientes: resumen.pendientes ?? 0,
      });
      setProximos(proxList.slice(0, 8));
    }).finally(() => setLoading(false));
  }, []);

  const diffDias = (fecha: string) => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const f = new Date(fecha); f.setHours(0, 0, 0, 0);
    return Math.round((f.getTime() - hoy.getTime()) / 86400000);
  };

  const KPI = ({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: string }) => (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 46, height: 46, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{label}</div>
=======
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { clientsApi, calendarApi, feesApi, notificationsApi } from '../services/api';

interface KPIs {
  clientesActivos: number;
  clientesTotal: number;
  vencimientosProximos: number;
  vencimientosVencidos: number;
  honorariosPendientes: number;
  honorariosAlDia: number;
}

interface VencimientoProximo {
  clienteNombre: string;
  tipo: string;
  fecha: string;
  estado: string;
  clienteId: string;
}

const KPICard = ({ label, value, sub, color, icon }: { label: string; value: number | string; sub?: string; color: string; icon: React.ReactNode }) => (
  <div style={{
    background: '#fff', borderRadius: 12, padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    display: 'flex', alignItems: 'center', gap: 16,
    borderLeft: `4px solid ${color}`,
  }}>
    <div style={{
      width: 46, height: 46, borderRadius: 10,
      background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color, flexShrink: 0,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [proximos, setProximos] = useState<VencimientoProximo[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      clientsApi.getAll(),
      calendarApi.getProximos(),
      feesApi.resumen(),
      notificationsApi.unreadCount(),
    ]).then(([clients, venc, fees, notif]) => {
      const cs = clients.data;
      setKpis({
        clientesActivos: cs.filter((c: any) => c.estado === 'activo').length,
        clientesTotal: cs.length,
        vencimientosProximos: venc.data.filter((v: any) => v.estado === 'pendiente' || v.estado === 'alertado').length,
        vencimientosVencidos: venc.data.filter((v: any) => v.estado === 'vencido').length,
        honorariosPendientes: fees.data?.pendientes ?? 0,
        honorariosAlDia: fees.data?.alDia ?? 0,
      });
      setProximos(venc.data.slice(0, 8));
      setUnread(notif.data?.count ?? 0);
    }).catch(() => {
      setKpis({ clientesActivos: 0, clientesTotal: 0, vencimientosProximos: 0, vencimientosVencidos: 0, honorariosPendientes: 0, honorariosAlDia: 0 });
    }).finally(() => setLoading(false));
  }, []);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
          {saludo}, {user?.nombre} 👋
        </h1>
        <p style={{ color: '#64748B', fontSize: 14 }}>
          {new Date().toLocaleDateString('es-UY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {unread > 0 && (
            <span style={{
              marginLeft: 12, padding: '2px 10px', borderRadius: 20,
              background: '#FEF3C7', color: '#D97706', fontSize: 12, fontWeight: 500,
            }}>
              🔔 {unread} notificación{unread !== 1 ? 'es' : ''} sin leer
            </span>
          )}
        </p>
>>>>>>> 6687074 (feat: panel contador completo - ClientsPage, ClientDetailPage, DashboardPage, CalendarPage, CredentialsPage)
      </div>

      {loading ? (
        <div style={{ color: '#94A3B8', fontSize: 14 }}>Cargando...</div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            <KPICard
              label="Clientes activos"
              value={kpis?.clientesActivos ?? 0}
              sub={`de ${kpis?.clientesTotal ?? 0} en total`}
              color="#6D28D9"
              icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            />
            <KPICard
              label="Vencimientos próximos"
              value={kpis?.vencimientosProximos ?? 0}
              sub="pendientes o por vencer"
              color="#0EA5E9"
              icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            />
            <KPICard
              label="Vencimientos vencidos"
              value={kpis?.vencimientosVencidos ?? 0}
              sub="requieren atención"
              color="#DC2626"
              icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
            />
            <KPICard
              label="Honorarios pendientes"
              value={kpis?.honorariosPendientes ?? 0}
              sub="sin cobrar"
              color="#D97706"
              icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            />
          </div>

          {/* Vencimientos próximos */}
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
              <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
                ✅ No hay vencimientos próximos
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Cliente', 'Obligación', 'Vence', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proximos.map((v: any, i) => {
                    const estadoColors: any = {
                      pendiente: { bg: '#FEF3C7', color: '#D97706' },
                      alertado: { bg: '#FEE2E2', color: '#DC2626' },
                      vencido: { bg: '#FEE2E2', color: '#DC2626' },
                      completado: { bg: '#DCFCE7', color: '#15803D' },
                    };
                    const c = estadoColors[v.estado] ?? estadoColors.pendiente;
                    const diasRestantes = Math.ceil((new Date(v.fechaVencimiento).getTime() - Date.now()) / 86400000);
                    return (
                      <tr
                        key={i}
                        style={{ borderTop: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => v.clienteId && navigate(`/clients/${v.clienteId}`)}
                      >
                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#0F172A', fontWeight: 500 }}>
                          {v.clienteNombre ?? v.client?.nombre ?? '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>
                          {v.tipo?.replace(/_/g, ' ').toUpperCase()}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#0F172A' }}>
                          {new Date(v.fechaVencimiento).toLocaleDateString('es-UY')}
                          {diasRestantes >= 0 && diasRestantes <= 7 && (
                            <span style={{ marginLeft: 6, fontSize: 11, color: '#DC2626', fontWeight: 600 }}>
                              ({diasRestantes === 0 ? 'hoy' : `${diasRestantes}d`})
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: c.bg, color: c.color }}>
                            {v.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Accesos rápidos */}
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { label: '👥 Gestionar clientes', to: '/clients', color: '#6D28D9' },
              { label: '📅 Ver calendario', to: '/calendar', color: '#0EA5E9' },
            ].map(({ label, to, color }) => (
              <button key={to} onClick={() => navigate(to)} style={{
                padding: '14px', borderRadius: 10, border: `1px solid ${color}20`,
                background: color + '08', color, fontSize: 14, fontWeight: 500,
                cursor: 'pointer', textAlign: 'left',
              }}>{label}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
        {saludo}, {user?.nombre} 👋
      </h1>
      <p style={{ color: '#64748B', fontSize: 14, marginBottom: 28 }}>
        Resumen de tu cartera de clientes
      </p>

      {loading ? (
        <div style={{ color: '#94A3B8', fontSize: 14 }}>Cargando...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            <KPI label="Clientes activos"       value={stats.clientes}              color="#0EA5E9" icon="👥" />
            <KPI label="Vencimientos próximos"  value={stats.proximos}              color="#8B5CF6" icon="📅" />
            <KPI label="Vencidos sin completar" value={stats.vencidos}              color="#EF4444" icon="⚠️" />
            <KPI label="Honorarios pendientes"  value={stats.honorariosPendientes}  color="#F59E0B" icon="💰" />
          </div>

          {proximos.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Próximos vencimientos</h2>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Cliente', 'Tributo', 'Fecha', 'Días'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proximos.map((v: any, i: number) => {
                    const dias = diffDias(v.fecha);
                    return (
                      <tr key={v.id} onClick={() => navigate(`/clients/${v.clienteId}`)}
                        style={{ borderTop: '1px solid #F1F5F9', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#0F172A', fontWeight: 500 }}>{v.cliente?.nombre ?? '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{v.tributo}</td>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{new Date(v.fecha).toLocaleDateString('es-UY')}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                            background: dias <= 3 ? '#FEE2E2' : dias <= 7 ? '#FEF3C7' : '#DCFCE7',
                            color: dias <= 3 ? '#DC2626' : dias <= 7 ? '#D97706' : '#16A34A',
                          }}>
                            {dias === 0 ? 'Hoy' : `${dias}d`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { to: '/clients', label: 'Ir a Clientes', icon: '👥', desc: 'Gestionar tu cartera' },
              { to: '/calendar', label: 'Ver Vencimientos', icon: '📅', desc: 'Calendario completo' },
            ].map(item => (
              <div key={item.to} onClick={() => navigate(item.to)}
                style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.07)')}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: '#94A3B8' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
