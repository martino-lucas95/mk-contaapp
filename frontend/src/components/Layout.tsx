import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore, THEMES, ThemeId } from '../store/theme.store';
import { UserRole } from '../types';

// ── Hook: detectar mobile ─────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const Icons = {
  dashboard:   <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  clients:     <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  calendar:    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  credentials: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  users:       <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout:      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevron:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
  palette:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20c-2.76 0-3-1.5-3-3 0-2 1-3 1-5s-1-3-1-5a5 5 0 0 1 3-7z"/></svg>,
  menu:        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close:         <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  notifications:  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  honorarios:     <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  movimientos:    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
};

const NAV_ADMIN    = [
  { to: '/admin',            label: 'Dashboard',   icon: Icons.dashboard,   exact: true },
  { to: '/admin/contadores', label: 'Contadores',  icon: Icons.users },
];
const NAV_CONTADOR = [
  { to: '/dashboard',      label: 'Dashboard',    icon: Icons.dashboard },
  { to: '/clients',        label: 'Clientes',     icon: Icons.clients },
  { to: '/calendar',       label: 'Vencimientos', icon: Icons.calendar },
  { to: '/credentials',    label: 'Credenciales', icon: Icons.credentials },
  { to: '/honorarios',     label: 'Honorarios',   icon: Icons.honorarios },
  { to: '/movimientos',    label: 'Movimientos',  icon: Icons.movimientos },
  { to: '/notifications',  label: 'Notificaciones', icon: Icons.notifications },
];

const ROLE_LABEL: Record<UserRole, string> = {
  admin:    'Administrador',
  contador: 'Contador',
  cliente:  'Cliente',
};

// ── Theme Switcher ─────────────────────────────────────────────────────────────
function ThemeSwitcher({ collapsed, sidebarText }: {
  collapsed: boolean;
  sidebarText: string;
}) {
  const { themeId, setTheme } = useThemeStore();
  const [open, setOpen] = useState(false);
  const themeList = Object.values(THEMES);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Cambiar tema"
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: collapsed ? '10px 0' : '8px 12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          width: '100%', borderRadius: 7,
          background: 'none', border: 'none', cursor: 'pointer',
          color: sidebarText, fontSize: 14, transition: 'all 0.15s', opacity: 0.7,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
      >
        <span style={{ flexShrink: 0 }}>{Icons.palette}</span>
        {!collapsed && <span>Tema</span>}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', bottom: '110%',
            left: collapsed ? '110%' : 0,
            width: 180, background: '#fff', borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0', overflow: 'hidden', zIndex: 999,
          }}>
            <div style={{ padding: '8px 12px 6px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Seleccionar tema
            </div>
            {themeList.map(t => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id as ThemeId); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 12px',
                  background: themeId === t.id ? '#f1f5f9' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, color: '#0f172a', fontWeight: themeId === t.id ? 600 : 400,
                }}
              >
                <span style={{ fontSize: 16 }}>{t.emoji}</span>
                <span>{t.label}</span>
                {themeId === t.id && (
                  <svg style={{ marginLeft: 'auto' }} width="14" height="14" fill="none" stroke="#2563eb" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Bottom Nav (mobile) ────────────────────────────────────────────────────────
function BottomNav({ navItems, theme }: { navItems: typeof NAV_CONTADOR; theme: any }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: theme.sidebarBg,
      borderTop: `1px solid ${theme.sidebarBorder}`,
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100,
    }}>
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.exact}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '10px 4px 8px',
            textDecoration: 'none',
            color: isActive ? theme.sidebarActive : theme.sidebarTextMuted,
            fontSize: 10, fontWeight: isActive ? 600 : 400,
            gap: 4,
            transition: 'color 0.15s',
          })}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

