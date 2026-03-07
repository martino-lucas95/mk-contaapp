import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore, THEMES, type ThemeId } from '@/store/theme.store';
import type { UserRole } from '@/types';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Key,
  DollarSign,
  Activity,
  Bell,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Palette,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

type NavItem = { to: string; label: string; icon: React.ReactNode; exact?: boolean };

const NAV_ADMIN: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="size-[18px]" />, exact: true },
  { to: '/admin/contadores', label: 'Contadores', icon: <Users className="size-[18px]" /> },
];

const NAV_CONTADOR: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-[18px]" />, exact: true },
  { to: '/clients', label: 'Clientes', icon: <Users className="size-[18px]" /> },
  { to: '/calendar', label: 'Vencimientos', icon: <Calendar className="size-[18px]" /> },
  { to: '/credentials', label: 'Credenciales', icon: <Key className="size-[18px]" /> },
  { to: '/honorarios', label: 'Honorarios', icon: <DollarSign className="size-[18px]" /> },
  { to: '/movimientos', label: 'Movimientos', icon: <Activity className="size-[18px]" /> },
  { to: '/notifications', label: 'Notificaciones', icon: <Bell className="size-[18px]" /> },
];

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  contador: 'Contador',
  cliente: 'Cliente',
};

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-sidebar-accent text-sidebar-foreground shadow-sm'
      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
  );

function ThemeSwitcher({ collapsed }: { collapsed: boolean }) {
  const { themeId, setTheme } = useThemeStore();
  const themeList = Object.values(THEMES);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            collapsed && 'justify-center px-0'
          )}
        >
          <Palette className="size-4 shrink-0" />
          {!collapsed && <span className="ml-2">Tema</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={collapsed ? 'start' : 'end'} side="top" className="w-48">
        {themeList.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id as ThemeId)}
            className={themeId === t.id ? 'bg-accent' : ''}
          >
            <span className="mr-2">{t.emoji}</span>
            {t.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BottomNav({ navItems }: { navItems: NavItem[] }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-sidebar-border/50 bg-sidebar/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.exact}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
            )
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function MobileHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-sidebar-border/50 bg-sidebar/85 backdrop-blur-xl px-4 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-xs shadow-sm">
          C
        </div>
        <span className="font-bold text-sidebar-foreground">ContaApp</span>
      </div>
      <Button variant="ghost" size="icon" onClick={onMenuOpen} className="text-sidebar-foreground hover:bg-sidebar-accent/50">
        <Menu className="size-5" />
      </Button>
    </header>
  );
}

function MobileDrawer({
  open,
  onClose,
  navItems,
  user,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
  user: { nombre: string; apellido: string; role: UserRole };
  onLogout: () => void;
}) {
  const { themeId, setTheme } = useThemeStore();
  const themeList = Object.values(THEMES);
  const initials = `${user.nombre[0]}${user.apellido[0]}`.toUpperCase();

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="w-[280px] border-r bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-sidebar-border p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-xs">
              C
            </div>
            <SheetTitle className="font-bold text-sidebar-foreground">ContaApp</SheetTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-sidebar-foreground/70">
            <X className="size-5" />
          </Button>
        </SheetHeader>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onClose}
              className={linkClass}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            Tema
          </div>
          <div className="flex gap-2">
            {themeList.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as ThemeId)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-lg border-2 px-2 py-2 text-lg transition-colors',
                  themeId === t.id
                    ? 'border-primary bg-primary/10'
                    : 'border-sidebar-border hover:border-sidebar-foreground/30'
                )}
              >
                {t.emoji}
                <span className="text-[10px] font-medium text-sidebar-foreground/80">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-sidebar-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="mb-2 flex items-center gap-3 rounded-lg bg-sidebar-accent/30 p-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-sidebar-accent font-bold text-sidebar-foreground text-xs">
              {initials}
            </div>
            <div>
              <div className="text-sm font-semibold text-sidebar-foreground">
                {user.nombre} {user.apellido}
              </div>
              <div className="text-xs text-sidebar-foreground/60">{ROLE_LABEL[user.role]}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={onLogout}
          >
            <LogOut className="mr-2 size-4" />
            Cerrar sesión
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!user) return null;

  const navItems = user.role === 'admin' ? NAV_ADMIN : NAV_CONTADOR;
  const initials = `${user.nombre[0]}${user.apellido[0]}`.toUpperCase();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MobileHeader onMenuOpen={() => setDrawerOpen(true)} />
        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          navItems={navItems}
          user={user}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto pt-14 pb-16 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
          {children}
        </main>
        <BottomNav navItems={navItems} />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          'flex shrink-0 flex-col border-r border-sidebar-border/50 bg-sidebar transition-[width] duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <div className="flex min-h-[60px] items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
                C
              </div>
              <span className="font-bold tracking-tight text-sidebar-foreground">ContaApp</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <ChevronLeft
              className={cn('size-4 transition-transform', collapsed && 'rotate-180')}
            />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              title={collapsed ? item.label : undefined}
              className={cn(
                linkClass,
                collapsed && 'justify-center px-2'
              )}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-2">
          {!collapsed && (
            <div className="mb-2 flex items-center gap-3 rounded-lg bg-sidebar-accent/30 p-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent font-bold text-sidebar-foreground text-xs">
                {initials}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="truncate text-xs font-semibold text-sidebar-foreground">
                  {user.nombre} {user.apellido}
                </div>
                <div className="text-[11px] text-sidebar-foreground/60">{ROLE_LABEL[user.role]}</div>
              </div>
            </div>
          )}
          <ThemeSwitcher collapsed={collapsed} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            title="Cerrar sesión"
            className={cn(
              'w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground',
              collapsed && 'justify-center px-0'
            )}
          >
            <LogOut className="size-4 shrink-0" />
            {!collapsed && <span className="ml-2">Cerrar sesión</span>}
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
