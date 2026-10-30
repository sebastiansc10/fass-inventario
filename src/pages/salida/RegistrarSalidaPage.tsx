import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import repo from '../../data';
import type { Producto } from '../../data/tipos';
import { useAuth } from '../../context/AuthContext';
import { ErrorValidacion, calcularSalidaFIFO, registrarSalida, validarDatosComunes } from '../../services/movimientoService';
import { ahoraISO, fecha, fechaHora, soles } from '../../lib/formato';

const MOTIVOS = ['Despacho a producción', 'Despacho a cliente', 'Devolución a proveedor', 'Traslado a tienda'];
type Consumo = Awaited<ReturnType<typeof calcularSalidaFIFO>>;

export default function RegistrarSalidaPage() {
  const { empleado } = useAuth();
  const navigate = useNavigate();
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [codigo, setCodigo] = useState('');
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [receptor, setReceptor] = useState('');
  const [fifo, setFifo] = useState<Consumo | null>(null);
  const [stockNuevo, setStockNuevo] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(async () => setProducto(codigo ? await repo.buscarProductoPorCodigo(codigo) : null), 250);
    return () => clearTimeout(t);
  }, [codigo]);

  async function siguiente() {
    setError('');
    try {
      const p = await validarDatosComunes(codigo, Number(cantidad));
      if (!motivo) throw new ErrorValidacion('Seleccione el motivo de la salida');
      if (motivo === 'Despacho a producción' && !receptor.trim()) throw new ErrorValidacion('Registre al receptor del despacho');
      setFifo(await calcularSalidaFIFO(p, Number(cantidad))); // verifica disponibilidad y lotes FIFO
      setPaso(2);
    } catch (e) { setError((e as Error).message); }
  }

  async function confirmar() {
    try {
      const r = await registrarSalida({ producto: producto!, cantidad: Number(cantidad), motivo, receptor, idEmpleado: empleado!.id_empleado });
      setStockNuevo(r.kardex.saldo_cantidad);
      setPaso(3);
    } catch (e) { setError((e as Error).message); }
  }

  return (
    <>
      <p className="migas">Movimientos › Registrar salida</p>
      <h1 className="titulo">Registrar salida del almacén</h1>
      <p className="subtitulo">
        {paso === 1 && 'Paso 1 de 3 — Contexto operativo'}
        {paso === 2 && 'Paso 2 de 3 — Detalle de salida (valorización FIFO)'}
        {paso === 3 && 'Paso 3 de 3 — Validación de salida'}
      </p>

      {paso === 1 && (
        <div className="tarjeta">
          <div className="rejilla">
            <div className="campo"><label>Código de ítem</label><input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej. PT-101" /></div>
            <div className="campo"><label>Nombre de ítem</label><input disabled value={producto?.nombre_producto ?? ''} placeholder="Se completa al ingresar el código" /></div>
            <div className="campo"><label>Unidad de medida</label><input disabled value={producto?.unidad_medida ?? ''} /></div>
            <div className="campo"><label>Stock actual</label><input disabled value={producto ? producto.stock_actual : ''} /></div>
            <div className="campo"><label>Cantidad a retirar</label><input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Ingrese cantidad" /></div>
            <div className="campo">
              <label>Motivo de salida</label>
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                <option value="">Seleccione motivo</option>
                {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="campo"><label>Receptor</label><input value={receptor} onChange={(e) => setReceptor(e.target.value)} placeholder="Obligatorio si es despacho a producción" /></div>
            <div className="campo"><label>Fecha</label><input disabled value={fechaHora(ahoraISO())} /></div>
          </div>
          {error && <p className="mensaje-error">{error}</p>}
          <div className="acciones">
            <button className="btn btn-primario" onClick={siguiente}>Siguiente</button>
            <button className="btn" onClick={() => navigate(-1)}>Volver</button>
            <button className="btn" onClick={() => navigate('/')}>Salir</button>
          </div>
        </div>
      )}

      {paso === 2 && producto && fifo && (
        <div className="tarjeta">
          <div className="rejilla-3">
            <div className="campo"><label>Ítem</label><input disabled value={`${producto.codigo_producto} · ${producto.nombre_producto}`} /></div>
            <div className="campo"><label>Cantidad</label><input disabled value={`${cantidad} ${producto.unidad_medida}`} /></div>
            <div className="campo"><label>Motivo</label><input disabled value={motivo} /></div>
          </div>
          <h3 style={{ marginTop: 22 }}>Lotes que respaldan la salida (FIFO)</h3>
          <table className="tabla">
            <thead><tr><th>Lote</th><th>Fecha de recepción</th><th className="num">Saldo del lote</th><th className="num">Cantidad tomada</th><th className="num">Costo unitario</th><th className="num">Subtotal</th></tr></thead>
            <tbody>
              {fifo.consumo.map((c) => (
                <tr key={c.lote.id_lote}>
                  <td>{c.lote.codigo_lote}</td><td>{fecha(c.lote.fecha_recepcion)}</td>
                  <td className="num">{c.lote.saldo_disponible}</td><td className="num">{c.cantidad}</td>
                  <td className="num">{soles(c.lote.costo_unitario)}</td><td className="num">{soles(c.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={5}>Costo total de la salida</td><td className="num">{soles(fifo.costoTotal)}</td></tr></tfoot>
          </table>
          {error && <p className="mensaje-error">{error}</p>}
          <div className="acciones">
            <button className="btn btn-primario" onClick={confirmar}>Confirmar salida</button>
            <button className="btn" onClick={() => setPaso(1)}>Volver</button>
            <button className="btn" onClick={() => navigate('/')}>Salir</button>
          </div>
        </div>
      )}

      {paso === 3 && producto && fifo && (
        <div className="tarjeta resultado">
          <div className="resultado-icono ok">✓</div>
          <h2>Salida registrada con éxito</h2>
          <p className="ayuda">La salida fue valorizada por FIFO y registrada en el KARDEX.</p>
          <div className="resumen">
            <span>Ítem</span><b>{producto.codigo_producto} · {producto.nombre_producto}</b>
            <span>Cantidad retirada</span><b>{cantidad} {producto.unidad_medida}</b>
            <span>Costo de la salida</span><b>{soles(fifo.costoTotal)}</b>
            <span>Stock anterior → nuevo</span><b>{producto.stock_actual} → {stockNuevo}</b>
          </div>
          <div className="acciones"><button className="btn btn-primario" onClick={() => navigate('/')}>Aceptar</button></div>
        </div>
      )}
    </>
  );
}
