export type UserRole = 'admin' | 'contador' | 'cliente';
export interface AuthUser { id: string; nombre: string; apellido: string; email: string; role: UserRole; }
export interface AuthTokens { accessToken: string; refreshToken: string; user: AuthUser; }
export type TipoEmpresa = 'unipersonal' | 'sas' | 'sa' | 'srl' | 'otro';
export type EstadoCliente = 'activo' | 'inactivo' | 'suspendido';
export interface PerfilTributario { contribuyenteIva: boolean; liquidaIrae: boolean; irpfCat1: boolean; irpfCat2: boolean; empleadorBps: boolean; fonasa: boolean; cjppu: boolean; fondoSolidaridad: boolean; }
export interface Client extends PerfilTributario { id: string; contadorId: string; usuarioClienteId?: string; nombre: string; apellido: string; ci?: string; telefono?: string; email?: string; direccion?: string; razonSocial?: string; rut?: string; tipoEmpresa?: TipoEmpresa; giro?: string; fechaInicioActividades?: string; estado: EstadoCliente; notas?: string; createdAt: string; updatedAt: string; }
export type PlataformaCredencial = 'dgi' | 'bps' | 'facturacion_electronica' | 'cjppu' | 'fonasa' | 'banco' | 'otro';
export interface Credential { id: string; clientId: string; plataforma: PlataformaCredencial; nombrePlataforma?: string; usuario?: string; passwordDesencriptado?: string; pin?: string; notas?: string; vigente: boolean; }
export type TipoVencimiento = 'iva' | 'irae_anticipo' | 'irae_liquidacion' | 'irpf_cat1' | 'irpf_cat2' | 'bps_patronal' | 'bps_personal' | 'fonasa' | 'cjppu' | 'fondo_solidaridad' | 'dj_anual' | 'personalizado';
export type EstadoVencimiento = 'pendiente' | 'completado' | 'vencido' | 'alertado';
export interface Vencimiento { id: string; clientId: string; tipo: TipoVencimiento; descripcion?: string; fechaVencimiento: string; periodo?: string; estado: EstadoVencimiento; notas?: string; esPersonalizado: boolean; }
export type EstadoBoleto = 'pendiente_emitir' | 'emitido' | 'pagado' | 'vencido';
export interface BoletoPago { id: string; clientId: string; tipoImpuesto: TipoVencimiento; periodo: string; monto?: number; estado: EstadoBoleto; fechaEmision?: string; fechaVencimiento?: string; fechaPago?: string; confirmadoPorId?: string; notas?: string; }
export type EstadoHonorario = 'al_dia' | 'pendiente' | 'vencido';
export type FormaPago = 'efectivo' | 'transferencia' | 'otro';
export interface Honorario { id: string; clientId: string; periodo: string; montoAcordado: number; montoCobrado: number; fechaCobro?: string; formaPago?: FormaPago; estado: EstadoHonorario; notas?: string; }
export type TipoMovimiento = 'venta' | 'compra' | 'gasto';
export interface Movimiento { id: string; clientId: string; tipo: TipoMovimiento; fecha: string; descripcion?: string; monto: number; ivaIncluido: boolean; tasaIva?: number; categoria?: string; nroComprobante?: string; adjuntoUrl?: string; notas?: string; }
export type TipoNotificacion = 'vencimiento_proximo' | 'boleto_pendiente' | 'honorario_vencido' | 'pago_confirmado' | 'consulta_recibida' | 'consulta_respondida' | 'sistema';
export interface Notificacion { id: string; usuarioId: string; tipo: TipoNotificacion; mensaje: string; leido: boolean; referenciaId?: string; referenciaTipo?: string; createdAt: string; }
