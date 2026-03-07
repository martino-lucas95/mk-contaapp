import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientsApi } from '../services/api';
import { useThemeStore } from '../store/theme.store';
import { Client, TipoEmpresa, EstadoCliente, PerfilTributario } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────
const TIPO_EMPRESA_LABEL: Record<TipoEmpresa, string> = {
  unipersonal: 'Unipersonal',
  sas: 'SAS',
  sa: 'SA',
  srl: 'SRL',
  otro: 'Otro',
};

const ESTADO_COLORS: Record<EstadoCliente, { bg: string; color: string; dot: string }> = {
  activo:     { bg: '#DCFCE7', color: '#15803D', dot: '#22C55E' },
  inactivo:   { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' },
  suspendido: { bg: '#FEF3C7', color: '#D97706', dot: '#F59E0B' },
};

const TRIBUTOS_LABELS: { key: keyof PerfilTributario; label: string }[] = [
  { key: 'contribuyenteIva',  label: 'IVA' },
  { key: 'liquidaIrae',       label: 'IRAE' },
  { key: 'irpfCat1',          label: 'IRPF Cat.I' },
  { key: 'irpfCat2',          label: 'IRPF Cat.II' },
  { key: 'empleadorBps',      label: 'BPS Patr.' },
  { key: 'fonasa',            label: 'FONASA' },
  { key: 'cjppu',             label: 'CJPPU' },
  { key: 'fondoSolidaridad',  label: 'F.Sol.' },
];

const EMPTY_FORM = {
  nombre: '', apellido: '', ci: '', telefono: '', email: '', direccion: '',
  razonSocial: '', rut: '', tipoEmpresa: '' as TipoEmpresa | '',
  giro: '', fechaInicioActividades: '', notas: '',
  contribuyenteIva: false, liquidaIrae: false, irpfCat1: false, irpfCat2: false,
  empleadorBps: false, fonasa: false, cjppu: false, fondoSolidaridad: false,
};

type FormData = typeof EMPTY_FORM;

// ── Sub-components ────────────────────────────────────────────────────────────
const Badge = ({ estado }: { estado: EstadoCliente }) => {
  const c = ESTADO_COLORS[estado];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
      background: c.bg, color: c.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
  );
};

const TributoBadge = ({ label }: { label: string }) => (
  <span style={{
    display: 'inline-block', padding: '2px 7px', borderRadius: 4,
    fontSize: 11, fontWeight: 500,
    background: '#EDE9FE', color: '#6D28D9',
    marginRight: 4, marginBottom: 2,
  }}>{label}</span>
);

