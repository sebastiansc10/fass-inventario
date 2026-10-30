import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import repo from '../data';
import type { AjusteInventario, LineaKardex, Producto } from '../data/tipos';
import { useAuth } from '../context/AuthContext';
import { listarProductosReposicion, type ProductoReposicion } from '../services/compraService';
import { fechaHora, soles } from '../lib/formato';
import './InicioPage.css';

type Movimiento = LineaKardex & { producto: Producto };

export default function InicioPage() {
  const { empleado } = useAuth();
  const [productos, setProductos] = useState<ProductoReposicion[]>([]);
  const [pendientes, setPendientes] = useState<AjusteInventario[]>([]);
  const [recientes, setRecientes] = useState<Movimiento[]>([]);

  useEffect(() => {
    (async () => {
      const lista = await listarProductosReposicion();
      setProductos(lista);
      setPendientes(await repo.listarAjustes('Pendiente'));
      const movs: Movimiento[] = [];
      for (const p of lista) {
        for (const k of await repo.listarKardex(p.id_producto)) {
          movs.push({
            producto: p, fecha: k.fecha_kardex, tipo: k.movimiento.tipo_movimiento,
            cantidad: k.movimiento.cantidad_movimiento, costo_total: k.movimiento.costo_total,
            saldo_cantidad: k.saldo_cantidad, saldo_valorizado: k.saldo_valorizado,
            responsable: '', motivo: k.movimiento.motivo_movimiento,
          });
        }
      }
      setRecientes(movs.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 6));
    })();
  }, []);

  const alertas = productos.filter((p) => p.estado !== 'Normal');
  const valorTotal = productos.reduce((s, p) => s + p.saldo_valorizado, 0);

  return (
    <>
      <p className="migas">Inicio</p>
      <h1 className="titulo">Bienvenido, {empleado?.nombre_empleado.split(' ')[0]}</h1>
      <p className="subtitulo">Resumen del almacén de FASS al {fechaHora(new Date().toISOString().slice(0, 16)).slice(0, 10)}</p>

      <div className="kpis">
        <div className="kpi"><span>Ítems activos</span><strong>{productos.length}</strong><small>{productos.filter((p) => p.tipo_item === 'Insumo').length} insumos · {productos.filter((p) => p.tipo_item !== 'Insumo').length} productos terminados</small></div>
        <div className="kpi"><span>Inventario valorizado (FIFO)</span><strong>{soles(valorTotal)}</strong><small>Saldo actual del kardex</small></div>
        <div className="kpi alerta"><span>Alertas de reposición</span><strong>{alertas.length}</strong><small>Ítems en o bajo el punto de reorden</small></div>
        <div className="kpi pendiente"><span>Ajustes por aprobar</span><strong>{pendientes.length}</strong><small>Superan el umbral del 4 %</small></div>
      </div>

      <div className="inicio-columnas">
        <section className="tarjeta">
          <div className="cabecera-tarjeta">
            <h3>Alertas de reposición</h3>
            <Link to="/compras">Ver todas</Link>
          </div>
          <table className="tabla">
            <thead><tr><th>Código</th><th>Ítem</th><th className="num">Stock</th><th className="num">Reorden</th><th>Estado</th></tr></thead>
            <tbody>
              {alertas.map((p) => (
                <tr key={p.id_producto}>
                  <td>{p.codigo_producto}</td><td>{p.nombre_producto}</td>
                  <td className="num">{p.stock_actual}</td><td className="num">{p.punto_reorden}</td>
                  <td><span className={`badge ${p.estado === 'Solicitud pendiente' ? 'badge-ambar' : 'badge-rojo'}`}>{p.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="tarjeta">
          <div className="cabecera-tarjeta"><h3>Últimos movimientos</h3></div>
          <ul className="movs">
            {recientes.map((m, i) => (
              <li key={i}>
                <span className={`tipo tipo-${m.tipo.toLowerCase()}`}>{m.tipo}</span>
                <div>
                  <strong>{m.producto.nombre_producto}</strong>
                  <small>{fechaHora(m.fecha)} · {m.motivo}</small>
                </div>
                <b>{m.tipo === 'Salida' ? '−' : m.tipo === 'Ajuste' ? '±' : '+'}{m.cantidad} {m.producto.unidad_medida}</b>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
