import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalContadores: 0, contadoresActivos: 0, totalClientes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users').then(({ data }) => {
      const contadores = data.filter((u: any) => u.role === 'contador');
      setStats({
        totalContadores: contadores.length,
        contadoresActivos: contadores.filter((u: any) => u.activo).length,
        totalClientes: data.filter((u: any) => u.role === 'cliente').length,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total contadores',    value: stats.totalContadores,    color: '#6D28D9', bg: '#EDE9FE' },
    { label: 'Contadores activos',  value: stats.contadoresActivos,  color: '#059669', bg: '#DCFCE7' },
    { label: 'Clientes registrados',value: stats.totalClientes,      color: '#0EA5E9', bg: '#E0F2FE' },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Panel de Administración</h1>
      <p style={{ color: '#64748B', fontSize: 14, marginBottom: 28 }}>Gestión de usuarios del sistema</p>
      {loading ? <p style={{ color: '#94A3B8' }}>Cargando...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
          {cards.map(c => (
            <div key={c.label} style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, fontSize: 20, fontWeight: 700 }}>{c.value}</div>
              <div style={{ fontSize: 13, color: '#64748B' }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 12 }}>Accesos rápidos</h2>
        <Link to="/admin/contadores" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 8, background: '#6D28D9', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
          Gestionar contadores →
        </Link>
      </div>
    </div>
  );
}
