import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientsApi } from '@/services/api';
import { Client, TipoEmpresa, EstadoCliente, PerfilTributario } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Plus, Search, Pencil, UserX } from 'lucide-react';

// ── Hook responsive ──────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const TIPO_EMPRESA_LABEL: Record<TipoEmpresa, string> = {
  unipersonal: 'Unipersonal',
  sas: 'SAS',
  sa: 'SA',
  srl: 'SRL',
  otro: 'Otro',
};

const ESTADO_COLORS: Record<EstadoCliente, { bg: string; color: string; dot: string }> = {
  activo: { bg: '#DCFCE7', color: '#15803D', dot: '#22C55E' },
  inactivo: { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' },
  suspendido: { bg: '#FEF3C7', color: '#D97706', dot: '#F59E0B' },
};

const TRIBUTOS_LABELS: { key: keyof PerfilTributario; label: string }[] = [
  { key: 'contribuyenteIva', label: 'IVA' },
  { key: 'liquidaIrae', label: 'IRAE' },
  { key: 'irpfCat1', label: 'IRPF Cat.I' },
  { key: 'irpfCat2', label: 'IRPF Cat.II' },
  { key: 'empleadorBps', label: 'BPS Patr.' },
  { key: 'fonasa', label: 'FONASA' },
  { key: 'cjppu', label: 'CJPPU' },
  { key: 'fondoSolidaridad', label: 'F.Sol.' },
];

const EMPTY_FORM = {
  nombre: '', apellido: '', ci: '', telefono: '', email: '', direccion: '',
  razonSocial: '', rut: '', nroBps: '', tipoEmpresa: '' as TipoEmpresa | '',
  giro: '', fechaInicioActividades: '', notas: '',
  contribuyenteIva: false, liquidaIrae: false, irpfCat1: false, irpfCat2: false,
  empleadorBps: false, fonasa: false, cjppu: false, fondoSolidaridad: false,
  exoneracionIva: false, exoneracionIrae: false, exoneracionDetalle: '',
  crearUsuario: false, userPassword: '',
};

type FormData = typeof EMPTY_FORM;

// ── Sub-components ────────────────────────────────────────────────────────────
function EstadoBadge({ estado }: { estado: EstadoCliente }) {
  const c = ESTADO_COLORS[estado];
  return (
    <Badge variant="secondary" className="gap-1.5 font-medium" style={{ background: c.bg, color: c.color }}>
      <span className="size-1.5 rounded-full" style={{ background: c.dot }} />
      {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </Badge>
  );
}

const TributoBadge = ({ label }: { label: string }) => (
  <Badge variant="outline" className="mr-1 mb-0.5 bg-violet-50 text-violet-700 border-violet-200">
    {label}
  </Badge>
);

function Field({
  label, value, onChange, type = 'text', required, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  const id = `field-${label.replace(/\s/g, '-')}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}{required && <span className="text-destructive"> *</span>}
      </Label>
      <Input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} />
    </div>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = `chk-${label.replace(/\\s/g, '-')}`;
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border p-3 transition-colors',
        checked ? 'border-primary/50 bg-primary/5' : 'border-border'
      )}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(!!v)} type="button" />
      <Label htmlFor={id} className="cursor-pointer text-sm font-medium leading-none">{label}</Label>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-3 border-b pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
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
  const isMobile = useIsMobile();

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
        nombre: (form.nombre ?? '').trim() || (form.razonSocial ?? '').trim() || 'Sin nombre',
        apellido: (form.apellido ?? '').trim() || '-',
      };
      let finalId = editId;
      if (editId) {
        await clientsApi.update(editId, payload);
      } else {
        const { data } = await clientsApi.create(payload);
        finalId = data.id;
      }

      if (form.crearUsuario && finalId && form.email && form.userPassword) {
        try {
          await clientsApi.createUser(finalId, {
            email: form.email,
            password: form.userPassword
          });
        } catch (userErr: any) {
          console.error('[CreateUserError]', userErr);
          const detail = userErr?.response?.data?.message || userErr?.message || 'Error desconocido';
          setError(`Cliente guardado, pero error al crear usuario: ${detail}`);
          onSave(); // Refrescar lista igual ya que el cliente se guardó
          // No cerramos el modal para que el usuario proceda o corrija el email/pass
          setSaving(false);
          return;
        }
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al guardar el cliente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn('max-h-[88vh] flex flex-col p-0 gap-0', isMobile && 'max-h-[92vh] rounded-t-2xl')}>
        <DialogHeader className="shrink-0 border-b px-5 py-4">
          <DialogTitle>{editId ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="overflow-y-auto px-5 py-4">

            <FormSection title="🏢 Empresa">
              <Field label="Razón Social" value={form.razonSocial} onChange={set('razonSocial')} placeholder="Ej: Empresa SAS" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="RUT" value={form.rut} onChange={set('rut')} placeholder="210000000010" />
                <Field label="Nro. BPS" value={form.nroBps} onChange={set('nroBps')} placeholder="Opcional" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.tipoEmpresa || 'none'} onValueChange={(v) => setForm(f => ({ ...f, tipoEmpresa: v === 'none' ? '' : (v as TipoEmpresa) }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin especificar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin especificar</SelectItem>
                      {Object.entries(TIPO_EMPRESA_LABEL).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Giro / Actividad" value={form.giro} onChange={set('giro')} placeholder="Ej: Informática" />
                <Field label="Inicio actividades" type="date" value={form.fechaInicioActividades} onChange={set('fechaInicioActividades')} />
              </div>
              <Field label="Dirección" value={form.direccion} onChange={set('direccion')} placeholder="Ej: Calle 123, Ciudad, País" />
            </FormSection>

            {/* ── Obligaciones tributarias ── */}
            <FormSection title="📋 Obligaciones tributarias">
              <p className="-mt-1.5 text-xs text-muted-foreground">
                Determinan los vencimientos que se generan automáticamente.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TRIBUTOS_LABELS.map(({ key, label }) => (
                  <CheckField
                    key={key} label={label}
                    checked={form[key] as boolean}
                    onChange={v => setForm(f => ({ ...f, [key]: v }))}
                  />
                ))}
              </div>

              <div className="mt-4 pt-3 border-t">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Exoneraciones</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <CheckField label="Exoneración IVA" checked={form.exoneracionIva as boolean} onChange={v => setForm(f => ({ ...f, exoneracionIva: v }))} />
                  <CheckField label="Exoneración IRAE" checked={form.exoneracionIrae as boolean} onChange={v => setForm(f => ({ ...f, exoneracionIrae: v }))} />
                </div>
                {(form.exoneracionIva || form.exoneracionIrae) && (
                  <Field label="Detalle de exoneración" value={form.exoneracionDetalle as string} onChange={set('exoneracionDetalle')} placeholder="Resolución o motivo..." />
                )}
              </div>
            </FormSection>

            <FormSection title="👤 Datos personales (opcional)">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Lucas" />
                <Field label="Apellido" value={form.apellido} onChange={set('apellido')} placeholder="Ej: Martino" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CI" value={form.ci} onChange={set('ci')} placeholder="12345678" />
                <Field label="Teléfono" value={form.telefono} onChange={set('telefono')} placeholder="098 000 000" />
              </div>
              <Field label="Email" type="email" value={form.email} onChange={set('email')} />
              {(form.email.length > 3) && (
                <div className="mt-2 space-y-3">
                  <CheckField
                    label="Habilitar acceso al portal de cliente"
                    checked={form.crearUsuario as boolean}
                    onChange={v => setForm(f => ({ ...f, crearUsuario: v }))}
                  />
                  {form.crearUsuario && (
                    <div className="ml-1 pl-4 border-l-2 border-primary/20">
                      <Field label="Contraseña para el cliente" value={form.userPassword as string} onChange={set('userPassword')} required placeholder="Mínimo 6 caracteres" />
                      <p className="mt-1 text-xs text-muted-foreground">El usuario será el correo electrónico proporcionado arriba.</p>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2 mt-3">
                <Label>Notas</Label>
                <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} placeholder="Observaciones adicionales..." />
              </div>
            </FormSection>

          </div>

          {error && (
            <div className="mx-5 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <DialogFooter className="shrink-0 border-t px-5 py-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear cliente'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
    razonSocial: c.razonSocial ?? '', rut: c.rut ?? '', nroBps: c.nroBps ?? '',
    tipoEmpresa: c.tipoEmpresa ?? '',
    giro: c.giro ?? '',
    fechaInicioActividades: c.fechaInicioActividades
      ? c.fechaInicioActividades.slice(0, 10) : '',
    notas: c.notas ?? '',
    contribuyenteIva: c.contribuyenteIva, liquidaIrae: c.liquidaIrae,
    irpfCat1: c.irpfCat1, irpfCat2: c.irpfCat2, empleadorBps: c.empleadorBps,
    fonasa: c.fonasa, cjppu: c.cjppu, fondoSolidaridad: c.fondoSolidaridad,
    exoneracionIva: c.exoneracionIva || false, exoneracionIrae: c.exoneracionIrae || false, exoneracionDetalle: c.exoneracionDetalle ?? '',
    crearUsuario: false, userPassword: '',
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title="Clientes"
        description={loading ? 'Cargando...' : `${clients.length} cliente${clients.length !== 1 ? 's' : ''} registrado${clients.length !== 1 ? 's' : ''}`}
        actions={
          <Button onClick={() => { setEditClient(null); setModalOpen(true); }}>
            <Plus className="size-4" />
            {isMobile ? 'Nuevo' : 'Nuevo cliente'}
          </Button>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por nombre, RUT, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Cargando clientes...</div>
      ) : filtered.length === 0 ? (
        <Card className="py-12 text-center">
          <div className="mb-3 text-4xl">👥</div>
          <div className="font-medium text-foreground">
            {search ? 'No se encontraron resultados' : 'No hay clientes registrados'}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {search ? 'Probá con otro término de búsqueda' : 'Creá el primero con el botón de arriba'}
          </div>
        </Card>
      ) : isMobile ? (
        <div className="flex flex-col gap-3">
          {filtered.map(c => {
            const tributos = TRIBUTOS_LABELS.filter(t => c[t.key]);
            return (
              <Card key={c.id} className="cursor-pointer p-4" onClick={() => navigate(`/clients/${c.id}`)}>
                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-sm">
                    {c.nombre[0]}{c.apellido[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate font-semibold">{c.nombre} {c.apellido}</div>
                      <EstadoBadge estado={c.estado} />
                    </div>
                    {c.razonSocial && <div className="mt-0.5 text-sm text-muted-foreground">{c.razonSocial}</div>}
                    {c.rut && <div className="mt-1 font-mono text-xs text-muted-foreground">RUT: {c.rut}</div>}
                    {tributos.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">{tributos.map(t => <TributoBadge key={t.key} label={t.label} />)}</div>
                    )}
                    <div className="mt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(c)}>Editar</Button>
                      {c.estado === 'activo' && (
                        <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setConfirmDeactivate(c)}>
                          <UserX className="size-3" /> Desactivar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {['Cliente', 'RUT / Empresa', 'Tributos', 'Estado', 'Acciones'].map(h => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const tributos = TRIBUTOS_LABELS.filter(t => c[t.key]);
                return (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/clients/${c.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
                          {c.nombre[0]}{c.apellido[0]}
                        </div>
                        <div>
                          <div className="font-semibold">{c.nombre} {c.apellido}</div>
                          {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.rut ? (
                        <>
                          <div className="font-medium">{c.rut}</div>
                          {c.tipoEmpresa && <div className="text-xs text-muted-foreground">{TIPO_EMPRESA_LABEL[c.tipoEmpresa]}</div>}
                        </>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {tributos.length > 0 ? (
                        <div className="space-y-1">
                          {tributos.slice(0, 4).map(t => <TributoBadge key={t.key} label={t.label} />)}
                          {tributos.length > 4 && <span className="text-xs text-muted-foreground">+{tributos.length - 4} más</span>}
                        </div>
                      ) : <span className="text-muted-foreground">Sin configurar</span>}
                    </TableCell>
                    <TableCell><EstadoBadge estado={c.estado} /></TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(c)} title="Editar">
                          <Pencil className="size-4" />
                        </Button>
                        {c.estado === 'activo' && (
                          <Button variant="outline" size="icon" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setConfirmDeactivate(c)} title="Desactivar">
                            <UserX className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modal crear/editar */}
      <ClientModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditClient(null); }}
        onSave={load}
        initial={editClient ? toFormData(editClient) : undefined}
        editId={editClient?.id}
      />

      <Dialog open={!!confirmDeactivate} onOpenChange={(o) => !o && setConfirmDeactivate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Desactivar cliente?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            <strong>{confirmDeactivate?.nombre} {confirmDeactivate?.apellido}</strong> pasará a estado inactivo.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeactivate(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeactivate}>Desactivar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
