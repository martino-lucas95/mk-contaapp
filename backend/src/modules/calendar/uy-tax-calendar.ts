/**
 * uy-tax-calendar.ts
 * Lógica de vencimientos tributarios uruguayos.
 *
 * Fuente: DGI Uruguay — tabla de vencimientos por terminal de RUT.
 * Los vencimientos de IVA/IRAE/IRPF se determinan por el último dígito del RUT.
 * BPS, FONASA, CJPPU y Fondo de Solidaridad tienen fechas fijas.
 *
 * Referencia DGI: https://www.dgi.gub.uy/wdgi/page?2,contribuyentes,vencimientos
 */

import { TipoVencimiento } from './vencimiento.entity';
import { PerfilTributario } from './calendar.types';

// ─── Tabla IVA mensual por terminal de RUT ────────────────────────────────────
// El día de vencimiento del mes SIGUIENTE al período liquidado
// Terminal 0 y 1 → día 7, terminal 2 y 3 → día 9, etc.
const IVA_VENCIMIENTO_POR_TERMINAL: Record<number, number> = {
  0: 7,
  1: 7,
  2: 9,
  3: 9,
  4: 11,
  5: 11,
  6: 13,
  7: 13,
  8: 15,
  9: 15,
};

// ─── Tabla IRAE anticipos mensuales por terminal ──────────────────────────────
// Mismo esquema que IVA pero 2 días después
const IRAE_ANTICIPO_POR_TERMINAL: Record<number, number> = {
  0: 9,
  1: 9,
  2: 11,
  3: 11,
  4: 13,
  5: 13,
  6: 15,
  7: 15,
  8: 17,
  9: 17,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrae el último dígito del RUT (dígito verificador excluido) */
export function terminalRUT(rut: string): number {
  // RUT formato: "21.234.567-8" o "212345678" — tomamos el penúltimo dígito
  const digits = rut.replace(/\D/g, '');
  if (digits.length < 2) return 0;
  return parseInt(digits[digits.length - 2], 10);
}

/** Avanza la fecha si cae sábado o domingo al siguiente lunes hábil */
function ajustarHabil(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay(); // 0=dom, 6=sab
  if (dow === 6) d.setDate(d.getDate() + 2);
  if (dow === 0) d.setDate(d.getDate() + 1);
  return d;
}

/** Construye una fecha y la ajusta a día hábil */
function fechaHabil(year: number, month: number, day: number): Date {
  return ajustarHabil(new Date(year, month - 1, day));
}

/** Formatea Date → "YYYY-MM-DD" */
function fmt(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Último día del mes */
function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface VencimientoGenerado {
  tipo: TipoVencimiento;
  descripcion: string;
  fechaVencimiento: string; // YYYY-MM-DD
  periodo: string;          // YYYY-MM
  esPersonalizado: false;
}

// ─── Generador principal ──────────────────────────────────────────────────────

/**
 * Genera todos los vencimientos de un cliente para un año dado.
 * Se basa en el perfil tributario y el RUT del cliente.
 *
 * @param rut          RUT del cliente (con o sin puntos/guiones)
 * @param perfil       Flags del perfil tributario
 * @param year         Año a generar (default: año actual)
 */
export function generarVencimientosAnuales(
  rut: string,
  perfil: PerfilTributario,
  year: number = new Date().getFullYear(),
): VencimientoGenerado[] {
  const vencimientos: VencimientoGenerado[] = [];
  const terminal = terminalRUT(rut);

  for (let mes = 1; mes <= 12; mes++) {
    const periodo = `${year}-${String(mes).padStart(2, '0')}`;

    // ── IVA mensual ──────────────────────────────────────────────────────────
    if (perfil.contribuyenteIva) {
      // Vence el mes siguiente
      const mesVenc = mes === 12 ? 1 : mes + 1;
      const yearVenc = mes === 12 ? year + 1 : year;
      const dia = IVA_VENCIMIENTO_POR_TERMINAL[terminal];
      vencimientos.push({
        tipo: TipoVencimiento.IVA,
        descripcion: `IVA mensual — ${periodoLabel(periodo)}`,
        fechaVencimiento: fmt(fechaHabil(yearVenc, mesVenc, dia)),
        periodo,
        esPersonalizado: false,
      });
    }

    // ── IRAE anticipos mensuales ──────────────────────────────────────────────
    if (perfil.liquidaIrae) {
      const mesVenc = mes === 12 ? 1 : mes + 1;
      const yearVenc = mes === 12 ? year + 1 : year;
      const dia = IRAE_ANTICIPO_POR_TERMINAL[terminal];
      vencimientos.push({
        tipo: TipoVencimiento.IRAE_ANTICIPO,
        descripcion: `IRAE anticipo mensual — ${periodoLabel(periodo)}`,
        fechaVencimiento: fmt(fechaHabil(yearVenc, mesVenc, dia)),
        periodo,
        esPersonalizado: false,
      });
    }

    // ── IRPF Categoría II — retención mensual ─────────────────────────────────
    // Vence el mismo mes en que se retiene, día 20 aprox.
    if (perfil.irpfCat2) {
      vencimientos.push({
        tipo: TipoVencimiento.IRPF_CAT2,
        descripcion: `IRPF Cat. II retención — ${periodoLabel(periodo)}`,
        fechaVencimiento: fmt(fechaHabil(year, mes, 20)),
        periodo,
        esPersonalizado: false,
      });
    }

    // ── BPS patronal — mensual ────────────────────────────────────────────────
    // Vence el último día hábil del mes siguiente al período
    if (perfil.empleadorBps) {
      const mesVenc = mes === 12 ? 1 : mes + 1;
      const yearVenc = mes === 12 ? year + 1 : year;
      const ultimo = lastDayOfMonth(yearVenc, mesVenc);
      vencimientos.push({
        tipo: TipoVencimiento.BPS_PATRONAL,
        descripcion: `BPS patronal — ${periodoLabel(periodo)}`,
        fechaVencimiento: fmt(fechaHabil(yearVenc, mesVenc, ultimo)),
        periodo,
        esPersonalizado: false,
      });
    }

    // ── BPS personal (autónomo) — mensual ─────────────────────────────────────
    if (perfil.irpfCat1 && !perfil.empleadorBps) {
      const mesVenc = mes === 12 ? 1 : mes + 1;
      const yearVenc = mes === 12 ? year + 1 : year;
      vencimientos.push({
        tipo: TipoVencimiento.BPS_PERSONAL,
        descripcion: `BPS personal autónomo — ${periodoLabel(periodo)}`,
        fechaVencimiento: fmt(fechaHabil(yearVenc, mesVenc, 20)),
        periodo,
        esPersonalizado: false,
      });
    }

    // ── FONASA — mensual, vence día 10 del mes siguiente ─────────────────────
    if (perfil.fonasa) {
      const mesVenc = mes === 12 ? 1 : mes + 1;
      const yearVenc = mes === 12 ? year + 1 : year;
      vencimientos.push({
        tipo: TipoVencimiento.FONASA,
        descripcion: `FONASA — ${periodoLabel(periodo)}`,
        fechaVencimiento: fmt(fechaHabil(yearVenc, mesVenc, 10)),
        periodo,
        esPersonalizado: false,
      });
    }

    // ── CJPPU — mensual, vence último día hábil del mes ──────────────────────
    if (perfil.cjppu) {
      const ultimo = lastDayOfMonth(year, mes);
      vencimientos.push({
        tipo: TipoVencimiento.CJPPU,
        descripcion: `CJPPU mensual — ${periodoLabel(periodo)}`,
        fechaVencimiento: fmt(fechaHabil(year, mes, ultimo)),
        periodo,
        esPersonalizado: false,
      });
    }
  }

  // ── Vencimientos anuales (no se repiten por mes) ───────────────────────────

  // IRAE liquidación anual — vence 4 meses después del cierre del ejercicio
  // Para ejercicio calendar year: cierre 31/12, vence ~30 abril año siguiente
  if (perfil.liquidaIrae) {
    vencimientos.push({
      tipo: TipoVencimiento.IRAE_LIQUIDACION,
      descripcion: `IRAE liquidación anual — ejercicio ${year}`,
      fechaVencimiento: fmt(fechaHabil(year + 1, 4, 30)),
      periodo: `${year}-12`,
      esPersonalizado: false,
    });
  }

  // IRPF Categoría I — DJ anual, vence en junio del año siguiente
  if (perfil.irpfCat1) {
    vencimientos.push({
      tipo: TipoVencimiento.IRPF_CAT1,
      descripcion: `IRPF Cat. I DJ anual — ejercicio ${year}`,
      fechaVencimiento: fmt(fechaHabil(year + 1, 6, 30)),
      periodo: `${year}-12`,
      esPersonalizado: false,
    });
  }

  // Fondo de Solidaridad — cuota anual, vence en marzo
  if (perfil.fondoSolidaridad) {
    vencimientos.push({
      tipo: TipoVencimiento.FONDO_SOLIDARIDAD,
      descripcion: `Fondo de Solidaridad — cuota anual ${year}`,
      fechaVencimiento: fmt(fechaHabil(year, 3, 31)),
      periodo: `${year}-03`,
      esPersonalizado: false,
    });
    // Segunda cuota: septiembre
    vencimientos.push({
      tipo: TipoVencimiento.FONDO_SOLIDARIDAD,
      descripcion: `Fondo de Solidaridad — 2ª cuota ${year}`,
      fechaVencimiento: fmt(fechaHabil(year, 9, 30)),
      periodo: `${year}-09`,
      esPersonalizado: false,
    });
  }

  // DJ anual genérica (balance + estados contables) — vence 30 de abril
  vencimientos.push({
    tipo: TipoVencimiento.DJ_ANUAL,
    descripcion: `DJ anual — ejercicio ${year}`,
    fechaVencimiento: fmt(fechaHabil(year + 1, 4, 30)),
    periodo: `${year}-12`,
    esPersonalizado: false,
  });

  // Ordenar por fecha
  return vencimientos.sort(
    (a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime(),
  );
}

/**
 * Genera vencimientos solo para el mes actual + N meses siguientes.
 * Útil para el dashboard de "próximos vencimientos".
 */
export function generarVencimientosPorPeriodo(
  rut: string,
  perfil: PerfilTributario,
  mesesAdelante: number = 3,
): VencimientoGenerado[] {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const todos = generarVencimientosAnuales(rut, perfil, year);

  // Si nos acercamos a fin de año, incluir el siguiente también
  const todosNext =
    hoy.getMonth() >= 9
      ? generarVencimientosAnuales(rut, perfil, year + 1)
      : [];

  const limite = new Date(hoy);
  limite.setMonth(limite.getMonth() + mesesAdelante);

  return [...todos, ...todosNext].filter((v) => {
    const f = new Date(v.fechaVencimiento);
    return f >= hoy && f <= limite;
  });
}

/** Label legible para un período YYYY-MM → "Enero 2026" */
function periodoLabel(periodo: string): string {
  const [y, m] = periodo.split('-');
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${meses[parseInt(m) - 1]} ${y}`;
}
