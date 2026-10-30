// Datos de prueba para ejecutar el sistema sin conexión a Supabase.
// Las existencias y el kardex se derivan de los lotes para mantener la consistencia.
import type {
  Categoria, Empleado, Kardex, Lote, LoteUbicacion, MotivoAjuste, Movimiento,
  MovimientoLote, Producto, SolicitudCompra, Ubicacion, AjusteInventario,
} from './tipos';

export const empleados: Empleado[] = [
  { id_empleado: 'e1', codigo_empleado: 'EMP-001', nombre_empleado: 'Luis Fernández', cargo: 'Jefe de Almacén', usuario: 'lfernandez' },
  { id_empleado: 'e2', codigo_empleado: 'EMP-002', nombre_empleado: 'Fernando Salas', cargo: 'Gerente', usuario: 'fsalas' },
];
/** Solo para el modo de prueba: en Supabase la clave la valida Supabase Auth. */
export const clavesPrueba: Record<string, string> = { lfernandez: 'fass2026', fsalas: 'fass2026' };

export const categorias: Categoria[] = [
  { id_categoria: 1, codigo_categoria: 'CAT-INS', nombre_categoria: 'Materia prima e insumos' },
  { id_categoria: 2, codigo_categoria: 'CAT-PIN', nombre_categoria: 'Herramientas de pintura' },
  { id_categoria: 3, codigo_categoria: 'CAT-ACA', nombre_categoria: 'Herramientas de acabado' },
];

export const ubicaciones: Ubicacion[] = [
  { id_ubicacion: 1, codigo_ubicacion: 'A-01-1', zona: 'Zona A – Insumos', estante: '01', nivel: '1', capacidad_maxima: 400 },
  { id_ubicacion: 2, codigo_ubicacion: 'A-01-2', zona: 'Zona A – Insumos', estante: '01', nivel: '2', capacidad_maxima: 400 },
  { id_ubicacion: 3, codigo_ubicacion: 'A-02-1', zona: 'Zona A – Insumos', estante: '02', nivel: '1', capacidad_maxima: 600 },
  { id_ubicacion: 4, codigo_ubicacion: 'B-01-1', zona: 'Zona B – Producto terminado', estante: '01', nivel: '1', capacidad_maxima: 250 },
  { id_ubicacion: 5, codigo_ubicacion: 'B-01-2', zona: 'Zona B – Producto terminado', estante: '01', nivel: '2', capacidad_maxima: 250 },
  { id_ubicacion: 6, codigo_ubicacion: 'B-02-1', zona: 'Zona B – Producto terminado', estante: '02', nivel: '1', capacidad_maxima: 300 },
  { id_ubicacion: 7, codigo_ubicacion: 'C-01-1', zona: 'Zona C – Despacho', estante: '01', nivel: '1', capacidad_maxima: 150 },
];

export const motivos: MotivoAjuste[] = [
  { id_motivo: 1, codigo_motivo: 'MOT-01', nombre_motivo: 'Merma', requiere_comentario: false },
  { id_motivo: 2, codigo_motivo: 'MOT-02', nombre_motivo: 'Producto dañado', requiere_comentario: true },
  { id_motivo: 3, codigo_motivo: 'MOT-03', nombre_motivo: 'Vencimiento', requiere_comentario: false },
  { id_motivo: 4, codigo_motivo: 'MOT-04', nombre_motivo: 'Consumo interno', requiere_comentario: false },
  { id_motivo: 5, codigo_motivo: 'MOT-05', nombre_motivo: 'Ajuste de inventario inicial', requiere_comentario: false },
];

type Semilla = Omit<Producto, 'stock_actual' | 'saldo_valorizado' | 'activo'> & {
  lotes: { fecha: string; inicial: number; saldo: number; costo: number; ubicacion: number }[];
};

