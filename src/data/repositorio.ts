// Contrato de acceso a datos. La capa de servicios depende solo de esta interfaz,
// de modo que el sistema funciona igual con Supabase o con los datos de prueba.
import type {
  AjusteInventario, Empleado, HistorialReporte, Kardex, Lote, MotivoAjuste,
  Movimiento, MovimientoLote, Producto, SolicitudCompra, UbicacionConOcupacion,
} from './tipos';

export interface NuevoMovimiento {
  movimiento: Omit<Movimiento, 'id_movimiento'>;
  /** Lotes afectados (salida FIFO) o lote creado (entrada) */
  lotes: Omit<MovimientoLote, 'id_movimiento'>[];
  /** Solo para entradas: datos del nuevo lote y su ubicación */
  nuevoLote?: Omit<Lote, 'id_lote' | 'codigo_lote'>;
}

export interface Repositorio {
  iniciarSesion(usuario: string, clave: string): Promise<Empleado | null>;
  listarProductos(): Promise<Producto[]>;
  buscarProductoPorCodigo(codigo: string): Promise<Producto | null>;
  listarUbicaciones(): Promise<UbicacionConOcupacion[]>;
  listarLotesDisponibles(idProducto: number): Promise<Lote[]>;
  listarMotivos(): Promise<MotivoAjuste[]>;
  /** Registra movimiento + lotes + kardex en una sola transacción (RNF4) */
  registrarMovimiento(datos: NuevoMovimiento): Promise<{ movimiento: Movimiento; kardex: Kardex }>;
  listarKardex(idProducto: number): Promise<(Kardex & { movimiento: Movimiento })[]>;
  listarMovimientos(desde: string, hasta: string): Promise<Movimiento[]>;
  registrarAjuste(ajuste: Omit<AjusteInventario, 'id_ajuste'>): Promise<AjusteInventario>;
  actualizarAjuste(id: number, cambios: Partial<AjusteInventario>): Promise<void>;
  listarAjustes(estado?: AjusteInventario['estado_ajuste']): Promise<AjusteInventario[]>;
  buscarSolicitudActiva(idProducto: number): Promise<SolicitudCompra | null>;
  listarSolicitudesActivas(): Promise<SolicitudCompra[]>;
  registrarSolicitud(s: Omit<SolicitudCompra, 'id_solicitud' | 'codigo_solicitud'>): Promise<SolicitudCompra>;
  registrarHistorialReporte(h: Omit<HistorialReporte, 'id_reporte'>): Promise<void>;
  obtenerEmpleado(id: string): Promise<Empleado | null>;
}
