import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import repo from '../../data';
import type { Producto, UbicacionConOcupacion } from '../../data/tipos';
import { useAuth } from '../../context/AuthContext';
import { ErrorValidacion, registrarMovimientoGeneral, validarDatosComunes } from '../../services/movimientoService';
import { ahoraISO, fechaHora } from '../../lib/formato';

export default function RegistrarMovimientoPage() {
  const { empleado } = useAuth();
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [tipo, setTipo] = useState<'' | 'Entrada' | 'Salida'>('');
  const [ubicaciones, setUbicaciones] = useState<UbicacionConOcupacion[]>([]);
  const [idUbicacion, setIdUbicacion] = useState('');
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<{ anterior: number; nuevo: number } | null>(null);

  useEffect(() => { repo.listarUbicaciones().then(setUbicaciones); }, []);
  useEffect(() => {
    const t = setTimeout(async () => setProducto(codigo ? await repo.buscarProductoPorCodigo(codigo) : null), 250);
    return () => clearTimeout(t);
  }, [codigo]);

  async function siguiente() {
    setError('');
    try {
      const p = await validarDatosComunes(codigo, Number(cantidad)); // «Producto no encontrado» / «La cantidad debe ser mayor a cero»
      const ubicacion = ubicaciones.find((u) => u.id_ubicacion === Number(idUbicacion));
      if (!ubicacion) throw new ErrorValidacion('Seleccione la ubicación física afectada');
      if (!tipo) throw new ErrorValidacion('Seleccione el tipo de movimiento');
      const r = await registrarMovimientoGeneral(p, Number(cantidad), tipo, ubicacion, empleado!.id_empleado);
      setResultado({ anterior: r.stockAnterior, nuevo: r.stockNuevo });
    } catch (e) { setError((e as Error).message); }
  }

  if (resultado && producto) {
    return (
      <>
        <p className="migas">Movimientos › Registrar movimiento › Confirmación</p>
        <h1 className="titulo">Movimiento registrado</h1>
        <p className="subtitulo">El movimiento quedó trazado en el KARDEX</p>
        <div className="tarjeta resultado">
          <div className="resultado-icono ok">✓</div>
          <h2>Movimiento de {tipo.toLowerCase()} registrado con éxito</h2>
          <div className="resumen">
            <span>Ítem</span><b>{producto.codigo_producto} · {producto.nombre_producto}</b>
            <span>Cantidad</span><b>{cantidad} {producto.unidad_medida}</b>
            <span>Stock anterior</span><b>{resultado.anterior}</b>
            <span>Stock nuevo</span><b>{resultado.nuevo}</b>
            <span>Responsable</span><b>{empleado?.nombre_empleado}</b>
            <span>Fecha</span><b>{fechaHora(ahoraISO())}</b>
          </div>
          <div className="acciones">
            <button className="btn btn-primario" onClick={() => { setResultado(null); setCodigo(''); setCantidad(''); setTipo(''); setIdUbicacion(''); }}>Nuevo movimiento</button>
            <button className="btn" onClick={() => navigate('/')}>Salir</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="migas">Movimientos › Registrar movimiento</p>
      <h1 className="titulo">Registrar movimiento de producto</h1>
      <p className="subtitulo">Ingrese los datos comunes del movimiento</p>
      <div className="tarjeta">
        <div className="rejilla">
          <div className="campo"><label>Código de ítem</label><input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej. PT-205" /></div>
          <div className="campo"><label>Producto</label><input disabled value={producto?.nombre_producto ?? ''} placeholder="Se completa al ingresar el código" /></div>
          <div className="campo"><label>Cantidad</label><input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Ingrese cantidad" /></div>
          <div className="campo">
            <label>Ubicación física afectada</label>
            <select value={idUbicacion} onChange={(e) => setIdUbicacion(e.target.value)}>
              <option value="">Seleccione ubicación</option>
              {ubicaciones.map((u) => <option key={u.id_ubicacion} value={u.id_ubicacion}>{u.codigo_ubicacion} — {u.zona}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Tipo de movimiento</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
              <option value="">Entrada / Salida</option>
              <option>Entrada</option>
              <option>Salida</option>
            </select>
          </div>
          <div className="campo"><label>Fecha</label><input disabled value={fechaHora(ahoraISO())} /></div>
        </div>
        {error && <p className="mensaje-error">{error}</p>}
        <div className="acciones">
          <button className="btn btn-primario" onClick={siguiente}>Siguiente</button>
          <button className="btn" onClick={() => navigate(-1)}>Volver</button>
          <button className="btn" onClick={() => navigate('/')}>Salir</button>
        </div>
      </div>
    </>
  );
}