const Field = ({
  label, value, onChange, type = 'text', required, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) => (
  <div>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
      {label}{required && <span style={{ color: '#DC2626' }}> *</span>}
    </label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      required={required} placeholder={placeholder}
      style={{
        width: '100%', padding: '8px 11px', borderRadius: 7,
        border: '1px solid #D1D5DB', fontSize: 14, color: '#0F172A',
        outline: 'none', boxSizing: 'border-box', background: '#fff',
      }}
      onFocus={e => (e.target.style.borderColor = '#6D28D9')}
      onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
    />
  </div>
);

const CheckField = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label style={{
    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
    padding: '6px 10px', borderRadius: 7, userSelect: 'none',
    background: checked ? '#EDE9FE' : '#F8FAFC',
    border: `1px solid ${checked ? '#C4B5FD' : '#E2E8F0'}`,
    transition: 'all 0.15s',
  }}>
    <input
      type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
      style={{ display: 'none' }}
    />
    <span style={{
      width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: checked ? '#6D28D9' : '#fff',
      border: `2px solid ${checked ? '#6D28D9' : '#D1D5DB'}`,
    }}>
      {checked && (
        <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </span>
    <span style={{ fontSize: 13, fontWeight: 500, color: checked ? '#6D28D9' : '#475569' }}>{label}</span>
  </label>
);

// ── Sección del formulario ────────────────────────────────────────────────────
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: '#94A3B8',
        textTransform: 'uppercase', letterSpacing: '0.07em',
        marginBottom: 12, paddingBottom: 8,
        borderBottom: '1px solid #F1F5F9',
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function ClientModal({
  open, onClose, onSave, initial, editId,
}: {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  initial?: FormData;
  editId?: string;
}) {
  const [form, setForm] = useState<FormData>(initial ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    if (open) { setForm(initial ?? EMPTY_FORM); setError(''); }
  }, [open]);

  const set = (k: keyof FormData) => (v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        tipoEmpresa: form.tipoEmpresa || undefined,
        nombre: form.nombre.trim() || form.razonSocial.trim() || 'Sin nombre',
        apellido: form.apellido.trim() || '-',
      };
      if (editId) {
        await clientsApi.update(editId, payload);
      } else {
        await clientsApi.create(payload);
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al guardar el cliente');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center', zIndex: 1000,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff',
        borderRadius: isMobile ? '20px 20px 0 0' : 16,
        width: isMobile ? '100%' : 540,
        maxHeight: isMobile ? '92vh' : '88vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>
            {editId ? 'Editar cliente' : 'Nuevo cliente'}
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#94A3B8', display: 'flex', padding: 4,
          }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body — todo en una sola pantalla con scroll */}
        <form onSubmit={handleSubmit} style={{ overflow: 'auto', flex: 1 }}>
          <div style={{ padding: '20px 20px 0' }}>

            {/* ── Empresa ── */}
            <FormSection title="🏢 Empresa">
              <Field label="Razón Social" value={form.razonSocial} onChange={set('razonSocial')} placeholder="Ej: MK Studios SAS" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="RUT" value={form.rut} onChange={set('rut')} placeholder="210000000010" />
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Tipo</label>
                  <select
                    value={form.tipoEmpresa}
                    onChange={e => setForm(f => ({ ...f, tipoEmpresa: e.target.value as TipoEmpresa | '' }))}
                    style={{ width: '100%', padding: '9px 11px', borderRadius: 7, border: '1px solid #D1D5DB', fontSize: 14, color: '#0F172A', background: '#fff', boxSizing: 'border-box' as const }}
                  >
                    <option value="">Sin especificar</option>
                    {Object.entries(TIPO_EMPRESA_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Giro / Actividad" value={form.giro} onChange={set('giro')} placeholder="Ej: Informática" />
                <Field label="Inicio actividades" type="date" value={form.fechaInicioActividades} onChange={set('fechaInicioActividades')} />
              </div>
              <Field label="Dirección" value={form.direccion} onChange={set('direccion')} placeholder="Ej: Rambla República de Chile 4551" />
            </FormSection>

            {/* ── Obligaciones tributarias ── */}
            <FormSection title="📋 Obligaciones tributarias">
              <p style={{ fontSize: 12, color: '#64748B', marginTop: -6 }}>
                Determinan los vencimientos que se generan automáticamente.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {TRIBUTOS_LABELS.map(({ key, label }) => (
                  <CheckField
                    key={key} label={label}
                    checked={form[key] as boolean}
                    onChange={v => setForm(f => ({ ...f, [key]: v }))}
                  />
                ))}
              </div>
            </FormSection>

            {/* ── Datos personales (colapsable, secundario) ── */}
            <FormSection title="👤 Datos personales (opcional)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Nombre" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Lucas" />
                <Field label="Apellido" value={form.apellido} onChange={set('apellido')} placeholder="Ej: Martino" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="CI" value={form.ci} onChange={set('ci')} placeholder="12345678" />
                <Field label="Teléfono" value={form.telefono} onChange={set('telefono')} placeholder="098 000 000" />
              </div>
              <Field label="Email" type="email" value={form.email} onChange={set('email')} />
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Notas</label>
                <textarea
                  value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  rows={2} placeholder="Observaciones adicionales..."
                  style={{ width: '100%', padding: '8px 11px', borderRadius: 7, border: '1px solid #D1D5DB', fontSize: 14, color: '#0F172A', outline: 'none', boxSizing: 'border-box' as const, resize: 'vertical', fontFamily: 'inherit' }}
                  onFocus={e => (e.target.style.borderColor = '#6D28D9')}
                  onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
                />
              </div>
            </FormSection>

          </div>

          {error && (
            <div style={{ margin: '0 20px', background: '#FEE2E2', color: '#DC2626', borderRadius: 7, padding: '8px 12px', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Footer */}
          <div style={{
            padding: '14px 20px',
            paddingBottom: isMobile ? 'calc(14px + env(safe-area-inset-bottom))' : '20px',
            display: 'flex', gap: 10, justifyContent: 'flex-end',
            borderTop: '1px solid #F1F5F9', flexShrink: 0,
            position: 'sticky', bottom: 0, background: '#fff',
          }}>
            <button type="button" onClick={onClose} style={{
              flex: isMobile ? 1 : undefined,
              padding: '10px 20px', borderRadius: 8, border: '1px solid #E2E8F0',
              background: '#fff', color: '#475569', fontSize: 14, cursor: 'pointer',
            }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{
              flex: isMobile ? 2 : undefined,
              padding: '10px 22px', borderRadius: 8, border: 'none',
              background: '#6D28D9', color: '#fff', fontSize: 14, fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Client | null>(null);

  const load = () => {
    setLoading(true);
    clientsApi.getAll()
      .then(({ data }) => setClients(data))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.apellido.toLowerCase().includes(q) ||
      (c.razonSocial ?? '').toLowerCase().includes(q) ||
      (c.rut ?? '').includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    );
  });

  const handleEdit = (c: Client) => {
    setEditClient(c);
    setModalOpen(true);
  };

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return;
    await clientsApi.deactivate(confirmDeactivate.id);
    setConfirmDeactivate(null);
    load();
  };

  const toFormData = (c: Client): FormData => ({
    nombre: c.nombre, apellido: c.apellido, ci: c.ci ?? '',
    telefono: c.telefono ?? '', email: c.email ?? '', direccion: c.direccion ?? '',
    razonSocial: c.razonSocial ?? '', rut: c.rut ?? '',
    tipoEmpresa: c.tipoEmpresa ?? '',
    giro: c.giro ?? '',
    fechaInicioActividades: c.fechaInicioActividades
      ? c.fechaInicioActividades.slice(0, 10) : '',
    notas: c.notas ?? '',
    contribuyenteIva: c.contribuyenteIva, liquidaIrae: c.liquidaIrae,
    irpfCat1: c.irpfCat1, irpfCat2: c.irpfCat2, empleadorBps: c.empleadorBps,
    fonasa: c.fonasa, cjppu: c.cjppu, fondoSolidaridad: c.fondoSolidaridad,
  });

  return (
    <div style={{ padding: '28px 32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>Clientes</h1>
          <p style={{ color: theme.textSecondary, fontSize: 14 }}>
            {loading ? 'Cargando...' : `${clients.length} cliente${clients.length !== 1 ? 's' : ''} registrado${clients.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => { setEditClient(null); setModalOpen(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', borderRadius: 8,
            background: '#6D28D9', color: '#fff', border: 'none',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo cliente
        </button>
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 380 }}>
        <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
          width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text" placeholder="Buscar por nombre, RUT, email..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '9px 12px 9px 36px',
            borderRadius: 8, border: '1px solid #E2E8F0',
            fontSize: 14, color: '#0F172A', outline: 'none', boxSizing: 'border-box',
            background: '#fff',
          }}
          onFocus={e => (e.target.style.borderColor = '#6D28D9')}
          onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
        />
      </div>

      {/* Tabla */}
      <div style={{ background: theme.cardBg, borderRadius: 12, boxShadow: theme.cardShadow, overflow: 'hidden', border: `1px solid ${theme.cardBorder}` }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: theme.textMuted, fontSize: 14 }}>Cargando clientes...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div style={{ color: '#64748B', fontSize: 14, fontWeight: 500 }}>
              {search ? 'No se encontraron resultados' : 'No hay clientes registrados'}
            </div>
            <div style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>
              {search ? 'Probá con otro término de búsqueda' : 'Creá el primero con el botón de arriba'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: theme.tableHeaderBg, borderBottom: `1px solid ${theme.cardBorder}` }}>
                {['Cliente', 'RUT / Empresa', 'Tributos', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 12, fontWeight: 600, color: theme.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const tributos = TRIBUTOS_LABELS.filter(t => c[t.key]);
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? `1px solid ${theme.tableBorder}` : 'none',
                      cursor: 'pointer', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = theme.tableRowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => navigate(`/clients/${c.id}`)}
                  >
                    {/* Nombre */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: theme.accentLight, color: theme.accentText,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700,
                        }}>
                          {c.nombre[0]}{c.apellido[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: theme.textPrimary }}>
                            {c.nombre} {c.apellido}
                          </div>
                          {c.email && (
                            <div style={{ fontSize: 12, color: theme.textMuted }}>{c.email}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* RUT / Empresa */}
                    <td style={{ padding: '14px 16px' }}>
                      {c.rut ? (
                        <>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{c.rut}</div>
                          {c.tipoEmpresa && (
                            <div style={{ fontSize: 12, color: '#94A3B8' }}>{TIPO_EMPRESA_LABEL[c.tipoEmpresa]}</div>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: 13, color: '#CBD5E1' }}>—</span>
                      )}
                    </td>

                    {/* Tributos */}
                    <td style={{ padding: '14px 16px', maxWidth: 200 }}>
                      {tributos.length > 0 ? (
                        <div style={{ lineHeight: 1.8 }}>
                          {tributos.slice(0, 4).map(t => <TributoBadge key={t.key} label={t.label} />)}
                          {tributos.length > 4 && (
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>+{tributos.length - 4} más</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, color: '#CBD5E1' }}>Sin configurar</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td style={{ padding: '14px 16px' }}>
                      <Badge estado={c.estado} />
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleEdit(c)}
                          title="Editar"
                          style={{
                            padding: '5px 10px', borderRadius: 6, border: '1px solid #E2E8F0',
                            background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
                          }}
                        >
                          <svg width="14" height="14" fill="none" stroke="#475569" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {c.estado === 'activo' && (
                          <button
                            onClick={() => setConfirmDeactivate(c)}
                            title="Desactivar"
                            style={{
                              padding: '5px 10px', borderRadius: 6, border: '1px solid #FEE2E2',
                              background: '#FFF5F5', cursor: 'pointer', display: 'flex', alignItems: 'center',
                            }}
                          >
                            <svg width="14" height="14" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear/editar */}
      <ClientModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditClient(null); }}
        onSave={load}
        initial={editClient ? toFormData(editClient) : undefined}
        editId={editClient?.id}
      />

      {/* Modal confirmar desactivar */}
      {confirmDeactivate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, padding: '28px',
            width: 380, boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>¿Desactivar cliente?</h2>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 20 }}>
              <strong>{confirmDeactivate.nombre} {confirmDeactivate.apellido}</strong> pasará a estado inactivo.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDeactivate(null)} style={{
                padding: '8px 18px', borderRadius: 7, border: '1px solid #E2E8F0',
                background: '#fff', color: '#475569', fontSize: 14, cursor: 'pointer',
              }}>Cancelar</button>
              <button onClick={handleDeactivate} style={{
                padding: '8px 18px', borderRadius: 7, border: 'none',
                background: '#DC2626', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}>Desactivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
