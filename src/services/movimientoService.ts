// Casos de uso: Registrar movimiento (abstracto), Registrar entrada de almacén,
// Registrar salida del almacén, Registrar ubicación y Registrar movimiento en KARDEX.
import repo from '../data';
import type { Lote, Movimiento, Producto, TipoMovimiento, UbicacionConOcupacion } from '../data/tipos';
import { ahoraISO } from '../lib/formato';

export class ErrorValidacion extends Error {}

/** Datos comunes de todo movimiento (caso de uso abstracto "Registrar movimiento") */
export async function validarDatosComunes(codigo: string, cantidad: number): Promise<Producto> {
  if (!codigo.trim()) throw new ErrorValidacion('Debe existir al menos un ítem'); // RF7
  const producto = await repo.buscarProductoPorCodigo(codigo);
  if (!producto) throw new ErrorValidacion('Producto no encontrado');
  if (!(cantidad > 0)) throw new ErrorValidacion('La cantidad debe ser mayor a cero'); // RF6
  return producto;
}

/** Calcula qué lotes respaldan una salida según FIFO (RF11, RN301) */
export async function calcularSalidaFIFO(producto: Producto, cantidad: number) {
  const lotes = await repo.listarLotesDisponibles(producto.id_producto); // ordenados por fecha de recepción
  const consumo: { lote: Lote; cantidad: number; subtotal: number }[] = [];
  let pendiente = cantidad;
  for (const lote of lotes) {
    if (pendiente === 0) break;
    const tomar = Math.min(lote.saldo_disponible, pendiente);
    consumo.push({ lote, cantidad: tomar, subtotal: +(tomar * lote.costo_unitario).toFixed(2) });
    pendiente -= tomar;
  }
  if (pendiente > 0) throw new ErrorValidacion('Stock disponible insuficiente'); // flujo alternativo 2
  const costoTotal = +consumo.reduce((s, c) => s + c.subtotal, 0).toFixed(2);
  return { consumo, costoTotal };
}

/** Caso incluido "Registrar ubicación": valida capacidad de la ubicación (RN104) */
export function validarUbicacion(ubicacion: UbicacionConOcupacion | undefined, cantidad: number) {
  if (!ubicacion) throw new ErrorValidacion('Seleccione una ubicación');
  if (cantidad > ubicacion.disponible) throw new ErrorValidacion('Capacidad excedida');
}

export interface DatosEntrada {
  producto: Producto;
  cantidad: number;
  costoUnitario: number;
  documentoIngreso: string;
  conforme: boolean;
  incidencia: string;
  ubicacion: UbicacionConOcupacion;
  idEmpleado: string;
}

export async function registrarEntrada(d: DatosEntrada) {
  if (!d.conforme && !d.incidencia.trim())
    throw new ErrorValidacion('Registre la discrepancia como incidencia para continuar');
  validarUbicacion(d.ubicacion, d.cantidad);
  const fecha = ahoraISO();
  return repo.registrarMovimiento({
    movimiento: {
      id_producto: d.producto.id_producto, id_empleado: d.idEmpleado,
      id_ubicacion_origen: null, id_ubicacion_destino: d.ubicacion.id_ubicacion,
      tipo_movimiento: 'Entrada', fecha_movimiento: fecha, cantidad_movimiento: d.cantidad,
      costo_total: +(d.cantidad * d.costoUnitario).toFixed(2),
      motivo_movimiento: d.conforme ? 'Recepción de mercancía' : `Recepción con incidencia: ${d.incidencia}`,
      documento_ingreso: d.documentoIngreso, mercancia_conforme: d.conforme, receptor: null,
    },
    lotes: [],
    nuevoLote: { // RN106: se registra la fecha de recepción del lote
      id_producto: d.producto.id_producto, fecha_recepcion: fecha, cantidad_inicial: d.cantidad,
      saldo_disponible: d.cantidad, costo_unitario: d.costoUnitario,
    },
  });
}

export interface DatosSalida {
  producto: Producto;
  cantidad: number;
  motivo: string;
  receptor: string;
  idEmpleado: string;
  idUbicacionOrigen?: number;
}

export async function registrarSalida(d: DatosSalida) {
  const { consumo, costoTotal } = await calcularSalidaFIFO(d.producto, d.cantidad);
  return repo.registrarMovimiento({
    movimiento: {
      id_producto: d.producto.id_producto, id_empleado: d.idEmpleado,
      id_ubicacion_origen: d.idUbicacionOrigen ?? null, id_ubicacion_destino: null,
      tipo_movimiento: 'Salida', fecha_movimiento: ahoraISO(), cantidad_movimiento: d.cantidad,
      costo_total: costoTotal, motivo_movimiento: d.motivo, documento_ingreso: null,
      mercancia_conforme: null, receptor: d.receptor || null,
    },
    lotes: consumo.map((c) => ({ id_lote: c.lote.id_lote, cantidad: c.cantidad, costo_unitario: c.lote.costo_unitario })),
  });
}

/** Registro genérico desde la pantalla "Registrar movimiento de producto" */
export async function registrarMovimientoGeneral(
  producto: Producto, cantidad: number, tipo: Exclude<TipoMovimiento, 'Ajuste'>,
  ubicacion: UbicacionConOcupacion, idEmpleado: string,
): Promise<{ movimiento: Movimiento; stockAnterior: number; stockNuevo: number }> {
  const stockAnterior = producto.stock_actual;
  let r;
  if (tipo === 'Entrada') {
    const lotes = await repo.listarLotesDisponibles(producto.id_producto);
    const costo = lotes.at(-1)?.costo_unitario ?? 0; // último costo conocido
    r = await registrarEntrada({
      producto, cantidad, costoUnitario: costo, documentoIngreso: 'MOV-INTERNO',
      conforme: true, incidencia: '', ubicacion, idEmpleado,
    });
  } else {
    r = await registrarSalida({ producto, cantidad, motivo: 'Movimiento interno', receptor: '', idEmpleado, idUbicacionOrigen: ubicacion.id_ubicacion });
  }
  return { movimiento: r.movimiento, stockAnterior, stockNuevo: r.kardex.saldo_cantidad };
}
