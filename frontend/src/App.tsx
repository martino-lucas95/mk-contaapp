import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import Layout from './components/Layout';
import { ThemeSync } from './components/ThemeSync';

// Páginas admin
import AdminDashboard  from './pages/admin/AdminDashboard';
import ContadoresPage  from './pages/admin/ContadoresPage';

// Páginas contador
import DashboardPage     from './pages/DashboardPage';
import ClientsPage       from './pages/ClientsPage';
import ClientDetailPage  from './pages/ClientDetailPage';
import CalendarPage      from './pages/CalendarPage';
import CredentialsPage   from './pages/CredentialsPage';
import HonorariosPage    from './pages/HonorariosPage';
import NotificationsPage from './pages/NotificationsPage';
import MovimientosPage   from './pages/MovimientosPage';

// Portal cliente
import ClientPortalPage  from './pages/ClientPortalPage';

// Login
import LoginPage from './pages/LoginPage';

// ── Guards ────────────────────────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ── Root redirect por rol ─────────────────────────────────────────────────────
function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'cliente') return <Navigate to="/portal" replace />;
  return <Navigate to="/dashboard" replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <ThemeSync />
      <BrowserRouter>
      <Routes>
        {/* Público */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root → redirect por rol */}
        <Route path="/" element={<RootRedirect />} />

        {/* ── Admin ── */}
        <Route path="/admin" element={
          <RequireAuth><RequireRole role="admin">
            <Layout><AdminDashboard /></Layout>
          </RequireRole></RequireAuth>
        }/>
        <Route path="/admin/contadores" element={
          <RequireAuth><RequireRole role="admin">
            <Layout><ContadoresPage /></Layout>
          </RequireRole></RequireAuth>
        }/>

        {/* ── Contador ── */}
        <Route path="/dashboard" element={
          <RequireAuth>
            <Layout><DashboardPage /></Layout>
          </RequireAuth>
        }/>
        <Route path="/clients" element={
          <RequireAuth>
            <Layout><ClientsPage /></Layout>
          </RequireAuth>
        }/>
        <Route path="/clients/:id" element={
          <RequireAuth>
            <Layout><ClientDetailPage /></Layout>
          </RequireAuth>
        }/>
        <Route path="/calendar" element={
          <RequireAuth>
            <Layout><CalendarPage /></Layout>
          </RequireAuth>
        }/>
        <Route path="/credentials" element={
          <RequireAuth>
            <Layout><CredentialsPage /></Layout>
          </RequireAuth>
        }/>
        <Route path="/honorarios" element={
          <RequireAuth>
            <Layout><HonorariosPage /></Layout>
          </RequireAuth>
        }/>
        <Route path="/notifications" element={
          <RequireAuth>
            <Layout><NotificationsPage /></Layout>
          </RequireAuth>
        }/>
        <Route path="/movimientos" element={
          <RequireAuth>
            <Layout><MovimientosPage /></Layout>
          </RequireAuth>
        }/>

        {/* ── Portal cliente ── */}
        <Route path="/portal" element={
          <RequireAuth><RequireRole role="cliente">
            <Layout><ClientPortalPage /></Layout>
          </RequireRole></RequireAuth>
        }/>

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}
