import { useEffect, useState } from 'react';
import repo from '../../data';
import type { AjusteInventario, MotivoAjuste, Producto } from '../../data/tipos';
import { useAuth } from '../../context/AuthContext';
import { resolverAjuste } from '../../services/ajusteService';
import { fechaHora, soles } from '../../lib/formato';

export default function AprobarAjustesPage() {
  const { empleado } = useAuth();
  const [ajustes, setAjustes] = useState<AjusteInventario[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [motivos, setMotivos] = useState<MotivoAjuste[]>([]);
  const [filtro, setFiltro] = useState<'Pendiente' | 'Todos'>('Pendiente');
  const [mensaje, setMensaje] = useState('');

  async function cargar() {
    setAjustes(await repo.listarAjustes(filtro === 'Todos' ? undefined : 'Pendiente'));
    setProductos(await repo.listarProductos());
  }
  useEffect(() => { cargar(); repo.listarMotivos().then(setMotivos); }, [filtro]);

  async function resolver(a: AjusteInventario, aprobar: boolean) {
    await resolverAjuste(a, aprobar, empleado!.id_empleado);
    setMensaje(aprobar ? `Ajuste N.º ${a.id_ajuste} aprobado y registrado en el KARDEX` : `Ajuste N.º ${a.id_ajuste} rechazado`);
    cargar();
  }

  const prod = (id: number) => productos.find((p) => p.id_producto === id);

  return (
    <>
      <p className="migas">Aprobaciones › Aprobar ajustes</p>
      <h1 className="titulo">Ajustes pendientes de aprobación</h1>
      <p className="subtitulo">Ajustes de inventario cuya diferencia supera el 4 % del stock teórico</p>

      <div className="pildoras">
        <button className={`pildora ${filtro === 'Pendiente' ? 'activa' : ''}`} onClick={() => setFiltro('Pendiente')}>Pendientes</button>
        <button className={`pildora ${filtro === 'Todos' ? 'activa' : ''}`} onClick={() => setFiltro('Todos')}>Historial</button>
      </div>

      <div className="tarjeta" style={{ maxWidth: "none" }}>
        {ajustes.length === 0 ? <p className="ayuda">No hay ajustes pendientes.</p> : (
          <table className="tabla">
            <thead><tr><th>N.º</th><th>Fecha</th><th>Ítem</th><th className="num">Teórico</th><th className="num">Físico</th><th className="num">Dif.</th><th className="num">Valor</th><th>Motivo / comentario</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {ajustes.map((a) => (
                <tr key={a.id_ajuste}>
                  <td>{a.id_ajuste}</td>
                  <td>{fechaHora(a.fecha_registro)}</td>
                  <td>{prod(a.id_producto)?.codigo_producto} · {prod(a.id_producto)?.nombre_producto}</td>
                  <td className="num">{a.stock_teorico}</td>
                  <td className="num">{a.stock_fisico}</td>
                  <td className="num">{a.diferencia}</td>
                  <td className="num">{soles(a.valor_ajuste)}</td>
                  <td><strong>{motivos.find((m) => m.id_motivo === a.id_motivo)?.nombre_motivo}</strong><br /><small className="ayuda">{a.comentario}</small></td>
                  <td><span className={`badge ${a.estado_ajuste === 'Pendiente' ? 'badge-ambar' : a.estado_ajuste === 'Aprobado' ? 'badge-verde' : 'badge-gris'}`}>{a.estado_ajuste}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {a.estado_ajuste === 'Pendiente' && (
                      <>
                        <button className="btn btn-exito" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => resolver(a, true)}>Aprobar</button>{' '}
                        <button className="btn btn-peligro" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => resolver(a, false)}>Rechazar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {mensaje && <p style={{ color: 'var(--exito)', fontWeight: 600, marginTop: 14 }}>{mensaje}</p>}
      </div>
    </>
  );
}
