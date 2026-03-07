import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clientsApi, feesApi } from '../services/api';
import { useThemeStore } from '../store/theme.store';
import { Client, Honorario, EstadoHonorario } from '../types';

type HonConCliente = Honorario & { clienteNombre?: string; clienteId?: string };

const ESTADO_CONFIG: Record<EstadoHonorario, { bg: string; color: string; label: string }> = {
  al_dia:    { bg: '#DCFCE7', color: '#15803D', label: 'Al día' },
  pendiente: { bg: '#FEF3C7', color: '#D97706', label: 'Pendiente' },
  vencido:   { bg: '#FEE2E2', color: '#DC2626', label: 'Vencido' },
};

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function HonorariosPage() {
  const { theme } = useThemeStore();
  const [honorarios, setHonorarios] = useState<HonConCliente[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<EstadoHonorario | 'todos'>('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');

  useEffect(() => {
    clientsApi.getAll().then(async ({ data: clients }) => {
      const all: HonConCliente[] = [];
      await Promise.all(clients.map(async (c: Client) => {
        try {
          const { data } = await feesApi.getByClient(c.id);
          data.forEach((h: Honorario) => all.push({
            ...h,
            clienteNombre: `${c.nombre} ${c.apellido}`,
            clienteId: c.id,
          }));
        } catch {}
      }));
      // Ordenar por período descendente
      all.sort((a, b) => b.periodo.localeCompare(a.periodo));
      setHonorarios(all);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = honorarios.filter(h => {
    if (filtroEstado !== 'todos' && h.estado !== filtroEstado) return false;
    if (filtroPeriodo && !h.periodo.includes(filtroPeriodo)) return false;
    return true;
  });

  // KPIs
  const totalAcordado  = filtered.reduce((s, h) => s + Number(h.montoAcordado), 0);
  const totalCobrado   = filtered.reduce((s, h) => s + Number(h.montoCobrado), 0);
  const totalPendiente = totalAcordado - totalCobrado;
  const countPendiente = honorarios.filter(h => h.estado !== 'al_dia').length;

  // Periodos únicos para el filtro
  const periodos = [...new Set(honorarios.map(h => h.periodo))].sort((a, b) => b.localeCompare(a));

  const fmt = (n: number) => `$${n.toLocaleString('es-UY')}`;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, color: theme.textPrimary }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>
          Honorarios
        </h1>
        <p style={{ color: theme.textSecondary, fontSize: 14 }}>
          {loading ? 'Cargando...' : `${honorarios.length} honorarios de ${new Set(honorarios.map(h => h.clienteId)).size} clientes`}
        </p>
      </div>

      {/* KPIs */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total acordado',  value: fmt(totalAcordado),  color: theme.accent,  icon: '📋' },
            { label: 'Total cobrado',   value: fmt(totalCobrado),   color: '#15803D',     icon: '✅' },
            { label: 'Total pendiente', value: fmt(totalPendiente), color: '#D97706',     icon: '⏳' },
            { label: 'Sin cobrar',      value: `${countPendiente} honorarios`, color: '#DC2626', icon: '⚠️' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{
              background: theme.cardBg, borderRadius: 10, padding: '16px 20px',
              boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}`,
              borderLeft: `4px solid ${color}`,
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: theme.textPrimary }}>{value}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value as any)}
          style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${theme.cardBorder}`, fontSize: 13, background: theme.cardBg, color: theme.textPrimary }}
        >
          <option value="todos">Todos los estados</option>
          <option value="al_dia">Al día</option>
          <option value="pendiente">Pendiente</option>
          <option value="vencido">Vencido</option>
        </select>
        <select
          value={filtroPeriodo}
          onChange={e => setFiltroPeriodo(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${theme.cardBorder}`, fontSize: 13, background: theme.cardBg, color: theme.textPrimary }}
        >
          <option value="">Todos los períodos</option>
          {periodos.map(p => {
            const [year, month] = p.split('-');
            return <option key={p} value={p}>{MESES[parseInt(month) - 1]} {year}</option>;
          })}
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ textAlign: 'center', color: theme.textMuted, padding: 48 }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 56, background: theme.cardBg, borderRadius: 12,
          boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}`,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
          <div style={{ color: theme.textSecondary, fontSize: 14 }}>No se encontraron honorarios</div>
        </div>
      ) : (
        <div style={{ background: theme.cardBg, borderRadius: 12, boxShadow: theme.cardShadow, overflow: 'hidden', border: `1px solid ${theme.cardBorder}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: theme.tableHeaderBg }}>
                {['Cliente', 'Período', 'Acordado', 'Cobrado', 'Pendiente', 'Estado', 'Forma pago'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((h, i) => {
                const sc = ESTADO_CONFIG[h.estado];
                const pendiente = Number(h.montoAcordado) - Number(h.montoCobrado);
                return (
                  <tr
                    key={h.id}
                    style={{ borderTop: `1px solid ${theme.tableBorder}`, transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = theme.tableRowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '13px 16px' }}>
                      <Link
                        to={`/clients/${h.clienteId}`}
                        style={{ fontSize: 14, fontWeight: 500, color: theme.accentText, textDecoration: 'none' }}
                      >
                        {h.clienteNombre ?? '—'}
                      </Link>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: theme.textSecondary, fontWeight: 600 }}>
                      {(() => { const [y, m] = h.periodo.split('-'); return `${MESES[parseInt(m)-1]} ${y}`; })()}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 14, color: theme.textPrimary }}>
                      {fmt(Number(h.montoAcordado))}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 14, color: '#15803D', fontWeight: 500 }}>
                      {fmt(Number(h.montoCobrado))}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 14, color: pendiente > 0 ? '#D97706' : theme.textMuted, fontWeight: pendiente > 0 ? 600 : 400 }}>
                      {pendiente > 0 ? fmt(pendiente) : '—'}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: theme.textSecondary }}>
                      {h.formaPago ? h.formaPago.charAt(0).toUpperCase() + h.formaPago.slice(1) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Totales */}
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${theme.cardBorder}`, display: 'flex', gap: 24, background: theme.tableHeaderBg }}>
            <span style={{ fontSize: 13, color: theme.textMuted }}>
              Mostrando {filtered.length} de {honorarios.length}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary, marginLeft: 'auto' }}>
              Acordado: {fmt(totalAcordado)}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#15803D' }}>
              Cobrado: {fmt(totalCobrado)}
            </span>
            {totalPendiente > 0 && (
              <span style={{ fontSize: 13, fontWeight: 600, color: '#D97706' }}>
                Pendiente: {fmt(totalPendiente)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
