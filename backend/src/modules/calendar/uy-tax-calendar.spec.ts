/**
 * uy-tax-calendar.spec.ts
 * Tests unitarios del generador de vencimientos tributarios uruguayos.
 *
 * Para correr: npx jest uy-tax-calendar
 */

import {
  generarVencimientosAnuales,
  generarVencimientosPorPeriodo,
  terminalRUT,
} from './uy-tax-calendar';
import { TipoVencimiento } from './vencimiento.entity';

// ─── Perfil tributario de prueba ──────────────────────────────────────────────
const PERFIL_COMPLETO = {
  contribuyenteIva:  true,
  liquidaIrae:       true,
  irpfCat1:          true,
  irpfCat2:          true,
  empleadorBps:      true,
  fonasa:            true,
  cjppu:             true,
  fondoSolidaridad:  true,
};

const PERFIL_MINIMO = {
  contribuyenteIva:  false,
  liquidaIrae:       false,
  irpfCat1:          false,
  irpfCat2:          false,
  empleadorBps:      false,
  fonasa:            false,
  cjppu:             false,
  fondoSolidaridad:  false,
};

// ─── Test: terminal de RUT ────────────────────────────────────────────────────
describe('terminalRUT', () => {
  it('extrae el penúltimo dígito (dígito significativo)', () => {
    expect(terminalRUT('21.345.678-9')).toBe(7);   // 678 → 7
    expect(terminalRUT('21.456.789-0')).toBe(8);   // 789 → 8
    expect(terminalRUT('212345670')).toBe(7);
  });

  it('maneja RUT sin formato', () => {
    expect(terminalRUT('210000001')).toBe(0);
  });
});

