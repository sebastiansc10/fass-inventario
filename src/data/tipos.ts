// Tipos del dominio, alineados con el Modelo Físico de Datos (sección 3.6)

export type TipoItem = 'Insumo' | 'Producto terminado';
export type TipoMovimiento = 'Entrada' | 'Salida' | 'Ajuste';
export type EstadoAjuste = 'Aprobado' | 'Pendiente' | 'Rechazado';
export type EstadoStock = 'Normal' | 'Bajo punto de reorden' | 'Sin stock';

export interface Categoria {
  id_categoria: number;
  codigo_categoria: string;
  nombre_categoria: string;
}

export interface Producto {
  id_producto: number;
  id_categoria: number;
  codigo_producto: string;
  nombre_producto: string;
  descripcion_producto: string;
  tipo_item: TipoItem;
  unidad_medida: string;
  stock_actual: number;
  saldo_valorizado: number;
  stock_seguridad: number;
  punto_reorden: number;
  stock_maximo: number;
  activo: boolean;
}

export interface Ubicacion {
  id_ubicacion: number;
  codigo_ubicacion: string;
  zona: string;
  estante: string;
  nivel: string;
  capacidad_maxima: number;
}

export interface UbicacionConOcupacion extends Ubicacion {
  ocupado: number;
  disponible: number;
}

export interface Lote {
  id_lote: number;
  id_producto: number;
  codigo_lote: string;
  fecha_recepcion: string;
  cantidad_inicial: number;
  saldo_disponible: number;
  costo_unitario: number;
}

export interface LoteUbicacion {
  id_lote: number;
  id_ubicacion: number;
  cantidad: number;
}

export interface Empleado {
  id_empleado: string;
  codigo_empleado: string;
  nombre_empleado: string;
  cargo: 'Jefe de Almacén' | 'Gerente';
  usuario: string;
}

export interface Movimiento {
  id_movimiento: number;
  id_producto: number;
  id_empleado: string;
  id_ubicacion_origen: number | null;
  id_ubicacion_destino: number | null;
  tipo_movimiento: TipoMovimiento;
  fecha_movimiento: string;
  cantidad_movimiento: number;
  costo_total: number;
  motivo_movimiento: string;
  documento_ingreso: string | null;
  mercancia_conforme: boolean | null;
  receptor: string | null;
}

export interface MovimientoLote {
  id_movimiento: number;
  id_lote: number;
  cantidad: number;
  costo_unitario: number;
}

export interface Kardex {
  id_kardex: number;
  id_movimiento: number;
  id_producto: number;
  fecha_kardex: string;
  metodo_valorizacion: 'FIFO';
  saldo_cantidad: number;
  saldo_valorizado: number;
}

export interface MotivoAjuste {
  id_motivo: number;
  codigo_motivo: string;
  nombre_motivo: string;
  requiere_comentario: boolean;
}

export interface AjusteInventario {
  id_ajuste: number;
  id_producto: number;
  id_motivo: number;
  id_ubicacion: number;
  id_empleado_registra: string;
  id_empleado_aprueba: string | null;
  id_movimiento: number | null;
  stock_teorico: number;
  stock_fisico: number;
  diferencia: number;
  valor_ajuste: number;
  comentario: string;
  estado_ajuste: EstadoAjuste;
  fecha_registro: string;
  fecha_aprobacion: string | null;
}

export interface SolicitudCompra {
  id_solicitud: number;
  id_producto: number;
  id_empleado: string;
  codigo_solicitud: string;
  fecha_emision: string;
  cantidad_sugerida: number;
  cantidad_solicitada: number;
  estado_solicitud: 'Pendiente' | 'Atendida' | 'Anulada';
}

export interface HistorialReporte {
  id_reporte: number;
  id_empleado: string;
  tipo_reporte: 'Inventario' | 'Valorización';
  fecha_generacion: string;
  formato_exportacion: 'Pantalla' | 'PDF' | 'Excel';
  parametros: Record<string, unknown>;
}

/** Fila de kardex enriquecida para mostrar en pantalla */
export interface LineaKardex {
  fecha: string;
  tipo: TipoMovimiento;
  cantidad: number;
  costo_total: number;
  saldo_cantidad: number;
  saldo_valorizado: number;
  responsable: string;
  motivo: string;
}
