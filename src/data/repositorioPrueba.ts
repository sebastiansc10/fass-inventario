// Implementación en memoria del repositorio (modo de prueba, sin Supabase).
import * as db from './datosPrueba';
import type { NuevoMovimiento, Repositorio } from './repositorio';
import type { Kardex, Movimiento } from './tipos';

const copia = <T>(x: T): T => structuredClone(x);
const ahora = () => new Date().toISOString().slice(0, 19);

export const repositorioPrueba: Repositorio = {
  async iniciarSesion(usuario, clave) {
    const emp = db.empleados.find((e) => e.usuario === usuario);
    return emp && db.clavesPrueba[usuario] === clave ? copia(emp) : null;
  },

  async listarProductos() {
    return copia(db.productos.filter((p) => p.activo));
  },

  async buscarProductoPorCodigo(codigo) {
    const p = db.productos.find((x) => x.codigo_producto.toUpperCase() === codigo.trim().toUpperCase());
    return p ? copia(p) : null;
  },

  async listarUbicaciones() {
    return db.ubicaciones.map((u) => {
      const ocupado = db.lotesUbicacion
        .filter((lu) => lu.id_ubicacion === u.id_ubicacion)
        .reduce((s, lu) => s + lu.cantidad, 0);
      return { ...u, ocupado, disponible: u.capacidad_maxima - ocupado };
    });
  },

  async listarLotesDisponibles(idProducto) {
    return copia(
      db.lotes
        .filter((l) => l.id_producto === idProducto && l.saldo_disponible > 0)
        .sort((a, b) => a.fecha_recepcion.localeCompare(b.fecha_recepcion)),
    );
  },

  async listarMotivos() {
    return copia(db.motivos);
  },

  async registrarMovimiento({ movimiento, lotes, nuevoLote }: NuevoMovimiento) {
    const producto = db.productos.find((p) => p.id_producto === movimiento.id_producto)!;
    const mov: Movimiento = { ...movimiento, id_movimiento: db.secuencias.idMov++ };

    if (nuevoLote) {
      const n = db.lotes.filter((l) => l.id_producto === producto.id_producto).length + 1;
      const id_lote = db.secuencias.idLote++;
      db.lotes.push({ ...nuevoLote, id_lote, codigo_lote: `${producto.codigo_producto}-L${String(n).padStart(2, '0')}` });
      db.lotesUbicacion.push({ id_lote, id_ubicacion: mov.id_ubicacion_destino!, cantidad: nuevoLote.cantidad_inicial });
      db.movimientosLote.push({ id_movimiento: mov.id_movimiento, id_lote, cantidad: nuevoLote.cantidad_inicial, costo_unitario: nuevoLote.costo_unitario });
    }
    for (const l of lotes) {
      const lote = db.lotes.find((x) => x.id_lote === l.id_lote)!;
      lote.saldo_disponible -= l.cantidad;
      const lu = db.lotesUbicacion.find((x) => x.id_lote === l.id_lote);
      if (lu) lu.cantidad -= l.cantidad;
      db.movimientosLote.push({ ...l, id_movimiento: mov.id_movimiento });
    }

    const signo = mov.tipo_movimiento === 'Salida' || (mov.tipo_movimiento === 'Ajuste' && lotes.length > 0) ? -1 : 1;
    producto.stock_actual += signo * mov.cantidad_movimiento;
    producto.saldo_valorizado = +(producto.saldo_valorizado + signo * mov.costo_total).toFixed(2);

    const k: Kardex = {
      id_kardex: db.secuencias.idKdx++, id_movimiento: mov.id_movimiento, id_producto: producto.id_producto,
      fecha_kardex: mov.fecha_movimiento || ahora(), metodo_valorizacion: 'FIFO',
      saldo_cantidad: producto.stock_actual, saldo_valorizado: producto.saldo_valorizado,
    };
    db.movimientos.push(mov);
    db.kardex.push(k); // el kardex solo admite inserciones (RN304)
    return { movimiento: copia(mov), kardex: copia(k) };
  },

  async listarKardex(idProducto) {
    return db.kardex
      .filter((k) => k.id_producto === idProducto)
      .map((k) => ({ ...copia(k), movimiento: copia(db.movimientos.find((m) => m.id_movimiento === k.id_movimiento)!) }));
  },

  async listarMovimientos(desde, hasta) {
    return copia(db.movimientos.filter((m) => m.fecha_movimiento >= desde && m.fecha_movimiento <= hasta));
  },

  async registrarAjuste(a) {
    const ajuste = { ...a, id_ajuste: db.secuencias.idAjuste++ };
    db.ajustes.push(ajuste);
    return copia(ajuste);
  },

  async actualizarAjuste(id, cambios) {
    const a = db.ajustes.find((x) => x.id_ajuste === id);
    if (a) Object.assign(a, cambios);
  },

  async listarAjustes(estado) {
    return copia(db.ajustes.filter((a) => !estado || a.estado_ajuste === estado));
  },

  async buscarSolicitudActiva(idProducto) {
    const s = db.solicitudes.find((x) => x.id_producto === idProducto && x.estado_solicitud === 'Pendiente');
    return s ? copia(s) : null;
  },

  async listarSolicitudesActivas() {
    return copia(db.solicitudes.filter((s) => s.estado_solicitud === 'Pendiente'));
  },

  async registrarSolicitud(s) {
    const id = db.secuencias.idSolicitud++;
    const nueva = { ...s, id_solicitud: id, codigo_solicitud: `SC-2026-${String(40 + id).padStart(4, '0')}` };
    db.solicitudes.push(nueva);
    return copia(nueva);
  },

  async registrarHistorialReporte() {
    db.secuencias.idReporte++;
  },

  async obtenerEmpleado(id) {
    return copia(db.empleados.find((e) => e.id_empleado === id) ?? null);
  },
};