// ─── Test: generación anual ───────────────────────────────────────────────────
describe('generarVencimientosAnuales', () => {
  const RUT_TERMINAL_7 = '21.345.678-9';  // terminal 7 → IVA día 13
  const YEAR = 2026;

  it('genera vencimientos para perfil completo', () => {
    const v = generarVencimientosAnuales(RUT_TERMINAL_7, PERFIL_COMPLETO, YEAR);
    expect(v.length).toBeGreaterThan(0);
  });

  it('no genera vencimientos para perfil vacío (solo DJ anual)', () => {
    const v = generarVencimientosAnuales(RUT_TERMINAL_7, PERFIL_MINIMO, YEAR);
    // Solo debería haber la DJ anual genérica
    expect(v.length).toBe(1);
    expect(v[0].tipo).toBe(TipoVencimiento.DJ_ANUAL);
  });

  it('IVA terminal 7 vence el día 13 del mes siguiente', () => {
    const v = generarVencimientosAnuales(RUT_TERMINAL_7, PERFIL_COMPLETO, YEAR);
    const ivaEnero = v.find(
      (x) => x.tipo === TipoVencimiento.IVA && x.periodo === '2026-01',
    );
    expect(ivaEnero).toBeDefined();
    // IVA enero 2026 vence en febrero 2026
    expect(ivaEnero!.fechaVencimiento.startsWith('2026-02')).toBe(true);
    // Día 13 o ajustado a hábil
    const dia = parseInt(ivaEnero!.fechaVencimiento.split('-')[2]);
    expect(dia).toBeGreaterThanOrEqual(13);
    expect(dia).toBeLessThanOrEqual(15); // máximo ajuste por fin de semana
  });

  it('IVA terminal 0 vence el día 7 del mes siguiente', () => {
    const RUT_0 = '21.000.000-1'; // terminal 0
    const v = generarVencimientosAnuales(RUT_0, { ...PERFIL_MINIMO, contribuyenteIva: true }, YEAR);
    const ivaEnero = v.find(
      (x) => x.tipo === TipoVencimiento.IVA && x.periodo === '2026-01',
    );
    expect(ivaEnero).toBeDefined();
    const dia = parseInt(ivaEnero!.fechaVencimiento.split('-')[2]);
    expect(dia).toBeGreaterThanOrEqual(7);
    expect(dia).toBeLessThanOrEqual(9);
  });

  it('genera 12 vencimientos de IVA para contribuyente mensual', () => {
    const v = generarVencimientosAnuales(RUT_TERMINAL_7, { ...PERFIL_MINIMO, contribuyenteIva: true }, YEAR);
    const ivaVenc = v.filter((x) => x.tipo === TipoVencimiento.IVA);
    expect(ivaVenc.length).toBe(12);
  });

  it('genera 12 vencimientos de FONASA para quien corresponda', () => {
    const v = generarVencimientosAnuales(RUT_TERMINAL_7, { ...PERFIL_MINIMO, fonasa: true }, YEAR);
    const fonasaVenc = v.filter((x) => x.tipo === TipoVencimiento.FONASA);
    expect(fonasaVenc.length).toBe(12);
  });

  it('FONASA vence el día 10 del mes siguiente', () => {
    const v = generarVencimientosAnuales(RUT_TERMINAL_7, { ...PERFIL_MINIMO, fonasa: true }, YEAR);
    const fonasaEnero = v.find(
      (x) => x.tipo === TipoVencimiento.FONASA && x.periodo === '2026-01',
    );
    expect(fonasaEnero).toBeDefined();
    expect(fonasaEnero!.fechaVencimiento.startsWith('2026-02')).toBe(true);
    const dia = parseInt(fonasaEnero!.fechaVencimiento.split('-')[2]);
    expect(dia).toBeGreaterThanOrEqual(10);
    expect(dia).toBeLessThanOrEqual(12);
  });

  it('Fondo de Solidaridad genera 2 cuotas anuales', () => {
    const v = generarVencimientosAnuales(RUT_TERMINAL_7, { ...PERFIL_MINIMO, fondoSolidaridad: true }, YEAR);
    const fs = v.filter((x) => x.tipo === TipoVencimiento.FONDO_SOLIDARIDAD);
    expect(fs.length).toBe(2);
    // Primera cuota: marzo
    expect(fs[0].fechaVencimiento.startsWith('2026-03')).toBe(true);
    // Segunda cuota: septiembre
    expect(fs[1].fechaVencimiento.startsWith('2026-09')).toBe(true);
  });

  it('IRAE liquidación anual vence en abril del año siguiente', () => {
    const v = generarVencimientosAnuales(RUT_TERMINAL_7, { ...PERFIL_MINIMO, liquidaIrae: true }, YEAR);
    const irae = v.find((x) => x.tipo === TipoVencimiento.IRAE_LIQUIDACION);
    expect(irae).toBeDefined();
    expect(irae!.fechaVencimiento.startsWith('2027-04')).toBe(true);
  });

  it('los vencimientos están ordenados por fecha', () => {
    const v = generarVencimientosAnuales(RUT_TERMINAL_7, PERFIL_COMPLETO, YEAR);
    for (let i = 1; i < v.length; i++) {
      expect(new Date(v[i].fechaVencimiento).getTime()).toBeGreaterThanOrEqual(
        new Date(v[i - 1].fechaVencimiento).getTime(),
      );
    }
  });

  it('ningún vencimiento cae sábado o domingo', () => {
    const v = generarVencimientosAnuales(RUT_TERMINAL_7, PERFIL_COMPLETO, YEAR);
    for (const venc of v) {
      const dow = new Date(venc.fechaVencimiento + 'T12:00:00').getDay();
      expect(dow).not.toBe(0); // no domingo
      expect(dow).not.toBe(6); // no sábado
    }
  });

  it('IVA diciembre vence en enero del año siguiente', () => {
    const v = generarVencimientosAnuales(RUT_TERMINAL_7, { ...PERFIL_MINIMO, contribuyenteIva: true }, YEAR);
    const ivaDic = v.find(
      (x) => x.tipo === TipoVencimiento.IVA && x.periodo === '2026-12',
    );
    expect(ivaDic).toBeDefined();
    expect(ivaDic!.fechaVencimiento.startsWith('2027-01')).toBe(true);
  });
});

// ─── Test: generación por período ─────────────────────────────────────────────
describe('generarVencimientosPorPeriodo', () => {
  it('solo devuelve vencimientos dentro del rango', () => {
    const v = generarVencimientosPorPeriodo('21.345.678-9', PERFIL_COMPLETO, 2);
    const hoy = new Date();
    const limite = new Date(hoy);
    limite.setMonth(limite.getMonth() + 2);

    for (const venc of v) {
      const f = new Date(venc.fechaVencimiento);
      expect(f.getTime()).toBeGreaterThanOrEqual(hoy.getTime() - 86400000); // tolerancia 1 día
      expect(f.getTime()).toBeLessThanOrEqual(limite.getTime() + 86400000);
    }
  });
});
