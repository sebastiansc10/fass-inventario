// Implementación del repositorio sobre Supabase (PostgreSQL + Auth).
// Las escrituras que tocan varias tablas se hacen con funciones RPC de PostgreSQL
// para que movimiento, lotes y kardex se guarden en una sola transacción (RNF4).
import { createClient } from '@supabase/supabase-js';
import type { Repositorio } from './repositorio';
import type { Empleado, Producto } from './tipos';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

function verificar<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export const repositorioSupabase: Repositorio = {
  async iniciarSesion(usuario, clave) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: `${usuario}@fass.pe`, password: clave });
    if (error || !data.user) return null;
    return verificar<Empleado>(
      await supabase.from('empleado').select('*').eq('id_empleado', data.user.id).eq('activo', true).single(),
    );
  },

  async listarProductos() {
    return verificar<Producto[]>(
      await supabase.from('producto').select('*').eq('activo', true).order('codigo_producto'),
    );
  },

  async buscarProductoPorCodigo(codigo) {
    const { data } = await supabase.from('producto').select('*').ilike('codigo_producto', codigo.trim()).maybeSingle();
    return data;
  },

  async listarUbicaciones() {
    // Vista v_ubicacion_ocupacion = ubicacion + SUM(lote_ubicacion.cantidad)
    return verificar(await supabase.from('v_ubicacion_ocupacion').select('*').order('codigo_ubicacion'));
  },

  async listarLotesDisponibles(idProducto) {
    return verificar(
      await supabase.from('lote').select('*')
        .eq('id_producto', idProducto).gt('saldo_disponible', 0)
        .order('fecha_recepcion', { ascending: true }), // orden FIFO
    );
  },

  async listarMotivos() {
    return verificar(await supabase.from('motivo_ajuste').select('*').order('codigo_motivo'));
  },

  async registrarMovimiento(datos) {
    return verificar(await supabase.rpc('registrar_movimiento', { p_datos: datos }));
  },

  async listarKardex(idProducto) {
    return verificar(
      await supabase.from('kardex').select('*, movimiento(*)')
        .eq('id_producto', idProducto).order('fecha_kardex'),
    );
  },

  async listarMovimientos(desde, hasta) {
    return verificar(
      await supabase.from('movimiento').select('*')
        .gte('fecha_movimiento', desde).lte('fecha_movimiento', hasta),
    );
  },

  async registrarAjuste(ajuste) {
    return verificar(await supabase.from('ajuste_inventario').insert(ajuste).select().single());
  },

  async actualizarAjuste(id, cambios) {
    verificar(await supabase.from('ajuste_inventario').update(cambios).eq('id_ajuste', id));
  },

  async listarAjustes(estado) {
    let q = supabase.from('ajuste_inventario').select('*').order('fecha_registro', { ascending: false });
    if (estado) q = q.eq('estado_ajuste', estado);
    return verificar(await q);
  },

  async buscarSolicitudActiva(idProducto) {
    const { data } = await supabase.from('solicitud_compra').select('*')
      .eq('id_producto', idProducto).eq('estado_solicitud', 'Pendiente').maybeSingle();
    return data;
  },

  async listarSolicitudesActivas() {
    return verificar(await supabase.from('solicitud_compra').select('*').eq('estado_solicitud', 'Pendiente'));
  },

  async registrarSolicitud(s) {
    // El código único SC-AAAA-NNNN lo genera un trigger en la base de datos
    return verificar(await supabase.from('solicitud_compra').insert(s).select().single());
  },

  async registrarHistorialReporte(h) {
    verificar(await supabase.from('historial_reporte').insert(h));
  },

  async obtenerEmpleado(id) {
    const { data } = await supabase.from('empleado').select('*').eq('id_empleado', id).maybeSingle();
    return data;
  },
};
