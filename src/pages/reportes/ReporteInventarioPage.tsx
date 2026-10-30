import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categorias, ubicaciones } from '../../data/datosPrueba';
import type { EstadoStock, LineaKardex, TipoItem } from '../../data/tipos';
import { useAuth } from '../../context/AuthContext';
import {
  detalleMovimientos, exportarCSV, generarReporteInventario, type FilaInventario, type FiltrosInventario,
} from '../../services/reporteService';
import { ahoraISO, fechaHora, soles } from '../../lib/formato';

type Vista = 'parametros' | 'reporte' | 'detalle';

export default function ReporteInventarioPage() {
  const { empleado } = useAuth();
  const navigate = useNavigate();
  const [vista, setVista] = useState<Vista>('parametros');
  const [filtros, setFiltros] = useState<FiltrosInventario>({ fecha: ahoraISO().slice(0, 16), tipo: 'Todos', idCategoria: 0, estado: 'Todos' });
  const [filas, setFilas] = useState<FilaInventario[]>([]);
  const [generado, setGenerado] = useState('');
  const [detalle, setDetalle] = useState<{ fila: FilaInventario; lineas: LineaKardex[] } | null>(null);
  const [exportado, setExportado] = useState(false);
  const [error, setError] = useState('');

  async function generar() {
    setError('');
    try {
      setFilas(await generarReporteInventario(filtros, empleado!.id_empleado));
      setGenerado(ahoraISO());
      setVista('reporte');
    } catch (e) { setError((e as Error).message); }
  }

  async function verDetalle(fila: FilaInventario) {
    setDetalle({ fila, lineas: await detalleMovimientos(fila.producto.id_producto) });
    setVista('detalle');
  }

  function exportar(formato: 'PDF' | 'Excel') {
    if (formato === 'Excel') {
      exportarCSV('reporte_inventario', ['Código', 'Ítem', 'Tipo', 'Unidad', 'Lotes', 'Stock', 'Punto de reorden', 'Estado', 'Valorizado'],
        filas.map((f) => [f.producto.codigo_producto, f.producto.nombre_producto, f.producto.tipo_item, f.producto.unidad_medida, f.lotes.join(', '), f.stock, f.producto.punto_reorden, f.estado, f.valorizado]));
    } else {
      window.print();
    }
    setExportado(true);
  }

  const set = (cambios: Partial<FiltrosInventario>) => setFiltros({ ...filtros, ...cambios });
  const claseFila = (e: EstadoStock) => (e === 'Bajo punto de reorden' ? 'fila-roja' : e === 'Sin stock' ? 'fila-gris' : '');

  return (
    <>
      <p className="migas">Reportes › Reporte de inventario{vista === 'detalle' && ' › Detalle de movimientos'}</p>
      <h1 className="titulo">
        {vista === 'parametros' && 'Parámetros del reporte'}
        {vista === 'reporte' && 'Reporte de inventario'}
        {vista === 'detalle' && `Detalle de movimientos — ${detalle?.fila.producto.codigo_producto}`}
      </h1>
      <p className="subtitulo">
        {vista === 'parametros' && 'Defina la fecha de consulta y los filtros del reporte de existencias'}
        {vista === 'reporte' && 'Existencias por ítem y lote, y su estado frente al punto de reorden'}
        {vista === 'detalle' && `KARDEX de ${detalle?.fila.producto.nombre_producto}`}
      </p>

      {vista === 'parametros' && (
        <div className="tarjeta">
          <div className="rejilla">
            <div className="campo"><label>Fecha de consulta</label><input type="datetime-local" value={filtros.fecha} onChange={(e) => set({ fecha: e.target.value })} /></div>
            <div className="campo">
              <label>Tipo de ítem</label>
              <select value={filtros.tipo} onChange={(e) => set({ tipo: e.target.value as TipoItem | 'Todos' })}>
                <option>Todos</option><option>Insumo</option><option>Producto terminado</option>
              </select>
            </div>
            <div className="campo">
              <label>Categoría</label>
              <select value={filtros.idCategoria} onChange={(e) => set({ idCategoria: Number(e.target.value) })}>
                <option value={0}>Todas</option>
                {categorias.map((c) => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
              </select>
            </div>
            <div className="campo">
              <label>Ubicación</label>
              <select defaultValue="">
                <option value="">Todas</option>
                {ubicaciones.map((u) => <option key={u.id_ubicacion}>{u.codigo_ubicacion}</option>)}
              </select>
            </div>
            <div className="campo">
              <label>Estado de stock</label>
              <select value={filtros.estado} onChange={(e) => set({ estado: e.target.value as EstadoStock | 'Todos' })}>
                <option>Todos</option><option>Bajo punto de reorden</option><option>Sin stock</option><option>Normal</option>
              </select>
            </div>
          </div>
          {error && <p className="mensaje-error">{error}</p>}
          <div className="acciones">
            <button className="btn btn-primario" onClick={generar}>Generar</button>
            <button className="btn" onClick={() => navigate(-1)}>Volver</button>
            <button className="btn" onClick={() => navigate('/')}>Salir</button>
          </div>
        </div>
      )}

      {vista === 'reporte' && (
        <div className="tarjeta" style={{ maxWidth: "none" }}>
          <div className="cabecera-reporte">
            <div><span>Fecha de consulta: </span><b>{fechaHora(filtros.fecha)}</b></div>
            <div><span>Fecha de generación: </span><b>{fechaHora(generado)}</b></div>
            <div><span>Usuario: </span><b>{empleado?.nombre_empleado}</b></div>
          </div>
          <table className="tabla">
            <thead><tr><th>Código</th><th>Ítem</th><th>Tipo</th><th>Unidad</th><th>Lote(s)</th><th className="num">Stock</th><th className="num">P. reorden</th><th className="num">Valorizado</th><th>Estado</th></tr></thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.producto.id_producto} className={`seleccionable ${claseFila(f.estado)}`} onClick={() => verDetalle(f)}>
                  <td>{f.producto.codigo_producto}</td><td>{f.producto.nombre_producto}</td><td>{f.producto.tipo_item}</td>
                  <td>{f.producto.unidad_medida}</td><td>{f.lotes.join(', ') || '—'}</td>
                  <td className="num">{f.stock}</td><td className="num">{f.producto.punto_reorden}</td>
                  <td className="num">{soles(f.valorizado)}</td><td>{f.estado}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={7}>Total valorizado ({filas.length} ítems)</td><td className="num">{soles(filas.reduce((s, f) => s + f.valorizado, 0))}</td><td></td></tr></tfoot>
          </table>
          <div className="leyenda">
            <span><i style={{ background: 'var(--acento)' }} />Bajo punto de reorden</span>
            <span><i style={{ background: '#9ca3af' }} />Sin stock</span>
            <span>Seleccione un ítem para ver su detalle de movimientos</span>
          </div>
          <div className="acciones">
            <button className="btn btn-primario" onClick={() => exportar('PDF')}>Exportar PDF</button>
            <button className="btn btn-primario" onClick={() => exportar('Excel')}>Exportar Excel</button>
            <button className="btn" onClick={() => setVista('parametros')}>Volver</button>
          </div>
        </div>
      )}

      {vista === 'detalle' && detalle && (
        <div className="tarjeta" style={{ maxWidth: "none" }}>
          <table className="tabla">
            <thead><tr><th>Fecha</th><th>Tipo de movimiento</th><th>Motivo</th><th className="num">Cantidad</th><th className="num">Costo</th><th className="num">Saldo</th><th className="num">Saldo valorizado</th><th>Responsable</th></tr></thead>
            <tbody>
              {detalle.lineas.map((l, i) => (
                <tr key={i}>
                  <td>{fechaHora(l.fecha)}</td>
                  <td><span className={`badge ${l.tipo === 'Entrada' ? 'badge-verde' : l.tipo === 'Salida' ? 'badge-rojo' : 'badge-ambar'}`}>{l.tipo}</span></td>
                  <td>{l.motivo}</td><td className="num">{l.cantidad}</td><td className="num">{soles(l.costo_total)}</td>
                  <td className="num">{l.saldo_cantidad}</td><td className="num">{soles(l.saldo_valorizado)}</td><td>{l.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="acciones"><button className="btn" onClick={() => setVista('reporte')}>Volver</button></div>
        </div>
      )}

      {exportado && (
        <div className="modal-fondo" onClick={() => setExportado(false)}>
          <div className="modal resultado" onClick={(e) => e.stopPropagation()}>
            <div className="resultado-icono ok">✓</div>
            <h2>Reporte exportado con éxito</h2>
            <p className="ayuda">El archivo se descargó en su equipo.</p>
            <div className="acciones"><button className="btn btn-primario" onClick={() => setExportado(false)}>Aceptar</button></div>
          </div>
        </div>
      )}
    </>
  );
}
