import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { clientsApi, calendarApi, feesApi, notificationsApi } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import { StatCard, StatsGrid } from '@/components/StatsGrid';
import { DataCard } from '@/components/DataCard';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Calendar, AlertCircle, DollarSign } from 'lucide-react';

interface KPIs {
  clientesActivos: number;
  clientesTotal: number;
  vencimientosProximos: number;
  vencimientosVencidos: number;
  honorariosPendientes: number;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [proximos, setProximos] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      clientsApi.getAll(),
      calendarApi.getProximos(),
      feesApi.resumen(),
      notificationsApi.unreadCount(),
    ])
      .then(([clients, venc, fees, notif]) => {
        const cs = clients.data ?? [];
        const vencimientos = venc.data ?? [];
        setKpis({
          clientesActivos: cs.filter((c: any) => c.estado === 'activo').length,
          clientesTotal: cs.length,
          vencimientosProximos: vencimientos.filter(
            (v: any) => v.estado === 'pendiente' || v.estado === 'alertado'
          ).length,
          vencimientosVencidos: vencimientos.filter((v: any) => v.estado === 'vencido').length,
          honorariosPendientes: fees.data?.pendientes ?? 0,
        });
        setProximos(vencimientos.slice(0, 8));
        setUnread(notif.data?.count ?? 0);
      })
      .catch(() => {
        setKpis({
          clientesActivos: 0,
          clientesTotal: 0,
          vencimientosProximos: 0,
          vencimientosVencidos: 0,
          honorariosPendientes: 0,
        });
        setProximos([]);
        setUnread(0);
      })
      .finally(() => setLoading(false));
  }, []);

  const hora = new Date().getHours();
  let saludo = 'Buenas noches';
  if (hora < 12) saludo = 'Buenos días';
  else if (hora < 19) saludo = 'Buenas tardes';

  const description = (
    <>
      {new Date().toLocaleDateString('es-UY', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
      {unread > 0 && (
        <Badge variant="secondary" className="ml-3 bg-amber-100 text-amber-700 hover:bg-amber-100">
          🔔 {unread} notificación{unread === 1 ? '' : 'es'} sin leer
        </Badge>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title={`${saludo}, ${user?.nombre ?? 'contador'} 👋`}
        description={description}
      />

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <StatsGrid columns={4} className="mb-6">
            <StatCard
              label="Clientes activos"
              value={kpis?.clientesActivos ?? 0}
              sub={`de ${kpis?.clientesTotal ?? 0} en total`}
              color="primary"
              icon={<Users className="size-5" />}
            />
            <StatCard
              label="Vencimientos próximos"
              value={kpis?.vencimientosProximos ?? 0}
              sub="pendientes o por vencer"
              color="blue"
              icon={<Calendar className="size-5" />}
            />
            <StatCard
              label="Vencimientos vencidos"
              value={kpis?.vencimientosVencidos ?? 0}
              sub="requieren atención"
              color="red"
              icon={<AlertCircle className="size-5" />}
            />
            <StatCard
              label="Honorarios pendientes"
              value={kpis?.honorariosPendientes ?? 0}
              sub="sin cobrar"
              color="amber"
              icon={<DollarSign className="size-5" />}
            />
          </StatsGrid>

          <DataCard
            title="Vencimientos próximos"
            action={
              <Button variant="link" className="h-auto p-0 text-primary" onClick={() => navigate('/calendar')}>
                Ver todos →
              </Button>
            }
          >
            {proximos.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay vencimientos próximos
              </p>
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Obligación</TableHead>
                        <TableHead>Vence</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proximos.map((v: any) => (
                        <TableRow
                          key={v.id ?? `${v.clienteId}-${v.tipo}-${v.fechaVencimiento}`}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => v.clienteId && navigate(`/clients/${v.clienteId}`)}
                        >
                          <TableCell className="font-medium">
                            {v.clienteNombre ?? v.client?.nombre ?? '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {v.tipo?.replaceAll('_', ' ').toUpperCase()}
                          </TableCell>
                          <TableCell>
                            {new Date(v.fechaVencimiento).toLocaleDateString('es-UY')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                              {v.estado ?? 'pendiente'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="md:hidden space-y-0 divide-y">
                  {proximos.map((v: any) => (
                    <div
                      key={v.id ?? `${v.clienteId}-${v.tipo}-${v.fechaVencimiento}`}
                      className="flex cursor-pointer items-center justify-between gap-3 px-1 py-3 hover:bg-muted/50"
                      onClick={() => v.clienteId && navigate(`/clients/${v.clienteId}`)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {v.clienteNombre ?? v.client?.nombre ?? '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {v.tipo?.replaceAll('_', ' ').toUpperCase()} ·{' '}
                          {new Date(v.fechaVencimiento).toLocaleDateString('es-UY')}
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0 bg-amber-100 text-amber-700">
                        {v.estado ?? 'pendiente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </DataCard>
        </>
      )}
    </div>
  );
}
