import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calendarApi } from '../services/api';
import { useThemeStore } from '../store/theme.store';
import { Vencimiento, EstadoVencimiento } from '../types';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

const ESTADO_COLORS: Record<EstadoVencimiento, { bg: string; color: string; dot: string }> = {
  pendiente:  { bg: '#FEF3C7', color: '#D97706', dot: '#F59E0B' },
  alertado:   { bg: '#FEE2E2', color: '#DC2626', dot: '#EF4444' },
  vencido:    { bg: '#FEE2E2', color: '#DC2626', dot: '#EF4444' },
  completado: { bg: '#DCFCE7', color: '#15803D', dot: '#22C55E' },
};

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

type VencimientoConCliente = Vencimiento & { clienteNombre?: string; clienteId?: string };

export default function CalendarPage() {
  const navigate = useNavigate();
  const theme = useThemeStore((s) => s.theme);
  const isMobile = useIsMobile();
  const [vencimientos, setVencimientos] = useState<VencimientoConCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<EstadoVencimiento | 'todos'>('todos');
  const [filtroMes, setFiltroMes] = useState<number | 'todos'>('todos');
  const [completando, setCompletando] = useState<string | null>(null);

  const loadVencimientos = () => {
    setLoading(true);
    calendarApi.getProximos()
      .then(({ data }) => setVencimientos(data))
      .catch(() => setVencimientos([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadVencimientos(); }, []);

  const handleCompletar = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCompletando(id);
    try {
      await calendarApi.completar(id);
      setVencimientos(vs => vs.map(v => v.id === id ? { ...v, estado: 'completado' as EstadoVencimiento } : v));
    } finally {
      setCompletando(null);
    }
  };

  const filtered = vencimientos.filter(v => {
    if (filtroEstado !== 'todos' && v.estado !== filtroEstado) return false;
    if (filtroMes !== 'todos') {
      const mes = new Date(v.fechaVencimiento).getMonth();
      if (mes !== filtroMes) return false;
    }
    return true;
  });

  // Agrupar por mes
  const porMes: Record<string, VencimientoConCliente[]> = {};
  filtered
    .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())
    .forEach(v => {
      const d = new Date(v.fechaVencimiento);
      const key = `${MESES[d.getMonth()]} ${d.getFullYear()}`;
      if (!porMes[key]) porMes[key] = [];
      porMes[key].push(v);
    });

  const totalVencidos = vencimientos.filter(v => v.estado === 'vencido').length;
  const totalAlertas = vencimientos.filter(v => v.estado === 'alertado').length;
  const totalPendientes = vencimientos.filter(v => v.estado === 'pendiente').length;

  return (
    <div style={{ padding: isMobile ? '16px' : '28px 32px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 19 : 22, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>Calendario de Vencimientos</h1>
        <p style={{ color: theme.textSecondary, fontSize: 14 }}>Seguimiento de todas las obligaciones tributarias</p>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? 8 : 14, marginBottom: 20 }}>
        {[
          { label: isMobile ? 'Vencidos' : 'Vencidos', value: totalVencidos, bg: '#FEE2E2', color: '#DC2626' },
          { label: isMobile ? 'Por vencer' : 'Por vencer pronto', value: totalAlertas, bg: '#FEF3C7', color: '#D97706' },
          { label: 'Pendientes', value: totalPendientes, bg: theme.accentLight, color: theme.accentText },
        ].map(({ label, value, bg, color }) => (
          <div key={label} style={{ background: bg, borderRadius: 10, padding: isMobile ? '10px 12px' : '14px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color }}>{value}</span>
            <span style={{ fontSize: isMobile ? 11 : 13, color, fontWeight: 500, lineHeight: 1.2 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' as const }}>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value as any)}
          style={{ padding: '7px 12px', borderRadius: 7, border: `1px solid ${theme.cardBorder}`, fontSize: 13, background: theme.inputBg, color: theme.textPrimary, flex: isMobile ? 1 : undefined }}
        >
          <option value="todos">Todos los estados</option>
          <option value="vencido">Vencidos</option>
          <option value="alertado">Alertados</option>
          <option value="pendiente">Pendientes</option>
          <option value="completado">Completados</option>
        </select>
        <select
          value={filtroMes}
          onChange={e => setFiltroMes(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
          style={{ padding: '7px 12px', borderRadius: 7, border: `1px solid ${theme.cardBorder}`, fontSize: 13, background: theme.inputBg, color: theme.textPrimary, flex: isMobile ? 1 : undefined }}
        >
          <option value="todos">Todos los meses</option>
          {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#94A3B8', padding: 48 }}>Cargando...</div>
      ) : Object.keys(porMes).length === 0 ? (
        <div style={{ textAlign: 'center', padding: 56, background: theme.cardBg, borderRadius: 12, boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ color: theme.textSecondary, fontSize: 14 }}>No hay vencimientos para mostrar</div>
        </div>
      ) : (
        Object.entries(porMes).map(([mes, items]) => (
          <div key={mes} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary, marginBottom: 10, paddingBottom: 8, borderBottom: `2px solid ${theme.accentLight}` }}>
              📅 {mes}
              <span style={{ fontSize: 13, fontWeight: 400, color: theme.textMuted, marginLeft: 8 }}>{items.length} vencimiento{items.length !== 1 ? 's' : ''}</span>
            </h2>

            {isMobile ? (
              /* ── MOBILE: cards ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(v => {
                  const c = ESTADO_COLORS[v.estado];
                  const diasRestantes = Math.ceil((new Date(v.fechaVencimiento).getTime() - Date.now()) / 86400000);
                  return (
                    <div key={v.id}
                      onClick={() => v.clienteId && navigate(`/clients/${v.clienteId}`)}
                      style={{
                        background: theme.cardBg, borderRadius: 10, padding: '12px 14px',
                        border: `1px solid ${theme.cardBorder}`, borderLeft: `3px solid ${c.color}`,
                        cursor: v.clienteId ? 'pointer' : 'default',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>
                            {(v as any).clienteNombre ?? (v as any).client?.nombre ?? '—'}
                          </div>
                          <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                            {v.tipo.replace(/_/g, ' ').toUpperCase()}
                            {v.periodo && <span style={{ color: theme.textMuted, marginLeft: 4 }}>({v.periodo})</span>}
                          </div>
                          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                            {new Date(v.fechaVencimiento).toLocaleDateString('es-UY')}
                            {diasRestantes >= 0 && diasRestantes <= 5 && v.estado !== 'completado' && (
                              <span style={{ marginLeft: 6, fontSize: 11, color: '#DC2626', fontWeight: 700 }}>
                                ⚠ {diasRestantes === 0 ? 'HOY' : `${diasRestantes}d`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: c.bg, color: c.color }}>
                            {v.estado.charAt(0).toUpperCase() + v.estado.slice(1)}
                          </span>
                          {v.estado !== 'completado' && (
                            <button
                              onClick={e => handleCompletar(e, v.id)}
                              disabled={completando === v.id}
                              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#DCFCE7', color: '#15803D', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: completando === v.id ? 0.6 : 1, whiteSpace: 'nowrap' as const }}
                            >
                              {completando === v.id ? '...' : '✓ Completar'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── DESKTOP: tabla ── */
              <div style={{ background: theme.cardBg, borderRadius: 12, boxShadow: theme.cardShadow, overflow: 'hidden', border: `1px solid ${theme.cardBorder}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: theme.tableHeaderBg }}>
                      {['Cliente', 'Obligación', 'Fecha', 'Estado', ''].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((v, i) => {
                      const c = ESTADO_COLORS[v.estado];
                      const diasRestantes = Math.ceil((new Date(v.fechaVencimiento).getTime() - Date.now()) / 86400000);
                      return (
                        <tr
                          key={v.id}
                          style={{ borderTop: `1px solid ${theme.tableBorder}`, cursor: v.clienteId ? 'pointer' : 'default', transition: 'background 0.1s' }}
                          onMouseEnter={e => v.clienteId && (e.currentTarget.style.background = theme.tableRowHover)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          onClick={() => v.clienteId && navigate(`/clients/${v.clienteId}`)}
                        >
                          <td style={{ padding: '12px 16px', fontSize: 14, color: theme.textPrimary, fontWeight: 500 }}>
                            {(v as any).clienteNombre ?? (v as any).client?.nombre ?? '—'}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: theme.textSecondary }}>
                            {v.tipo.replace(/_/g, ' ').toUpperCase()}
                            {v.periodo && <span style={{ marginLeft: 6, color: theme.textMuted }}>({v.periodo})</span>}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: theme.textPrimary }}>
                            {new Date(v.fechaVencimiento).toLocaleDateString('es-UY')}
                            {diasRestantes >= 0 && diasRestantes <= 5 && v.estado !== 'completado' && (
                              <span style={{ marginLeft: 6, fontSize: 11, color: '#DC2626', fontWeight: 700 }}>
                                ⚠ {diasRestantes === 0 ? 'HOY' : `${diasRestantes}d`}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: c.bg, color: c.color }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
                              {v.estado.charAt(0).toUpperCase() + v.estado.slice(1)}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                            {v.estado !== 'completado' && (
                              <button
                                onClick={e => handleCompletar(e, v.id)}
                                disabled={completando === v.id}
                                style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#DCFCE7', color: '#15803D', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: completando === v.id ? 0.6 : 1, whiteSpace: 'nowrap' as const }}
                              >
                                {completando === v.id ? '...' : '✓ Completar'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
