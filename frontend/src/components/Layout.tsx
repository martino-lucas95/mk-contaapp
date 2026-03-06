import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { UserRole } from '../types';

const Icons = {
  dashboard: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  clients:   <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  calendar:  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  credentials: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  users:     <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout:    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevron:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
};

const NAV_ADMIN    = [
  { to: '/admin',            label: 'Dashboard',   icon: Icons.dashboard, exact: true },
  { to: '/admin/contadores', label: 'Contadores',  icon: Icons.users },
];
const NAV_CONTADOR = [
  { to: '/dashboard',   label: 'Dashboard',    icon: Icons.dashboard, exact: true },
  { to: '/clients',     label: 'Clientes',     icon: Icons.clients },
  { to: '/calendar',   label: 'Vencimientos', icon: Icons.calendar },
  { to: '/credentials', label: 'Credenciales', icon: Icons.credentials },
];

const ROLE_COLOR: Record<UserRole, string> = {
  admin:    '#6D28D9',
  contador: '#1e4976',
  cliente:  '#065F46',
};
const ROLE_LABEL: Record<UserRole, string> = {
  admin:    'Administrador',
  contador: 'Contador',
  cliente:  'Cliente',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const navItems    = user.role === 'admin' ? NAV_ADMIN : NAV_CONTADOR;
  const accent      = ROLE_COLOR[user.role];
  const initials    = `${user.nombre[0]}${user.apellido[0]}`.toUpperCase();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside style={{
        width: collapsed ? 64 : 224, flexShrink: 0,
        background: accent, display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s ease', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', minHeight: 60,
          padding: collapsed ? '0 16px' : '0 16px 0 18px',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 13, color: '#fff',
              }}>C</div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>ContaApp</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expandir' : 'Colapsar'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)', padding: 4, display: 'flex',
              transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
            }}
          >
            {Icons.chevron}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              title={collapsed ? item.label : undefined}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 11,
                padding: collapsed ? '10px 0' : '9px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 7, marginBottom: 2, textDecoration: 'none',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.62)',
                background: isActive ? 'rgba(255,255,255,0.16)' : 'transparent',
                fontWeight: isActive ? 600 : 400, fontSize: 14,
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              })}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer usuario */}
        <div style={{ padding: '8px 8px 12px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          {!collapsed && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.1)',
              marginBottom: 6,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
              }}>{initials}</div>
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.nombre} {user.apellido}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>
                  {ROLE_LABEL[user.role]}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '10px 0' : '8px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              width: '100%', borderRadius: 7,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.62)', fontSize: 14, transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <span style={{ flexShrink: 0 }}>{Icons.logout}</span>
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflow: 'auto', background: '#F1F5F9' }}>
        {children}
      </main>
    </div>
  );
}
