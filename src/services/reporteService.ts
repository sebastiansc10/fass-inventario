// Casos de uso: Generar reporte de inventario y Generar reporte de valorización (RF2, RF3, RF8, RF11)
import repo from '../data';
import type { EstadoStock, LineaKardex, Producto, TipoItem } from '../data/tipos';
import { ErrorValidacion } from './movimientoService';
import { ahoraISO, hoyISO } from '../lib/formato';

export interface FiltrosInventario {
  fecha: string; // yyyy-mm-ddThh:mm
  tipo: TipoItem | 'Todos';
  idCategoria: number | 0;
  estado: EstadoStock | 'Todos';
}

export interface FilaInventario {
  producto: Producto;
  stock: number;
  valorizado: number;
  lotes: string[];
  estado: EstadoStock;
}

export const estadoStock = (stock: number, reorden: number): EstadoStock =>
  stock === 0 ? 'Sin stock' : stock <= reorden ? 'Bajo punto de reorden' : 'Normal';

/** Stock de cada ítem a una fecha, leído del KARDEX (RN303) */
export async function generarReporteInventario(f: FiltrosInventario, idEmpleado = '', guardarHistorial = true): Promise<FilaInventario[]> {
  if (new Date(f.fecha) > new Date()) throw new ErrorValidacion('La fecha de consulta no puede ser posterior a la actual');
  const hasta = f.fecha.length === 16 ? `${f.fecha}:59` : f.fecha; // incluye todo el minuto consultado
  const productos = (await repo.listarProductos()).filter(
    (p) => (f.tipo === 'Todos' || p.tipo_item === f.tipo) && (!f.idCategoria || p.id_categoria === f.idCategoria),
  );
  const filas: FilaInventario[] = [];
  for (const p of productos) {
    const kdx = (await repo.listarKardex(p.id_producto)).filter((k) => k.fecha_kardex <= hasta);
    const ultimo = kdx.at(-1);
    const stock = ultimo?.saldo_cantidad ?? 0;
    const lotes = (await repo.listarLotesDisponibles(p.id_producto)).map((l) => l.codigo_lote);
    const fila = { producto: p, stock, valorizado: ultimo?.saldo_valorizado ?? 0, lotes, estado: estadoStock(stock, p.punto_reorden) };
    if (f.estado === 'Todos' || fila.estado === f.estado) filas.push(fila);
  }
  if (filas.length === 0) throw new ErrorValidacion('No se encontraron ítems para los criterios seleccionados');
  if (guardarHistorial) await repo.registrarHistorialReporte({ id_empleado: idEmpleado, tipo_reporte: 'Inventario', fecha_generacion: new Date().toISOString(), formato_exportacion: 'Pantalla', parametros: { ...f } });
  return filas;
}

export async function detalleMovimientos(idProducto: number): Promise<LineaKardex[]> {
  const kdx = await repo.listarKardex(idProducto);
  const nombres = new Map<string, string>();
  for (const k of kdx) {
    if (!nombres.has(k.movimiento.id_empleado))
      nombres.set(k.movimiento.id_empleado, (await repo.obtenerEmpleado(k.movimiento.id_empleado))?.nombre_empleado ?? '—');
  }
  return kdx.map((k) => ({
    fecha: k.fecha_kardex, tipo: k.movimiento.tipo_movimiento, cantidad: k.movimiento.cantidad_movimiento,
    costo_total: k.movimiento.costo_total, saldo_cantidad: k.saldo_cantidad, saldo_valorizado: k.saldo_valorizado,
    responsable: nombres.get(k.movimiento.id_empleado)!, motivo: k.movimiento.motivo_movimiento,
  }));
}

export interface FilaValorizacion {
  producto: Producto;
  valorInicial: number;
  entradas: number;
  costoSalidas: number;
  ajustes: number;
  valorFinal: number;
}

export async function contarAjustesPendientes(desde: string, hasta: string) {
  return (await repo.listarAjustes('Pendiente')).filter((a) => a.fecha_registro >= desde && a.fecha_registro <= hasta).length;
}

/** Valorización del periodo bajo FIFO: inicial + entradas − salidas ± ajustes = final */
export async function generarReporteValorizacion(desde: string, hasta: string, tipo: TipoItem | 'Todos', idCategoria: number, idEmpleado = '') {
  if (!desde || !hasta || desde > hasta || hasta > hoyISO())
    throw new ErrorValidacion('El periodo ingresado no es válido');
  const base = { tipo, idCategoria, estado: 'Todos' as const };
  const fin = hasta === hoyISO() ? ahoraISO() : `${hasta}T23:59:59`;
  const iniciales = await generarReporteInventario({ ...base, fecha: `${desde}T00:00:00` }, idEmpleado, false).catch(() => []);
  const finales = await generarReporteInventario({ ...base, fecha: fin }, idEmpleado, false);
  const movs = await repo.listarMovimientos(`${desde}T00:00:00`, fin);

  const filas: FilaValorizacion[] = finales.map((f) => {
    const id = f.producto.id_producto;
    const ini = iniciales.find((i) => i.producto.id_producto === id)?.valorizado ?? 0;
    const delProducto = movs.filter((m) => m.id_producto === id);
    const suma = (t: string) => delProducto.filter((m) => m.tipo_movimiento === t).reduce((s, m) => s + m.costo_total, 0);
    return {
      producto: f.producto, valorInicial: ini, entradas: suma('Entrada'), costoSalidas: suma('Salida'),
      ajustes: +(f.valorizado - ini - suma('Entrada') + suma('Salida')).toFixed(2), valorFinal: f.valorizado,
    };
  });
  if (filas.every((f) => f.valorInicial === 0 && f.valorFinal === 0)) throw new ErrorValidacion('No hay datos para valorizar en el periodo');
  await repo.registrarHistorialReporte({ id_empleado: idEmpleado, tipo_reporte: 'Valorización', fecha_generacion: new Date().toISOString(), formato_exportacion: 'Pantalla', parametros: { desde, hasta, tipo, idCategoria } });
  return filas;
}

/** Exporta una tabla a CSV (se abre en Excel) */
export function exportarCSV(nombre: string, cabecera: string[], filas: (string | number)[][]) {
  const csv = [cabecera, ...filas].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `${nombre}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}
