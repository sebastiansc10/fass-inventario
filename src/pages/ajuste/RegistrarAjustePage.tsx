import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import repo from '../../data';
import type { AjusteInventario, MotivoAjuste, Producto, UbicacionConOcupacion } from '../../data/tipos';
import { useAuth } from '../../context/AuthContext';
import { UMBRAL_AJUSTE, solicitarAjuste, ultimoAjuste } from '../../services/ajusteService';
import { ErrorValidacion, validarDatosComunes } from '../../services/movimientoService';
import { ahoraISO, fecha, fechaHora, soles } from '../../lib/formato';

type Paso = 'contexto' | 'detalle' | 'resultado';

export default function RegistrarAjustePage() {
  const { empleado } = useAuth();
  const navigate = useNavigate();
  const [paso, setPaso] = useState<Paso>('contexto');
  const [codigo, setCodigo] = useState('');
  const [idUbicacion, setIdUbicacion] = useState('');
  const [ubicaciones, setUbicaciones] = useState<UbicacionConOcupacion[]>([]);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [anterior, setAnterior] = useState<AjusteInventario | null>(null);
  const [motivos, setMotivos] = useState<MotivoAjuste[]>([]);
  const [stockFisico, setStockFisico] = useState('');
  const [motivo, setMotivo] = useState<MotivoAjuste | null>(null);
  const [comentario, setComentario] = useState('');
  const [modalMotivo, setModalMotivo] = useState(false);
  const [resultado, setResultado] = useState<AjusteInventario | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    repo.listarUbicaciones().then(setUbicaciones);
    repo.listarMotivos().then(setMotivos);
  }, []);

  async function siguiente() {
    setError('');
    try {
      const p = await validarDatosComunes(codigo, 1);
      if (!idUbicacion) throw new ErrorValidacion('Seleccione la ubicación física afectada');
      setProducto(p);
      setAnterior(await ultimoAjuste(p.id_producto));
      setPaso('detalle');
    } catch (e) { setError((e as Error).message); }
  }

  function elegirMotivo(m: MotivoAjuste) {
    setMotivo(m);
    if (!m.requiere_comentario) { setComentario(''); setModalMotivo(false); } // vuelve a P3 automáticamente
  }

  async function solicitar() {
    setError('');
    try {
      const r = await solicitarAjuste({
        producto: producto!, idUbicacion: Number(idUbicacion), stockFisico: Number(stockFisico === '' ? NaN : stockFisico),
        motivo, comentario, idEmpleado: empleado!.id_empleado,
      });
      setResultado(r);
      setPaso('resultado');
    } catch (e) { setError((e as Error).message); }
  }

  return (
    <>
      <p className="migas">Movimientos › Registrar ajuste manual{paso === 'detalle' && ' › Línea de detalle'}</p>
      <h1 className="titulo">{paso === 'detalle' ? 'Línea de detalle del ajuste' : 'Registrar ajuste manual'}</h1>
      <p className="subtitulo">
        {paso === 'contexto' && 'Paso 1 de 3 — Contexto operativo'}
        {paso === 'detalle' && 'Paso 2 de 3 — Verifique el ítem y registre el ajuste'}
        {paso === 'resultado' && 'Paso 3 de 3 — Validación de solicitud'}
      </p>

      {paso === 'contexto' && (
        <div className="tarjeta">
          <div className="campo"><label>Código de ítem</label><input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej. PT-205" /></div>
          <div className="campo" style={{ marginTop: 16 }}>
            <label>Ubicación física afectada</label>
            <select value={idUbicacion} onChange={(e) => setIdUbicacion(e.target.value)}>
              <option value="">Seleccione ubicación</option>
              {ubicaciones.map((u) => <option key={u.id_ubicacion} value={u.id_ubicacion}>{u.codigo_ubicacion} — {u.zona}</option>)}
            </select>
          </div>
          <div className="campo" style={{ marginTop: 16 }}><label>Fecha</label><input disabled value={fechaHora(ahoraISO())} /></div>
          {error && <p className="mensaje-error">{error}</p>}
          <div className="acciones">
            <button className="btn btn-primario" onClick={siguiente}>Siguiente</button>
            <button className="btn" onClick={() => navigate(-1)}>Volver</button>
            <button className="btn" onClick={() => navigate('/')}>Salir</button>
          </div>
        </div>
      )}

      {paso === 'detalle' && producto && (
        <>
          <div className="tarjeta">
            <div className="rejilla">
              <div className="campo"><label>Código de ítem</label><input disabled value={producto.codigo_producto} /></div>
              <div className="campo"><label>Nombre de ítem</label><input disabled value={producto.nombre_producto} /></div>
              <div className="campo"><label>Descripción de ítem</label><input disabled value={producto.descripcion_producto} /></div>
              <div className="campo"><label>Stock teórico</label><input disabled value={`${producto.stock_actual} ${producto.unidad_medida}`} /></div>
              <div className="campo"><label>Fecha</label><input disabled value={fecha(ahoraISO())} /></div>
              <div className="campo"><label>Fecha último ajuste</label><input disabled value={anterior ? fecha(anterior.fecha_registro) : 'Sin ajustes previos'} /></div>
              <div className="campo"><label>Estado último ajuste</label><input disabled value={anterior?.estado_ajuste ?? '—'} /></div>
            </div>
          </div>
          <div className="tarjeta">
            <div className="rejilla">
              <div className="campo"><label>Stock físico</label><input type="number" min={0} value={stockFisico} onChange={(e) => setStockFisico(e.target.value)} placeholder="Ingrese conteo físico" /></div>
              <div className="campo"><label>Diferencia</label><input disabled value={stockFisico === '' ? '' : Number(stockFisico) - producto.stock_actual} /></div>
              <div className="campo">
                <label>Nombre motivo</label>
                <input readOnly value={motivo?.nombre_motivo ?? ''} placeholder="Seleccione un motivo" onClick={() => setModalMotivo(true)} style={{ cursor: 'pointer' }} />
              </div>
              <div className="campo"><label>Código de motivo</label><input disabled value={motivo?.codigo_motivo ?? ''} placeholder="Se completa al elegir el motivo" /></div>
            </div>
            {motivo?.requiere_comentario && <p className="ayuda" style={{ marginTop: 12 }}>Comentario: {comentario}</p>}
            {error && <p className="mensaje-error">{error}</p>}
            <div className="acciones">
              <button className="btn btn-primario" disabled={!motivo} onClick={solicitar}>Solicitar ajuste</button>
              <button className="btn" onClick={() => setPaso('contexto')}>Volver</button>
              <button className="btn" onClick={() => navigate('/')}>Salir</button>
            </div>
            <p className="ayuda" style={{ marginTop: 10 }}>
              El botón «Solicitar ajuste» permanece bloqueado hasta seleccionar un motivo. Diferencias mayores al {UMBRAL_AJUSTE * 100} % del stock requieren aprobación del Gerente.
            </p>
          </div>
        </>
      )}

      {modalMotivo && (
        <div className="modal-fondo" onClick={() => setModalMotivo(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Opciones de motivo</h2>
            <p className="subtitulo">Seleccione el motivo del ajuste</p>
            <div className="lista-motivos">
              {motivos.map((m) => (
                <button key={m.id_motivo} className={`opcion-motivo ${motivo?.id_motivo === m.id_motivo ? 'activa' : ''}`} onClick={() => elegirMotivo(m)}>
                  <span>{m.nombre_motivo}</span><small>{m.codigo_motivo}</small>
                </button>
              ))}
            </div>
            {motivo?.requiere_comentario && (
              <>
                <div className="campo" style={{ marginTop: 16 }}>
                  <label>Comentarios (obligatorio)</label>
                  <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Describa la incidencia del producto dañado" />
                </div>
                <div className="acciones">
                  <button className="btn btn-primario" disabled={!comentario.trim()} onClick={() => setModalMotivo(false)}>Aceptar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {paso === 'resultado' && resultado && producto && (
        <div className="tarjeta resultado">
          {resultado.estado_ajuste === 'Aprobado' ? (
            <>
              <div className="resultado-icono ok">✓</div>
              <h2>Ajuste realizado con éxito</h2>
              <p className="ayuda">La diferencia no supera el umbral y fue registrada en el KARDEX.</p>
            </>
          ) : (
            <>
              <div className="resultado-icono pendiente">!</div>
              <h2>Ajuste pendiente de aprobación</h2>
              <p className="ayuda">La diferencia supera el {UMBRAL_AJUSTE * 100} % del stock teórico. Se notificó al Gerente para su aprobación.</p>
            </>
          )}
          <div className="resumen">
            <span>Ítem</span><b>{producto.codigo_producto} · {producto.nombre_producto}</b>
            <span>Stock teórico → físico</span><b>{resultado.stock_teorico} → {resultado.stock_fisico}</b>
            <span>Diferencia</span><b>{resultado.diferencia > 0 ? '+' : ''}{resultado.diferencia} {producto.unidad_medida}</b>
            <span>Valor del ajuste</span><b>{soles(resultado.valor_ajuste)}</b>
            <span>Motivo</span><b>{motivo?.nombre_motivo}</b>
            <span>Estado</span><b>{resultado.estado_ajuste}</b>
          </div>
          <div className="acciones"><button className="btn btn-primario" onClick={() => navigate('/')}>Aceptar</button></div>
        </div>
      )}
    </>
  );
}