// ── Mobile Header ──────────────────────────────────────────────────────────────
function MobileHeader({ theme, onMenuOpen }: { theme: any; onMenuOpen: () => void }) {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 56,
      background: theme.sidebarBg,
      borderBottom: `1px solid ${theme.sidebarBorder}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px',
      zIndex: 100,
      paddingTop: 'env(safe-area-inset-top)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: theme.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 12, color: '#fff',
        }}>C</div>
        <span style={{ color: theme.sidebarText, fontWeight: 700, fontSize: 15 }}>ContaApp</span>
      </div>
      <button
        onClick={onMenuOpen}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: theme.sidebarText, padding: 6, display: 'flex', alignItems: 'center',
        }}
      >
        {Icons.menu}
      </button>
    </header>
  );
}

// ── Mobile Drawer (menú lateral completo) ─────────────────────────────────────
function MobileDrawer({ open, onClose, theme, navItems, user, onLogout }: {
  open: boolean; onClose: () => void; theme: any;
  navItems: typeof NAV_CONTADOR; user: any; onLogout: () => void;
}) {
  const { themeId, setTheme } = useThemeStore();
  const themeList = Object.values(THEMES);
  const initials = `${user.nombre[0]}${user.apellido[0]}`.toUpperCase();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 200, transition: 'opacity 0.2s',
        }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 280, background: theme.sidebarBg,
        zIndex: 201, display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.2)',
        paddingTop: 'env(safe-area-inset-top)',
      }}>
        {/* Header del drawer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 16px 12px',
          borderBottom: `1px solid ${theme.sidebarBorder}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, background: theme.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 12, color: '#fff',
            }}>C</div>
            <span style={{ color: theme.sidebarText, fontWeight: 700, fontSize: 15 }}>ContaApp</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.sidebarTextMuted, display: 'flex' }}>
            {Icons.close}
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 8, marginBottom: 2,
                textDecoration: 'none',
                color: isActive ? theme.sidebarActive : theme.sidebarTextMuted,
                background: isActive ? theme.sidebarActiveBg : 'transparent',
                fontWeight: isActive ? 600 : 400, fontSize: 15,
              })}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Temas */}
        <div style={{ padding: '8px 8px 4px', borderTop: `1px solid ${theme.sidebarBorder}` }}>
          <div style={{ padding: '6px 12px 8px', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Tema
          </div>
          <div style={{ display: 'flex', gap: 6, padding: '0 8px 12px' }}>
            {themeList.map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as ThemeId)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 8,
                  border: `2px solid ${themeId === t.id ? theme.accent : theme.cardBorder}`,
                  background: themeId === t.id ? theme.accentLight : 'transparent',
                  cursor: 'pointer', fontSize: 18, display: 'flex',
                  flexDirection: 'column', alignItems: 'center', gap: 3,
                }}
              >
                <span>{t.emoji}</span>
                <span style={{ fontSize: 10, color: theme.textSecondary, fontWeight: 500 }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User info + logout */}
        <div style={{ padding: '8px', borderTop: `1px solid ${theme.sidebarBorder}`, paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8,
            background: theme.sidebarUserBg, marginBottom: 6,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: theme.sidebarLogoBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: theme.sidebarText,
            }}>{initials}</div>
            <div>
              <div style={{ color: theme.sidebarText, fontSize: 13, fontWeight: 600 }}>
                {user.nombre} {user.apellido}
              </div>
              <div style={{ color: theme.sidebarTextMuted, fontSize: 11 }}>
                {ROLE_LABEL[user.role]}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 12px', borderRadius: 8,
              background: 'none', border: 'none', cursor: 'pointer',
              color: theme.sidebarTextMuted, fontSize: 14,
            }}
          >
            {Icons.logout}
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────────
export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!user) return null;

  const navItems = user.role === 'admin' ? NAV_ADMIN : NAV_CONTADOR;
  const initials = `${user.nombre[0]}${user.apellido[0]}`.toUpperCase();
  const handleLogout = () => { logout(); navigate('/login'); };
  const isLightTheme = theme.id === 'light';

  // ── MOBILE ────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh',
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
        background: theme.mainBg,
      }}>
        <MobileHeader theme={theme} onMenuOpen={() => setDrawerOpen(true)} />

        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          theme={theme}
          navItems={navItems}
          user={user}
          onLogout={handleLogout}
        />

        {/* Main content — con espacio para header y bottom nav */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          marginTop: 56,
          marginBottom: 64,
          background: theme.mainBg,
          color: theme.textPrimary,
          // Safe areas para notch y home indicator
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}>
          {children}
        </main>

        <BottomNav navItems={navItems} theme={theme} />
      </div>
    );
  }

  // ── DESKTOP ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      background: theme.mainBg,
    }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 224, flexShrink: 0,
        background: theme.sidebarBg,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        borderRight: `1px solid ${theme.sidebarBorder}`,
        boxShadow: isLightTheme ? '2px 0 8px rgba(0,0,0,0.04)' : 'none',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', minHeight: 60,
          padding: collapsed ? '0 16px' : '0 16px 0 18px',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: `1px solid ${theme.sidebarBorder}`,
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 7,
                background: isLightTheme ? theme.accent : theme.sidebarLogoBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 13,
                color: isLightTheme ? '#fff' : theme.sidebarText,
              }}>C</div>
              <span style={{ color: theme.sidebarText, fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>ContaApp</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: theme.sidebarTextMuted, padding: 4, display: 'flex',
              transform: collapsed ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.22s ease',
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
                color: isActive ? theme.sidebarActive : theme.sidebarTextMuted,
                background: isActive ? theme.sidebarActiveBg : 'transparent',
                fontWeight: isActive ? 600 : 400, fontSize: 14,
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              })}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '8px 8px 12px', borderTop: `1px solid ${theme.sidebarBorder}` }}>
          {!collapsed && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 7,
              background: theme.sidebarUserBg, marginBottom: 4,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: theme.sidebarLogoBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: theme.sidebarText,
              }}>{initials}</div>
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <div style={{ color: theme.sidebarText, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.nombre} {user.apellido}
                </div>
                <div style={{ color: theme.sidebarTextMuted, fontSize: 11 }}>{ROLE_LABEL[user.role]}</div>
              </div>
            </div>
          )}
          <ThemeSwitcher collapsed={collapsed} sidebarText={theme.sidebarText} />
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '10px 0' : '8px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              width: '100%', borderRadius: 7,
              background: 'none', border: 'none', cursor: 'pointer',
              color: theme.sidebarTextMuted, fontSize: 14,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = theme.sidebarText)}
            onMouseLeave={e => (e.currentTarget.style.color = theme.sidebarTextMuted)}
          >
            <span style={{ flexShrink: 0 }}>{Icons.logout}</span>
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{
        flex: 1, overflow: 'auto',
        background: theme.mainBg, color: theme.textPrimary,
      }}>
        {children}
      </main>
    </div>
  );
}
