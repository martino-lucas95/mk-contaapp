import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calendarApi } from '../services/api';
import { Vencimiento, EstadoVencimiento } from '../types';

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
  const [vencimientos, setVencimientos] = useState<VencimientoConCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<EstadoVencimiento | 'todos'>('todos');
  const [filtroMes, setFiltroMes] = useState<number | 'todos'>('todos');

  useEffect(() => {
    calendarApi.getProximos()
      .then(({ data }) => setVencimientos(data))
      .catch(() => setVencimientos([]))
      .finally(() => setLoading(false));
  }, []);

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
    <div style={{ padding: '28px 32px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Calendario de Vencimientos</h1>
        <p style={{ color: '#64748B', fontSize: 14 }}>Seguimiento de todas las obligaciones tributarias</p>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Vencidos', value: totalVencidos, bg: '#FEE2E2', color: '#DC2626' },
          { label: 'Por vencer pronto', value: totalAlertas, bg: '#FEF3C7', color: '#D97706' },
          { label: 'Pendientes', value: totalPendientes, bg: '#EDE9FE', color: '#6D28D9' },
        ].map(({ label, value, bg, color }) => (
          <div key={label} style={{ background: bg, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color }}>{value}</span>
            <span style={{ fontSize: 13, color, fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 12, color: '#64748B', marginBottom: 4, display: 'block' }}>Estado</label>
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value as any)}
            style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #E2E8F0', fontSize: 13, background: '#fff', color: '#0F172A' }}
          >
            <option value="todos">Todos</option>
            <option value="vencido">Vencidos</option>
            <option value="alertado">Alertados</option>
            <option value="pendiente">Pendientes</option>
            <option value="completado">Completados</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#64748B', marginBottom: 4, display: 'block' }}>Mes</label>
          <select
            value={filtroMes}
            onChange={e => setFiltroMes(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
            style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #E2E8F0', fontSize: 13, background: '#fff', color: '#0F172A' }}
          >
            <option value="todos">Todos los meses</option>
            {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#94A3B8', padding: 48 }}>Cargando...</div>
      ) : Object.keys(porMes).length === 0 ? (
        <div style={{ textAlign: 'center', padding: 56, background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ color: '#64748B', fontSize: 14 }}>No hay vencimientos para mostrar</div>
        </div>
      ) : (
        Object.entries(porMes).map(([mes, items]) => (
          <div key={mes} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #EDE9FE' }}>
              📅 {mes}
              <span style={{ fontSize: 13, fontWeight: 400, color: '#94A3B8', marginLeft: 8 }}>{items.length} vencimiento{items.length !== 1 ? 's' : ''}</span>
            </h2>
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Cliente', 'Obligación', 'Fecha', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
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
                        style={{ borderTop: '1px solid #F1F5F9', cursor: v.clienteId ? 'pointer' : 'default', transition: 'background 0.1s' }}
                        onMouseEnter={e => v.clienteId && (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => v.clienteId && navigate(`/clients/${v.clienteId}`)}
                      >
                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#0F172A', fontWeight: 500 }}>
                          {(v as any).clienteNombre ?? (v as any).client?.nombre ?? '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>
                          {v.tipo.replace(/_/g, ' ').toUpperCase()}
                          {v.periodo && <span style={{ marginLeft: 6, color: '#94A3B8' }}>({v.periodo})</span>}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#0F172A' }}>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