const semillas: Semilla[] = [
  { id_producto: 1, id_categoria: 1, codigo_producto: 'IN-012', nombre_producto: 'Cerdas sintéticas', descripcion_producto: 'Filamento sintético para brochas', tipo_item: 'Insumo', unidad_medida: 'kg', stock_seguridad: 5, punto_reorden: 10, stock_maximo: 60,
    lotes: [{ fecha: '2026-09-02', inicial: 40, saldo: 8, costo: 38.5, ubicacion: 1 }] },
  { id_producto: 2, id_categoria: 1, codigo_producto: 'IN-031', nombre_producto: 'Mango plástico 3"', descripcion_producto: 'Mango de polipropileno para brocha de 3 pulgadas', tipo_item: 'Insumo', unidad_medida: 'und', stock_seguridad: 30, punto_reorden: 50, stock_maximo: 400,
    lotes: [{ fecha: '2026-08-20', inicial: 300, saldo: 40, costo: 0.85, ubicacion: 2 }] },
  { id_producto: 3, id_categoria: 1, codigo_producto: 'IN-045', nombre_producto: 'Polipropileno en pellets', descripcion_producto: 'Resina PP para inyección de mangos', tipo_item: 'Insumo', unidad_medida: 'kg', stock_seguridad: 50, punto_reorden: 80, stock_maximo: 500,
    lotes: [{ fecha: '2026-09-10', inicial: 200, saldo: 70, costo: 6.2, ubicacion: 3 }, { fecha: '2026-10-08', inicial: 150, saldo: 150, costo: 6.45, ubicacion: 3 }] },
  { id_producto: 4, id_categoria: 1, codigo_producto: 'IN-060', nombre_producto: 'Felpa acrílica para rodillo', descripcion_producto: 'Felpa de 10 mm para rodillos de 9"', tipo_item: 'Insumo', unidad_medida: 'm', stock_seguridad: 15, punto_reorden: 30, stock_maximo: 200,
    lotes: [{ fecha: '2026-09-25', inicial: 120, saldo: 95, costo: 12.8, ubicacion: 1 }] },
  { id_producto: 5, id_categoria: 1, codigo_producto: 'IN-072', nombre_producto: 'Virola metálica 3"', descripcion_producto: 'Virola de hojalata para brocha de 3"', tipo_item: 'Insumo', unidad_medida: 'und', stock_seguridad: 60, punto_reorden: 100, stock_maximo: 800,
    lotes: [{ fecha: '2026-09-15', inicial: 500, saldo: 150, costo: 0.35, ubicacion: 2 }, { fecha: '2026-10-12', inicial: 200, saldo: 200, costo: 0.38, ubicacion: 2 }] },
  { id_producto: 6, id_categoria: 2, codigo_producto: 'PT-101', nombre_producto: 'Rodillo de pintura 9"', descripcion_producto: 'Rodillo con felpa acrílica y mango plástico', tipo_item: 'Producto terminado', unidad_medida: 'und', stock_seguridad: 20, punto_reorden: 40, stock_maximo: 300,
    lotes: [{ fecha: '2026-10-01', inicial: 180, saldo: 120, costo: 7.9, ubicacion: 4 }] },
  { id_producto: 7, id_categoria: 3, codigo_producto: 'PT-150', nombre_producto: 'Lijador manual', descripcion_producto: 'Taco lijador plástico con prensa', tipo_item: 'Producto terminado', unidad_medida: 'und', stock_seguridad: 10, punto_reorden: 20, stock_maximo: 150,
    lotes: [{ fecha: '2026-09-28', inicial: 100, saldo: 64, costo: 5.4, ubicacion: 5 }] },
  { id_producto: 8, id_categoria: 3, codigo_producto: 'PT-180', nombre_producto: 'Fraguador plástico', descripcion_producto: 'Llana de goma para fraguar cerámicos', tipo_item: 'Producto terminado', unidad_medida: 'und', stock_seguridad: 15, punto_reorden: 25, stock_maximo: 200,
    lotes: [{ fecha: '2026-10-05', inicial: 90, saldo: 48, costo: 4.1, ubicacion: 6 }] },
  { id_producto: 9, id_categoria: 2, codigo_producto: 'PT-205', nombre_producto: 'Brocha 3"', descripcion_producto: 'Brocha de cerdas sintéticas 3"', tipo_item: 'Producto terminado', unidad_medida: 'und', stock_seguridad: 10, punto_reorden: 20, stock_maximo: 250,
    lotes: [{ fecha: '2026-09-18', inicial: 150, saldo: 15, costo: 3.6, ubicacion: 4 }] },
  { id_producto: 10, id_categoria: 2, codigo_producto: 'PT-210', nombre_producto: 'Brocha 4"', descripcion_producto: 'Brocha de cerdas sintéticas 4"', tipo_item: 'Producto terminado', unidad_medida: 'und', stock_seguridad: 10, punto_reorden: 20, stock_maximo: 200,
    lotes: [{ fecha: '2026-10-03', inicial: 120, saldo: 76, costo: 4.3, ubicacion: 5 }] },
];

export const productos: Producto[] = [];
export const lotes: Lote[] = [];
export const lotesUbicacion: LoteUbicacion[] = [];
export const movimientos: Movimiento[] = [];
export const movimientosLote: MovimientoLote[] = [];
export const kardex: Kardex[] = [];

