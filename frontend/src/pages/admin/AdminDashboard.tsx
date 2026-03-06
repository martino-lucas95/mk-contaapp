import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface StatsData {
  totalContadores: number;
  contadoresActivos: number;
  totalClientes: number;
}

const StatCard = ({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: React.ReactNode }) => (
  <div style={{
    background: '#fff', borderRadius: 12, padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 16,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 10,
      background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users').then(({ data }) => {
      const contadores = data.filter((u: any) => u.role === 'contador');
      setStats({
        totalContadores: contadores.length,
        contadoresActivos: contadores.filter((u: any) => u.activo).length,
        totalClientes: data.filter((u: any) => u.role === 'cliente').length,
      });
    }).catch(() => setStats({ totalContadores: 0, contadoresActivos: 0, totalClientes: 0 }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Panel de Administración</h1>
      <p style={{ color: '#64748B', fontSize: 14, marginBottom: 28 }}>Gestión de usuarios del sistema</p>

      {loading ? (
        <div style={{ color: '#94A3B8', fontSize: 14 }}>Cargando...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          <StatCard
            label="Total contadores"
            value={stats?.totalContadores ?? 0}
            color="#6D28D9"
            icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          />
          <StatCard
            label="Contadores activos"
            value={stats?.contadoresActivos ?? 0}
            color="#059669"
            icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          />
          <StatCard
            label="Clientes registrados"
            value={stats?.totalClientes ?? 0}
            color="#0EA5E9"
            icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          />
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 12 }}>Accesos rápidos</h2>
        <Link to="/admin/contadores" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '9px 18px', borderRadius: 8,
          background: '#6D28D9', color: '#fff', textDecoration: 'none',
          fontSize: 14, fontWeight: 500,
        }}>
          Gestionar contadores →
        </Link>
      </div>
    </div>
  );
}
