import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import repo from '../../data';
import type { Producto, UbicacionConOcupacion } from '../../data/tipos';
import { useAuth } from '../../context/AuthContext';
import { ErrorValidacion, registrarEntrada, validarDatosComunes, validarUbicacion } from '../../services/movimientoService';
import { ahoraISO, fechaHora } from '../../lib/formato';

type Paso = 1 | 2 | 3;

export default function RegistrarEntradaPage() {
  const { empleado } = useAuth();
  const navigate = useNavigate();
  const [paso, setPaso] = useState<Paso>(1);
  const [codigo, setCodigo] = useState('');
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [costo, setCosto] = useState('');
  const [documento, setDocumento] = useState('');
  const [conforme, setConforme] = useState(true);
  const [incidencia, setIncidencia] = useState('');
  const [ubicaciones, setUbicaciones] = useState<UbicacionConOcupacion[]>([]);
  const [idUbicacion, setIdUbicacion] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [stockNuevo, setStockNuevo] = useState(0);

  useEffect(() => { repo.listarUbicaciones().then(setUbicaciones); }, [paso]);

  // Al escribir el código se muestra la información del ítem (nombre, unidad y stock)
  useEffect(() => {
    const t = setTimeout(async () => setProducto(codigo ? await repo.buscarProductoPorCodigo(codigo) : null), 250);
    return () => clearTimeout(t);
  }, [codigo]);

  async function siguiente() {
    setError('');
    try {
      await validarDatosComunes(codigo, Number(cantidad));
      if (!documento.trim()) throw new ErrorValidacion('Ingrese el documento de ingreso (orden de compra o guía de remisión)');
      if (!(Number(costo) > 0)) throw new ErrorValidacion('Ingrese el costo unitario del lote');
      setPaso(2);
    } catch (e) { setError((e as Error).message); }
  }

  async function confirmar() {
    setError('');
    try {
      const ubicacion = ubicaciones.find((u) => u.id_ubicacion === idUbicacion);
      validarUbicacion(ubicacion, Number(cantidad)); // caso incluido «Registrar ubicación»
      const r = await registrarEntrada({
        producto: producto!, cantidad: Number(cantidad), costoUnitario: Number(costo),
        documentoIngreso: documento, conforme, incidencia, ubicacion: ubicacion!, idEmpleado: empleado!.id_empleado,
      });
      setStockNuevo(r.kardex.saldo_cantidad);
      setPaso(3);
    } catch (e) { setError((e as Error).message); }
  }

  const sinCapacidad = ubicaciones.length > 0 && ubicaciones.every((u) => u.disponible < Number(cantidad));

  return (
    <>
      <p className="migas">Movimientos › Registrar entrada</p>
      <h1 className="titulo">Registrar entrada de almacén</h1>
      <p className="subtitulo">
        {paso === 1 && 'Paso 1 de 3 — Contexto operativo'}
        {paso === 2 && 'Paso 2 de 3 — Verificación de mercancía y ubicación'}
        {paso === 3 && 'Paso 3 de 3 — Validación de entrada'}
      </p>

      {paso === 1 && (
        <div className="tarjeta">
          <div className="rejilla">
            <div className="campo"><label>Código de ítem</label><input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej. IN-012" /></div>
            <div className="campo"><label>Nombre de ítem</label><input disabled value={producto?.nombre_producto ?? ''} placeholder="Se completa al ingresar el código" /></div>
            <div className="campo"><label>Unidad de medida</label><input disabled value={producto?.unidad_medida ?? ''} /></div>
            <div className="campo"><label>Stock actual</label><input disabled value={producto ? producto.stock_actual : ''} /></div>
            <div className="campo"><label>Cantidad física recibida</label><input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Ingrese cantidad" /></div>
            <div className="campo"><label>Costo unitario (S/)</label><input type="number" step="0.01" value={costo} onChange={(e) => setCosto(e.target.value)} placeholder="0.00" /></div>
            <div className="campo"><label>Documento de ingreso</label><input value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="Ej. GR-001-4532 u OC-2026-0039" /></div>
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

      {paso === 2 && producto && (
        <>
          <div className="tarjeta">
            <h3>Verificación contra el documento {documento}</h3>
            <p className="ayuda">{producto.codigo_producto} · {producto.nombre_producto} — {cantidad} {producto.unidad_medida} a S/ {Number(costo).toFixed(2)} c/u</p>
            <div className="pildoras" style={{ marginTop: 12 }}>
              <button className={`pildora ${conforme ? 'activa' : ''}`} onClick={() => setConforme(true)}>Mercancía conforme</button>
              <button className={`pildora ${!conforme ? 'activa' : ''}`} onClick={() => setConforme(false)}>Con discrepancia</button>
            </div>
            {!conforme && (
              <div className="campo"><label>Incidencia</label><textarea value={incidencia} onChange={(e) => setIncidencia(e.target.value)} placeholder="Describa la diferencia de cantidad o calidad" /></div>
            )}
          </div>

          <div className="tarjeta">
            <h3>Registrar ubicación</h3>
            <table className="tabla">
              <thead><tr><th></th><th>Ubicación</th><th>Zona</th><th>Estante / Nivel</th><th className="num">Capacidad</th><th className="num">Ocupado</th><th className="num">Disponible</th></tr></thead>
              <tbody>
                {ubicaciones.map((u) => (
                  <tr key={u.id_ubicacion} className={`seleccionable ${u.disponible < Number(cantidad) ? 'fila-gris' : ''}`} onClick={() => setIdUbicacion(u.id_ubicacion)}>
                    <td><input type="radio" readOnly checked={idUbicacion === u.id_ubicacion} /></td>
                    <td><strong>{u.codigo_ubicacion}</strong></td><td>{u.zona}</td><td>{u.estante} / {u.nivel}</td>
                    <td className="num">{u.capacidad_maxima}</td><td className="num">{u.ocupado}</td><td className="num">{u.disponible}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sinCapacidad && <p className="mensaje-error">No hay ubicaciones disponibles con capacidad suficiente</p>}
            {error && <p className="mensaje-error">{error}</p>}
            <div className="acciones">
              <button className="btn btn-primario" onClick={confirmar} disabled={!conforme && !incidencia.trim()}>Confirmar entrada</button>
              <button className="btn" onClick={() => setPaso(1)}>Volver</button>
              <button className="btn" onClick={() => navigate('/')}>Salir</button>
            </div>
          </div>
        </>
      )}

      {paso === 3 && producto && (
        <div className="tarjeta resultado">
          <div className="resultado-icono ok">✓</div>
          <h2>Entrada registrada con éxito</h2>
          <p className="ayuda">El movimiento quedó registrado en el KARDEX y el lote fue asignado a su ubicación.</p>
          <div className="resumen">
            <span>Ítem</span><b>{producto.codigo_producto} · {producto.nombre_producto}</b>
            <span>Cantidad ingresada</span><b>{cantidad} {producto.unidad_medida}</b>
            <span>Ubicación</span><b>{ubicaciones.find((u) => u.id_ubicacion === idUbicacion)?.codigo_ubicacion}</b>
            <span>Stock anterior → nuevo</span><b>{producto.stock_actual} → {stockNuevo}</b>
          </div>
          <div className="acciones">
            <button className="btn btn-primario" onClick={() => navigate('/')}>Aceptar</button>
          </div>
        </div>
      )}
    </>
  );
}