let idLote = 1, idMov = 1, idKdx = 1;
type Evento = { fecha: string; tipo: 'Entrada' | 'Salida'; cant: number; costo: number; idLote: number; ubic: number; doc?: string };
for (const s of semillas) {
  const { lotes: ls, ...p } = s;
  const eventos: Evento[] = [];
  ls.forEach((l, i) => {
    const lote: Lote = {
      id_lote: idLote, id_producto: p.id_producto,
      codigo_lote: `${p.codigo_producto}-L${String(i + 1).padStart(2, '0')}`,
      fecha_recepcion: `${l.fecha}T09:00:00`, cantidad_inicial: l.inicial,
      saldo_disponible: l.saldo, costo_unitario: l.costo,
    };
    lotes.push(lote);
    lotesUbicacion.push({ id_lote: idLote, id_ubicacion: l.ubicacion, cantidad: l.saldo });
    eventos.push({ fecha: lote.fecha_recepcion, tipo: 'Entrada', cant: l.inicial, costo: l.costo, idLote, ubic: l.ubicacion });
    if (l.inicial > l.saldo) { // lo consumido del lote sale 6 días después de recibido
      const f = new Date(`${l.fecha}T15:00:00`); f.setDate(f.getDate() + 6);
      const iso = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}T15:00:00`;
      eventos.push({ fecha: iso, tipo: 'Salida', cant: l.inicial - l.saldo, costo: l.costo, idLote, ubic: l.ubicacion });
    }
    idLote++;
  });
  // Se registran en orden cronológico para que los saldos del kardex sean correctos
  let saldoCant = 0, saldoVal = 0;
  for (const e of eventos.sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    const signo = e.tipo === 'Entrada' ? 1 : -1;
    saldoCant += signo * e.cant; saldoVal += signo * e.cant * e.costo;
    const insumo = p.tipo_item === 'Insumo';
    movimientos.push({
      id_movimiento: idMov, id_producto: p.id_producto, id_empleado: 'e1',
      id_ubicacion_origen: e.tipo === 'Salida' ? e.ubic : null, id_ubicacion_destino: e.tipo === 'Entrada' ? e.ubic : null,
      tipo_movimiento: e.tipo, fecha_movimiento: e.fecha, cantidad_movimiento: e.cant,
      costo_total: +(e.cant * e.costo).toFixed(2),
      motivo_movimiento: e.tipo === 'Entrada' ? 'Recepción de mercancía' : insumo ? 'Despacho a producción' : 'Despacho a cliente',
      documento_ingreso: e.tipo === 'Entrada' ? `GR-001-${String(4100 + idMov)}` : null,
      mercancia_conforme: e.tipo === 'Entrada' ? true : null,
      receptor: e.tipo === 'Salida' ? (insumo ? 'Área de producción' : 'Área de ventas') : null,
    });
    movimientosLote.push({ id_movimiento: idMov, id_lote: e.idLote, cantidad: e.cant, costo_unitario: e.costo });
    kardex.push({ id_kardex: idKdx++, id_movimiento: idMov, id_producto: p.id_producto, fecha_kardex: e.fecha, metodo_valorizacion: 'FIFO', saldo_cantidad: saldoCant, saldo_valorizado: +saldoVal.toFixed(2) });
    idMov++;
  }
  productos.push({ ...p, stock_actual: saldoCant, saldo_valorizado: +saldoVal.toFixed(2), activo: true });
}
kardex.sort((a, b) => a.fecha_kardex.localeCompare(b.fecha_kardex));

export const solicitudes: SolicitudCompra[] = [
  { id_solicitud: 1, id_producto: 2, id_empleado: 'e1', codigo_solicitud: 'SC-2026-0041', fecha_emision: '2026-10-27T10:15:00', cantidad_sugerida: 360, cantidad_solicitada: 360, estado_solicitud: 'Pendiente' },
];

export const ajustes: AjusteInventario[] = [
  { id_ajuste: 1, id_producto: 6, id_motivo: 2, id_ubicacion: 4, id_empleado_registra: 'e1', id_empleado_aprueba: null, id_movimiento: null,
    stock_teorico: 120, stock_fisico: 108, diferencia: -12, valor_ajuste: -94.8, comentario: 'Rodillos con felpa desprendida por humedad en el estante B-01',
    estado_ajuste: 'Pendiente', fecha_registro: '2026-10-28T16:40:00', fecha_aprobacion: null },
  { id_ajuste: 2, id_producto: 9, id_motivo: 1, id_ubicacion: 4, id_empleado_registra: 'e1', id_empleado_aprueba: 'e2', id_movimiento: null,
    stock_teorico: 16, stock_fisico: 15, diferencia: -1, valor_ajuste: -3.6, comentario: '',
    estado_ajuste: 'Aprobado', fecha_registro: '2026-10-20T11:05:00', fecha_aprobacion: '2026-10-20T11:05:00' },
];

export const secuencias = { idLote, idMov, idKdx, idAjuste: 3, idSolicitud: 2, idReporte: 1 };
