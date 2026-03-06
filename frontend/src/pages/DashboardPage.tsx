import { useEffect, useState } from 'react';
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
      </div>
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
