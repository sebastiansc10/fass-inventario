import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categorias } from '../../data/datosPrueba';
import type { TipoItem } from '../../data/tipos';
import { useAuth } from '../../context/AuthContext';
import {
  contarAjustesPendientes, exportarCSV, generarReporteValorizacion, type FilaValorizacion,
} from '../../services/reporteService';
import { ahoraISO, fecha, fechaHora, hoyISO, soles } from '../../lib/formato';

type Vista = 'parametros' | 'advertencia' | 'reporte';

export default function ReporteValorizacionPage() {
  const { empleado } = useAuth();
  const navigate = useNavigate();
  const [vista, setVista] = useState<Vista>('parametros');
  const [desde, setDesde] = useState(`${hoyISO().slice(0, 8)}01`);
  const [hasta, setHasta] = useState(hoyISO());
  const [tipo, setTipo] = useState<TipoItem | 'Todos'>('Todos');
  const [idCategoria, setIdCategoria] = useState(0);
  const [pendientes, setPendientes] = useState(0);
  const [filas, setFilas] = useState<FilaValorizacion[]>([]);
  const [generado, setGenerado] = useState('');
  const [exportado, setExportado] = useState(false);
  const [error, setError] = useState('');

  async function generar(omitirAviso = false) {
    setError('');
    try {
      if (!omitirAviso) {
        const n = await contarAjustesPendientes(`${desde}T00:00:00`, `${hasta}T23:59:59`);
        if (n > 0) { setPendientes(n); setVista('advertencia'); return; } // flujo alternativo 2
      }
      setFilas(await generarReporteValorizacion(desde, hasta, tipo, idCategoria, empleado!.id_empleado));
      setGenerado(ahoraISO());
      setVista('reporte');
    } catch (e) { setError((e as Error).message); setVista('parametros'); }
  }

  const total = (k: keyof Omit<FilaValorizacion, 'producto'>) => filas.reduce((s, f) => s + f[k], 0);

  function exportar(formato: 'PDF' | 'Excel') {
    if (formato === 'Excel') {
      exportarCSV('reporte_valorizacion', ['Código', 'Ítem', 'Unidad', 'Valor inicial', 'Entradas', 'Costo de salidas', 'Ajustes', 'Valor final'],
        filas.map((f) => [f.producto.codigo_producto, f.producto.nombre_producto, f.producto.unidad_medida, f.valorInicial, f.entradas, f.costoSalidas, f.ajustes, f.valorFinal]));
    } else window.print();
    setExportado(true);
  }

  return (
    <>
      <p className="migas">Reportes › Reporte de valorización</p>
      <h1 className="titulo">{vista === 'reporte' ? 'Reporte de valorización' : 'Parámetros del reporte'}</h1>
      <p className="subtitulo">{vista === 'reporte' ? 'Valor del inventario en el periodo bajo el método FIFO' : 'Defina el periodo y los filtros de la valorización'}</p>

      {(vista === 'parametros' || vista === 'advertencia') && (
        <div className="tarjeta">
          <div className="rejilla">
            <div className="campo"><label>Fecha inicio</label><input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
            <div className="campo"><label>Fecha fin</label><input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
            <div className="campo">
              <label>Tipo de ítem</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoItem | 'Todos')}>
                <option>Todos</option><option>Insumo</option><option>Producto terminado</option>
              </select>
            </div>
            <div className="campo">
              <label>Categoría</label>
              <select value={idCategoria} onChange={(e) => setIdCategoria(Number(e.target.value))}>
                <option value={0}>Todas</option>
                {categorias.map((c) => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
              </select>
            </div>
            <div className="campo"><label>Método de valorización</label><input disabled value="FIFO (primeras entradas, primeras salidas)" /></div>
          </div>
          {vista === 'advertencia' && (
            <div className="aviso">
              <strong>Advertencia:</strong> existen {pendientes} ajuste(s) pendiente(s) de aprobación que no se incluirán en la valorización.
              <div className="acciones" style={{ marginTop: 12 }}>
                <button className="btn btn-primario" onClick={() => generar(true)}>Continuar</button>
                <button className="btn" onClick={() => setVista('parametros')}>Cancelar</button>
              </div>
            </div>
          )}
          {error && <p className="mensaje-error">{error}</p>}
          {vista === 'parametros' && (
            <div className="acciones">
              <button className="btn btn-primario" onClick={() => generar()}>Generar</button>
              <button className="btn" onClick={() => navigate(-1)}>Volver</button>
              <button className="btn" onClick={() => navigate('/')}>Salir</button>
            </div>
          )}
        </div>
      )}

      {vista === 'reporte' && (
        <div className="tarjeta" style={{ maxWidth: "none" }}>
          <div className="cabecera-reporte">
            <div><span>Periodo: </span><b>{fecha(desde)} – {fecha(hasta)}</b></div>
            <div><span>Generado: </span><b>{fechaHora(generado)}</b></div>
            <div><span>Usuario: </span><b>{empleado?.nombre_empleado}</b></div>
            <div><span>Método: </span><b>FIFO</b></div>
          </div>
          <table className="tabla">
            <thead><tr><th>Código</th><th>Ítem</th><th>Unidad</th><th className="num">Valor inicial</th><th className="num">Entradas</th><th className="num">Costo de salidas</th><th className="num">Ajustes</th><th className="num">Valor final</th></tr></thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.producto.id_producto}>
                  <td>{f.producto.codigo_producto}</td><td>{f.producto.nombre_producto}</td><td>{f.producto.unidad_medida}</td>
                  <td className="num">{soles(f.valorInicial)}</td><td className="num">{soles(f.entradas)}</td>
                  <td className="num">{soles(f.costoSalidas)}</td><td className="num">{soles(f.ajustes)}</td><td className="num">{soles(f.valorFinal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Totales</td>
                <td className="num">{soles(total('valorInicial'))}</td><td className="num">{soles(total('entradas'))}</td>
                <td className="num">{soles(total('costoSalidas'))}</td><td className="num">{soles(total('ajustes'))}</td><td className="num">{soles(total('valorFinal'))}</td>
              </tr>
            </tfoot>
          </table>
          <p className="ayuda" style={{ marginTop: 12 }}>
            Inventario inicial {soles(total('valorInicial'))} (+) entradas {soles(total('entradas'))} (−) costo de salidas {soles(total('costoSalidas'))} (±) ajustes {soles(total('ajustes'))} (=) inventario final {soles(total('valorFinal'))}
          </p>
          <div className="acciones">
            <button className="btn btn-primario" onClick={() => exportar('PDF')}>Exportar PDF</button>
            <button className="btn btn-primario" onClick={() => exportar('Excel')}>Exportar Excel</button>
            <button className="btn" onClick={() => setVista('parametros')}>Volver</button>
          </div>
        </div>
      )}

      {exportado && (
        <div className="modal-fondo" onClick={() => setExportado(false)}>
          <div className="modal resultado" onClick={(e) => e.stopPropagation()}>
            <div className="resultado-icono ok">✓</div>
            <h2>Reporte exportado con éxito</h2>
            <div className="acciones"><button className="btn btn-primario" onClick={() => setExportado(false)}>Aceptar</button></div>
          </div>
        </div>
      )}
    </>
  );
}
