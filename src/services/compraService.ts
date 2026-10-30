// Caso de uso: Solicitar orden de compra (RF4, RF5, RF6, RF9)
import repo from '../data';
import type { Producto, SolicitudCompra } from '../data/tipos';
import { ahoraISO } from '../lib/formato';
import { ErrorValidacion } from './movimientoService';

export type EstadoReposicion = 'Normal' | 'Bajo punto de reorden' | 'Solicitud pendiente';

export interface ProductoReposicion extends Producto {
  estado: EstadoReposicion;
  solicitud: SolicitudCompra | null;
}

/** Lista productos con su estado de reposición (RN202: stock ≤ punto de reorden) */
export async function listarProductosReposicion(): Promise<ProductoReposicion[]> {
  const [productos, activas] = await Promise.all([repo.listarProductos(), repo.listarSolicitudesActivas()]);
  return productos.map((p) => {
    const solicitud = activas.find((s) => s.id_producto === p.id_producto) ?? null;
    const estado: EstadoReposicion = solicitud
      ? 'Solicitud pendiente'
      : p.stock_actual <= p.punto_reorden ? 'Bajo punto de reorden' : 'Normal';
    return { ...p, estado, solicitud };
  });
}

/** Cantidad sugerida: lo necesario para volver al stock máximo */
export const cantidadSugerida = (p: Producto) => Math.max(p.stock_maximo - p.stock_actual, 0);

export function validarCantidad(p: Producto, cantidad: number) {
  if (!(cantidad > 0) || p.stock_actual + cantidad > p.stock_maximo)
    throw new ErrorValidacion('Cantidad inválida o fuera de rango');
}

export async function emitirSolicitud(p: Producto, cantidad: number, idEmpleado: string) {
  if (await repo.buscarSolicitudActiva(p.id_producto))
    throw new ErrorValidacion('Este producto ya tiene una solicitud de reposición pendiente');
  validarCantidad(p, cantidad);
  // Al registrarse, el área de Compras recibe la notificación (trigger en Supabase)
  return repo.registrarSolicitud({
    id_producto: p.id_producto, id_empleado: idEmpleado, fecha_emision: ahoraISO(),
    cantidad_sugerida: cantidadSugerida(p), cantidad_solicitada: cantidad, estado_solicitud: 'Pendiente',
  });
}
