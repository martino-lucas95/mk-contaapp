import { useAuthStore } from '../store/auth.store';
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  return (
    <div style={{ padding: '28px 32px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
        Bienvenido, {user?.nombre}
      </h1>
      <p style={{ color: '#64748B', fontSize: 14, marginBottom: 28 }}>Panel del contador</p>
      <div style={{ background: '#fff', borderRadius: 12, padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', textAlign: 'center', color: '#94A3B8' }}>
        🚧 Dashboard completo próximamente
      </div>
    </div>
  );
}
