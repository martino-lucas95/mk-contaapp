import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import Layout from './components/Layout';
import AdminDashboard  from './pages/admin/AdminDashboard';
import ContadoresPage  from './pages/admin/ContadoresPage';
import DashboardPage     from './pages/DashboardPage';
import ClientsPage       from './pages/ClientsPage';
import ClientDetailPage  from './pages/ClientDetailPage';
import CalendarPage      from './pages/CalendarPage';
import CredentialsPage   from './pages/CredentialsPage';
import LoginPage from './pages/LoginPage';

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
function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RootRedirect />} />
        <Route path="/admin" element={<RequireAuth><RequireRole role="admin"><Layout><AdminDashboard /></Layout></RequireRole></RequireAuth>}/>
        <Route path="/admin/contadores" element={<RequireAuth><RequireRole role="admin"><Layout><ContadoresPage /></Layout></RequireRole></RequireAuth>}/>
        <Route path="/dashboard" element={<RequireAuth><Layout><DashboardPage /></Layout></RequireAuth>}/>
        <Route path="/clients" element={<RequireAuth><Layout><ClientsPage /></Layout></RequireAuth>}/>
        <Route path="/clients/:id" element={<RequireAuth><Layout><ClientDetailPage /></Layout></RequireAuth>}/>
        <Route path="/calendar" element={<RequireAuth><Layout><CalendarPage /></Layout></RequireAuth>}/>
        <Route path="/credentials/:clientId" element={<RequireAuth><Layout><CredentialsPage /></Layout></RequireAuth>}/>
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
