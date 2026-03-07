import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clientsApi } from '../services/api';
import api from '../services/api';
import { useThemeStore } from '../store/theme.store';
import { Client, Movimiento, TipoMovimiento } from '../types';

type MovConCliente = Movimiento & { clienteNombre?: string };

const TIPO_CONFIG: Record<TipoMovimiento, { bg: string; color: string; label: string; icon: string }> = {
  venta:  { bg: '#DCFCE7', color: '#15803D', label: 'Venta',  icon: '↑' },
  compra: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Compra', icon: '↓' },
  gasto:  { bg: '#FEF3C7', color: '#D97706', label: 'Gasto',  icon: '⊖' },
};

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function MovimientosPage() {
  const { theme } = useThemeStore();
  const [movimientos, setMovimientos] = useState<MovConCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<TipoMovimiento | 'todos'>('todos');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [clientes, setClientes] = useState<Client[]>([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientId: '', tipo: 'venta' as TipoMovimiento, fecha: new Date().toISOString().slice(0,10),
    descripcion: '', monto: '', ivaIncluido: false, tasaIva: '22', categoria: '', nroComprobante: '', notas: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data: cls } = await clientsApi.getAll();
      setClientes(cls);
      const all: MovConCliente[] = [];
      await Promise.all(cls.map(async (c: Client) => {
        try {
          const { data } = await api.get(`/movimientos/client/${c.id}`);
          data.forEach((m: Movimiento) => all.push({ ...m, clienteNombre: `${c.nombre} ${c.apellido}` }));
        } catch {}
      }));
      all.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setMovimientos(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = movimientos.filter(m => {
    if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) return false;
    if (filtroCliente && m.clientId !== filtroCliente) return false;
    if (filtroPeriodo) {
      const d = new Date(m.fecha);
      const p = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (p !== filtroPeriodo) return false;
    }
    return true;
  });

  // KPIs del filtered
  const totalVentas  = filtered.filter(m => m.tipo === 'venta').reduce((s, m) => s + Number(m.monto), 0);
  const totalCompras = filtered.filter(m => m.tipo === 'compra').reduce((s, m) => s + Number(m.monto), 0);
  const totalGastos  = filtered.filter(m => m.tipo === 'gasto').reduce((s, m) => s + Number(m.monto), 0);
  const resultado    = totalVentas - totalCompras - totalGastos;

  // Periodos únicos
  const periodos = [...new Set(movimientos.map(m => {
    const d = new Date(m.fecha);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  }))].sort((a,b) => b.localeCompare(a));

  const fmt = (n: number) => `$${n.toLocaleString('es-UY')}`;

  const openNew = () => {
    setForm({ clientId: '', tipo: 'venta', fecha: new Date().toISOString().slice(0,10), descripcion: '', monto: '', ivaIncluido: false, tasaIva: '22', categoria: '', nroComprobante: '', notas: '' });
    setEditId(null); setError(''); setShowModal(true);
  };

  const openEdit = (m: MovConCliente) => {
    setForm({
      clientId: m.clientId, tipo: m.tipo, fecha: m.fecha.slice(0,10),
      descripcion: m.descripcion ?? '', monto: String(m.monto),
      ivaIncluido: m.ivaIncluido, tasaIva: String(m.tasaIva ?? 22),
      categoria: m.categoria ?? '', nroComprobante: m.nroComprobante ?? '', notas: m.notas ?? '',
    });
    setEditId(m.id); setError(''); setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = {
        clientId: form.clientId, tipo: form.tipo, fecha: form.fecha,
        descripcion: form.descripcion || undefined,
        monto: parseFloat(form.monto),
        ivaIncluido: form.ivaIncluido,
        tasaIva: form.ivaIncluido ? parseFloat(form.tasaIva) : undefined,
        categoria: form.categoria || undefined,
        nroComprobante: form.nroComprobante || undefined,
        notas: form.notas || undefined,
      };
      if (editId) {
        await api.put(`/movimientos/${editId}`, payload);
      } else {
        await api.post('/movimientos', payload);
      }
      await load();
      setShowModal(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este movimiento?')) return;
    await api.delete(`/movimientos/${id}`);
    setMovimientos(ms => ms.filter(m => m.id !== id));
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, color: theme.textPrimary }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>Movimientos Contables</h1>
          <p style={{ color: theme.textSecondary, fontSize: 14 }}>
            {loading ? 'Cargando...' : `${movimientos.length} movimientos registrados`}
          </p>
        </div>
        <button
          onClick={openNew}
          style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          + Nuevo movimiento
        </button>
      </div>

      {/* KPIs */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Ventas',    value: fmt(totalVentas),  color: '#15803D', icon: '↑', bg: '#DCFCE7' },
            { label: 'Compras',   value: fmt(totalCompras), color: '#1D4ED8', icon: '↓', bg: '#DBEAFE' },
            { label: 'Gastos',    value: fmt(totalGastos),  color: '#D97706', icon: '⊖', bg: '#FEF3C7' },
            { label: 'Resultado', value: fmt(resultado),    color: resultado >= 0 ? '#15803D' : '#DC2626', icon: '=', bg: resultado >= 0 ? '#DCFCE7' : '#FEE2E2' },
          ].map(({ label, value, color, icon, bg }) => (
            <div key={label} style={{ background: theme.cardBg, borderRadius: 10, padding: '16px 20px', boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}`, borderLeft: `4px solid ${color}` }}>
              <div style={{ fontSize: 20, marginBottom: 4, background: bg, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary }}>{value}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value as any)}
          style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${theme.cardBorder}`, fontSize: 13, background: theme.cardBg, color: theme.textPrimary }}>
          <option value="todos">Todos los tipos</option>
          <option value="venta">Ventas</option>
          <option value="compra">Compras</option>
          <option value="gasto">Gastos</option>
        </select>
        <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${theme.cardBorder}`, fontSize: 13, background: theme.cardBg, color: theme.textPrimary }}>
          <option value="">Todos los clientes</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
        </select>
        <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${theme.cardBorder}`, fontSize: 13, background: theme.cardBg, color: theme.textPrimary }}>
          <option value="">Todos los períodos</option>
          {periodos.map(p => {
            const [y, m] = p.split('-');
            return <option key={p} value={p}>{MESES[parseInt(m)-1]} {y}</option>;
          })}
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ textAlign: 'center', color: theme.textMuted, padding: 48 }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 56, background: theme.cardBg, borderRadius: 12, boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ color: theme.textSecondary, fontSize: 14 }}>No hay movimientos registrados</div>
          <div style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>Registrá el primero con el botón de arriba</div>
        </div>
      ) : (
        <div style={{ background: theme.cardBg, borderRadius: 12, boxShadow: theme.cardShadow, overflow: 'hidden', border: `1px solid ${theme.cardBorder}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: theme.tableHeaderBg }}>
                {['Fecha', 'Cliente', 'Tipo', 'Descripción', 'Monto', 'IVA', 'Comprobante', ''].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const tc = TIPO_CONFIG[m.tipo];
                return (
                  <tr key={m.id}
                    style={{ borderTop: `1px solid ${theme.tableBorder}`, transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = theme.tableRowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 13, color: theme.textPrimary, whiteSpace: 'nowrap' }}>
                      {new Date(m.fecha).toLocaleDateString('es-UY')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Link to={`/clients/${m.clientId}`} style={{ fontSize: 13, fontWeight: 500, color: theme.accentText, textDecoration: 'none' }}>
                        {m.clienteNombre ?? '—'}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: tc.bg, color: tc.color }}>
                        {tc.icon} {tc.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: theme.textSecondary, maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.descripcion || '—'}
                        {m.categoria && <span style={{ marginLeft: 6, fontSize: 11, color: theme.textMuted, background: theme.tableHeaderBg, padding: '1px 6px', borderRadius: 4 }}>{m.categoria}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: m.tipo === 'venta' ? '#15803D' : theme.textPrimary }}>
                      {fmt(Number(m.monto))}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: theme.textMuted }}>
                      {m.ivaIncluido ? `${m.tasaIva ?? 22}%` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: theme.textMuted, fontFamily: 'monospace' }}>
                      {m.nroComprobante || '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(m)} title="Editar"
                          style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${theme.cardBorder}`, background: theme.cardBg, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <svg width="13" height="13" fill="none" stroke={theme.textSecondary} strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => handleDelete(m.id)} title="Eliminar"
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #FEE2E2', background: '#FFF5F5', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <svg width="13" height="13" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${theme.cardBorder}`, display: 'flex', gap: 20, background: theme.tableHeaderBg }}>
            <span style={{ fontSize: 13, color: theme.textMuted }}>Mostrando {filtered.length} de {movimientos.length}</span>
            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: '#15803D' }}>Ventas: {fmt(totalVentas)}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1D4ED8' }}>Compras: {fmt(totalCompras)}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#D97706' }}>Gastos: {fmt(totalGastos)}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: resultado >= 0 ? '#15803D' : '#DC2626' }}>
              Resultado: {fmt(resultado)}
            </span>
          </div>
        </div>
      )}

      {/* Modal nuevo/editar */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: theme.cardBg, borderRadius: 14, padding: '28px', width: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: `1px solid ${theme.cardBorder}` }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: theme.textPrimary, marginBottom: 20 }}>
              {editId ? 'Editar movimiento' : 'Nuevo movimiento'}
            </h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {/* Cliente */}
                <MField label="Cliente *" theme={theme}>
                  <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} required
                    style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: `1px solid ${theme.inputBorder}`, fontSize: 14, background: theme.inputBg, color: theme.textPrimary, boxSizing: 'border-box' as const }}>
                    <option value="">Seleccioná un cliente</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido} {c.razonSocial ? `— ${c.razonSocial}` : ''}</option>)}
                  </select>
                </MField>
                {/* Tipo + Fecha */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <MField label="Tipo *" theme={theme}>
                    <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoMovimiento }))}
                      style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: `1px solid ${theme.inputBorder}`, fontSize: 14, background: theme.inputBg, color: theme.textPrimary, boxSizing: 'border-box' as const }}>
                      <option value="venta">Venta</option>
                      <option value="compra">Compra</option>
                      <option value="gasto">Gasto</option>
                    </select>
                  </MField>
                  <MField label="Fecha *" theme={theme}>
                    <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} required
                      style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: `1px solid ${theme.inputBorder}`, fontSize: 14, background: theme.inputBg, color: theme.textPrimary, boxSizing: 'border-box' as const }} />
                  </MField>
                </div>
                {/* Monto */}
                <MField label="Monto ($) *" theme={theme}>
                  <input type="number" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} required min="0" step="0.01"
                    style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: `1px solid ${theme.inputBorder}`, fontSize: 14, background: theme.inputBg, color: theme.textPrimary, boxSizing: 'border-box' as const }} />
                </MField>
                {/* IVA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="ivaCheck" checked={form.ivaIncluido} onChange={e => setForm(f => ({ ...f, ivaIncluido: e.target.checked }))}
                    style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  <label htmlFor="ivaCheck" style={{ fontSize: 14, color: theme.textPrimary, cursor: 'pointer' }}>IVA incluido</label>
                  {form.ivaIncluido && (
                    <select value={form.tasaIva} onChange={e => setForm(f => ({ ...f, tasaIva: e.target.value }))}
                      style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${theme.inputBorder}`, fontSize: 13, background: theme.inputBg, color: theme.textPrimary }}>
                      <option value="10">10%</option>
                      <option value="22">22%</option>
                    </select>
                  )}
                </div>
                {/* Descripción */}
                <MField label="Descripción" theme={theme}>
                  <input type="text" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción del movimiento"
                    style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: `1px solid ${theme.inputBorder}`, fontSize: 14, background: theme.inputBg, color: theme.textPrimary, boxSizing: 'border-box' as const }} />
                </MField>
                {/* Categoría + Comprobante */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <MField label="Categoría" theme={theme}>
                    <input type="text" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} placeholder="Ej: servicios"
                      style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: `1px solid ${theme.inputBorder}`, fontSize: 14, background: theme.inputBg, color: theme.textPrimary, boxSizing: 'border-box' as const }} />
                  </MField>
                  <MField label="Nro. Comprobante" theme={theme}>
                    <input type="text" value={form.nroComprobante} onChange={e => setForm(f => ({ ...f, nroComprobante: e.target.value }))} placeholder="Ej: 000123"
                      style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: `1px solid ${theme.inputBorder}`, fontSize: 14, background: theme.inputBg, color: theme.textPrimary, boxSizing: 'border-box' as const }} />
                  </MField>
                </div>
                {/* Notas */}
                <MField label="Notas" theme={theme}>
                  <input type="text" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                    style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: `1px solid ${theme.inputBorder}`, fontSize: 14, background: theme.inputBg, color: theme.textPrimary, boxSizing: 'border-box' as const }} />
                </MField>
              </div>
              {error && <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 7, padding: '8px 12px', fontSize: 13, marginTop: 12 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding: '8px 18px', borderRadius: 7, border: `1px solid ${theme.cardBorder}`, background: theme.cardBg, color: theme.textSecondary, fontSize: 14, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: theme.accent, color: '#fff', fontSize: 14, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MField({ label, children, theme }: { label: string; children: React.ReactNode; theme: any }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: theme.textSecondary, marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}
