import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SolicitudCompra } from '../../data/tipos';
import { useAuth } from '../../context/AuthContext';
import {
  cantidadSugerida, emitirSolicitud, listarProductosReposicion, validarCantidad, type ProductoReposicion,
} from '../../services/compraService';
import { fechaHora } from '../../lib/formato';

type Vista = 'listado' | 'detalle' | 'confirmacion' | 'enviada';

export default function SolicitarCompraPage() {
  const { empleado } = useAuth();
  const navigate = useNavigate();
  const [vista, setVista] = useState<Vista>('listado');
  const [productos, setProductos] = useState<ProductoReposicion[]>([]);
  const [soloAlertas, setSoloAlertas] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [seleccion, setSeleccion] = useState<ProductoReposicion | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [error, setError] = useState('');
  const [solicitud, setSolicitud] = useState<SolicitudCompra | null>(null);

  const cargar = () => listarProductosReposicion().then(setProductos);
  useEffect(() => { cargar(); }, []);

  const alertas = productos.filter((p) => p.estado !== 'Normal');
  const visibles = (soloAlertas ? alertas : productos).filter((p) =>
    `${p.codigo_producto} ${p.nombre_producto}`.toLowerCase().includes(busqueda.toLowerCase()));

  function verDetalle(p: ProductoReposicion) {
    setSeleccion(p);
    setCantidad(String(cantidadSugerida(p)));
    setError('');
    setVista('detalle');
  }

  function solicitarCompra() {
    try { validarCantidad(seleccion!, Number(cantidad)); setError(''); setVista('confirmacion'); }
    catch (e) { setError((e as Error).message); }
  }

  async function emitir() {
    try {
      setSolicitud(await emitirSolicitud(seleccion!, Number(cantidad), empleado!.id_empleado));
      setVista('enviada');
      cargar();
    } catch (e) { setError((e as Error).message); }
  }

  const badge = (estado: ProductoReposicion['estado']) =>
    estado === 'Normal' ? 'badge-verde' : estado === 'Solicitud pendiente' ? 'badge-ambar' : 'badge-rojo';

  return (
    <>
      <p className="migas">Compras › Solicitar orden de compra{vista !== 'listado' && ' › ' + seleccion?.codigo_producto}</p>
      <h1 className="titulo">
        {vista === 'listado' && 'Listado de productos'}
        {vista === 'detalle' && 'Detalle de producto'}
        {vista === 'confirmacion' && 'Confirmación de solicitud de compra'}
        {vista === 'enviada' && 'Solicitud enviada'}
      </h1>
      <p className="subtitulo">
        {vista === 'listado' && 'Seleccione el producto que desea reponer'}
        {vista === 'detalle' && 'Revise el stock y defina la cantidad a solicitar'}
        {vista === 'confirmacion' && 'Verifique los datos antes de emitir la solicitud'}
        {vista === 'enviada' && 'La solicitud fue registrada y notificada al área de Compras'}
      </p>

      {vista === 'listado' && (
        <>
          <div className="pildoras">
            <button className={`pildora ${!soloAlertas ? 'activa' : ''}`} onClick={() => setSoloAlertas(false)}>Todos</button>
            <button className={`pildora ${soloAlertas ? 'activa' : ''}`} onClick={() => setSoloAlertas(true)}>Alertas de reposición ({alertas.length})</button>
          </div>
          <div className="tarjeta">
            <div className="campo" style={{ marginBottom: 16 }}>
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="🔍 Buscar por código o nombre" />
            </div>
            <table className="tabla">
              <thead><tr><th>Código de ítem</th><th>Nombre de ítem</th><th className="num">Stock actual</th><th className="num">Punto de reorden</th><th>Estado</th><th>Detalles</th></tr></thead>
              <tbody>
                {visibles.map((p) => (
                  <tr key={p.id_producto}>
                    <td>{p.codigo_producto}</td><td>{p.nombre_producto}</td>
                    <td className="num">{p.stock_actual}</td><td className="num">{p.punto_reorden}</td>
                    <td><span className={`badge ${badge(p.estado)}`}>{p.estado}</span></td>
                    <td><button className="btn-enlace" onClick={() => verDetalle(p)}>Ver detalle</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="acciones">
              <button className="btn" onClick={() => navigate(-1)}>Volver</button>
              <button className="btn" onClick={() => navigate('/')}>Salir</button>
            </div>
          </div>
        </>
      )}

      {vista === 'detalle' && seleccion && (
        <div className="tarjeta">
          <div className="rejilla">
            <div className="campo"><label>Código de ítem</label><input disabled value={seleccion.codigo_producto} /></div>
            <div className="campo"><label>Nombre de ítem</label><input disabled value={seleccion.nombre_producto} /></div>
            <div className="campo"><label>Descripción de ítem</label><input disabled value={seleccion.descripcion_producto} /></div>
            <div className="campo"><label>Stock actual</label><input disabled value={`${seleccion.stock_actual} ${seleccion.unidad_medida}`} /></div>
            <div className="campo"><label>Punto de reorden</label><input disabled value={seleccion.punto_reorden} /></div>
            <div className="campo"><label>Stock máximo</label><input disabled value={seleccion.stock_maximo} /></div>
            <div className="campo"><label>Cantidad sugerida</label><input disabled value={cantidadSugerida(seleccion)} /></div>
            <div className="campo">
              <label>Cantidad a solicitar</label>
              <input type="number" value={cantidad} disabled={!!seleccion.solicitud} onChange={(e) => setCantidad(e.target.value)} />
            </div>
          </div>
          {seleccion.solicitud && (
            <div className="aviso aviso-bloqueo">
              Este producto ya tiene una solicitud de reposición pendiente ({seleccion.solicitud.codigo_solicitud}, emitida el {fechaHora(seleccion.solicitud.fecha_emision)}).
            </div>
          )}
          {error && <p className="mensaje-error">{error}</p>}
          <div className="acciones">
            {!seleccion.solicitud && <button className="btn btn-primario" disabled={!cantidad} onClick={solicitarCompra}>Solicitar compra</button>}
            <button className="btn" onClick={() => setVista('listado')}>Volver</button>
            {!seleccion.solicitud && <button className="btn" onClick={() => setVista('listado')}>Cancelar</button>}
          </div>
        </div>
      )}

      {vista === 'confirmacion' && seleccion && (
        <div className="tarjeta">
          <table className="tabla">
            <tbody>
              <tr><th>Código de ítem</th><td>{seleccion.codigo_producto}</td></tr>
              <tr><th>Nombre de ítem</th><td>{seleccion.nombre_producto}</td></tr>
              <tr><th>Stock actual</th><td>{seleccion.stock_actual} {seleccion.unidad_medida}</td></tr>
              <tr><th>Cantidad solicitada</th><td>{cantidad} {seleccion.unidad_medida}</td></tr>
              <tr><th>Stock proyectado</th><td>{seleccion.stock_actual + Number(cantidad)} / máx. {seleccion.stock_maximo}</td></tr>
              <tr><th>Solicitante</th><td>{empleado?.nombre_empleado}</td></tr>
              <tr><th>Destino</th><td>Área de Compras</td></tr>
            </tbody>
          </table>
          {error && <p className="mensaje-error">{error}</p>}
          <div className="acciones">
            <button className="btn btn-primario" onClick={emitir}>Emitir solicitud</button>
            <button className="btn" onClick={() => setVista('detalle')}>Volver</button>
            <button className="btn" onClick={() => setVista('listado')}>Cancelar</button>
          </div>
        </div>
      )}

      {vista === 'enviada' && solicitud && seleccion && (
        <div className="tarjeta resultado">
          <div className="resultado-icono ok">✓</div>
          <h2>Solicitud N.º {solicitud.codigo_solicitud} enviada correctamente al área de Compras</h2>
          <p className="ayuda">El producto quedó marcado como «solicitud de reposición pendiente».</p>
          <div className="resumen">
            <span>Ítem</span><b>{seleccion.codigo_producto} · {seleccion.nombre_producto}</b>
            <span>Cantidad solicitada</span><b>{solicitud.cantidad_solicitada} {seleccion.unidad_medida}</b>
            <span>Fecha de emisión</span><b>{fechaHora(solicitud.fecha_emision)}</b>
            <span>Estado</span><b>{solicitud.estado_solicitud}</b>
          </div>
          <div className="acciones"><button className="btn btn-primario" onClick={() => setVista('listado')}>Aceptar</button></div>
        </div>
      )}
    </>
  );
}
