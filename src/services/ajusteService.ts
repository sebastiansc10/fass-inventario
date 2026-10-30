// Caso de uso: Registrar ajuste manual (RF10; RN301, RN302, RN306)
import repo from '../data';
import type { AjusteInventario, MotivoAjuste, Producto } from '../data/tipos';
import { ahoraISO } from '../lib/formato';
import { ErrorValidacion, calcularSalidaFIFO } from './movimientoService';

/** Umbral de aprobación: diferencias mayores al 4 % del inventario requieren al Gerente */
export const UMBRAL_AJUSTE = 0.04;

export interface SolicitudAjuste {
  producto: Producto;
  idUbicacion: number;
  stockFisico: number;
  motivo: MotivoAjuste | null;
  comentario: string;
  idEmpleado: string;
}

export async function solicitarAjuste(s: SolicitudAjuste): Promise<AjusteInventario> {
  if (!s.motivo) throw new ErrorValidacion('Seleccione un motivo de ajuste');
  if (s.motivo.requiere_comentario && !s.comentario.trim())
    throw new ErrorValidacion('El comentario es obligatorio para el motivo «Producto dañado»');
  if (!(s.stockFisico >= 0) || !Number.isInteger(s.stockFisico))
    throw new ErrorValidacion('Ingrese un conteo físico válido');

  const stockTeorico = s.producto.stock_actual;
  const diferencia = s.stockFisico - stockTeorico;
  if (diferencia === 0) throw new ErrorValidacion('El stock físico coincide con el teórico; no hay ajuste que registrar');

  const lotes = await repo.listarLotesDisponibles(s.producto.id_producto);
  const costoRef = diferencia < 0
    ? (await calcularSalidaFIFO(s.producto, -diferencia)).costoTotal / -diferencia
    : lotes.at(-1)?.costo_unitario ?? 0;
  const valorAjuste = +(diferencia * costoRef).toFixed(2);

  const superaUmbral = Math.abs(diferencia) > stockTeorico * UMBRAL_AJUSTE;
  const ajuste = await repo.registrarAjuste({
    id_producto: s.producto.id_producto, id_motivo: s.motivo.id_motivo, id_ubicacion: s.idUbicacion,
    id_empleado_registra: s.idEmpleado, id_empleado_aprueba: null, id_movimiento: null,
    stock_teorico: stockTeorico, stock_fisico: s.stockFisico, diferencia, valor_ajuste: valorAjuste,
    comentario: s.comentario.trim(), estado_ajuste: superaUmbral ? 'Pendiente' : 'Aprobado',
    fecha_registro: ahoraISO(), fecha_aprobacion: null,
  });

  if (!superaUmbral) await aplicarAjuste(ajuste, s.idEmpleado);
  return { ...ajuste, estado_ajuste: superaUmbral ? 'Pendiente' : 'Aprobado' };
}

/** Lleva el ajuste aprobado al KARDEX como movimiento de tipo «Ajuste» (RN304: nunca se edita el kardex) */
async function aplicarAjuste(ajuste: AjusteInventario, idAprobador: string) {
  const producto = (await repo.listarProductos()).find((p) => p.id_producto === ajuste.id_producto)!;
  const cantidad = Math.abs(ajuste.diferencia);
  const motivo = (await repo.listarMotivos()).find((m) => m.id_motivo === ajuste.id_motivo)!;
  const base = {
    id_producto: producto.id_producto, id_empleado: ajuste.id_empleado_registra,
    tipo_movimiento: 'Ajuste' as const, fecha_movimiento: ahoraISO(), cantidad_movimiento: cantidad,
    costo_total: Math.abs(ajuste.valor_ajuste), motivo_movimiento: `${motivo.nombre_motivo}${ajuste.comentario ? ': ' + ajuste.comentario : ''}`,
    documento_ingreso: null, mercancia_conforme: null, receptor: null,
  };
  let r;
  if (ajuste.diferencia < 0) {
    const { consumo } = await calcularSalidaFIFO(producto, cantidad);
    r = await repo.registrarMovimiento({
      movimiento: { ...base, id_ubicacion_origen: ajuste.id_ubicacion, id_ubicacion_destino: null },
      lotes: consumo.map((c) => ({ id_lote: c.lote.id_lote, cantidad: c.cantidad, costo_unitario: c.lote.costo_unitario })),
    });
  } else {
    r = await repo.registrarMovimiento({
      movimiento: { ...base, id_ubicacion_origen: null, id_ubicacion_destino: ajuste.id_ubicacion },
      lotes: [],
      nuevoLote: { id_producto: producto.id_producto, fecha_recepcion: base.fecha_movimiento, cantidad_inicial: cantidad, saldo_disponible: cantidad, costo_unitario: ajuste.valor_ajuste / cantidad },
    });
  }
  await repo.actualizarAjuste(ajuste.id_ajuste, {
    estado_ajuste: 'Aprobado', id_empleado_aprueba: idAprobador,
    fecha_aprobacion: ahoraISO(), id_movimiento: r.movimiento.id_movimiento,
  });
}

/** El Gerente aprueba o rechaza un ajuste pendiente */
export async function resolverAjuste(ajuste: AjusteInventario, aprobar: boolean, idGerente: string) {
  if (ajuste.estado_ajuste !== 'Pendiente') throw new ErrorValidacion('El ajuste ya fue resuelto');
  if (aprobar) await aplicarAjuste(ajuste, idGerente);
  else await repo.actualizarAjuste(ajuste.id_ajuste, { estado_ajuste: 'Rechazado', id_empleado_aprueba: idGerente, fecha_aprobacion: ahoraISO() });
}

export async function ultimoAjuste(idProducto: number) {
  const todos = await repo.listarAjustes();
  return todos.filter((a) => a.id_producto === idProducto).sort((a, b) => b.fecha_registro.localeCompare(a.fecha_registro))[0] ?? null;
}
