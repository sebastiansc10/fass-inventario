import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

interface Enlace { ruta: string; texto: string }
interface Grupo { titulo?: string; enlaces: Enlace[]; soloGerente?: boolean }

const menu: Grupo[] = [
  { enlaces: [{ ruta: '/', texto: 'Inicio' }] },
  {
    titulo: 'Movimientos',
    enlaces: [
      { ruta: '/entrada', texto: 'Registrar entrada' },
      { ruta: '/salida', texto: 'Registrar salida' },
      { ruta: '/movimiento', texto: 'Registrar movimiento' },
      { ruta: '/ajuste', texto: 'Registrar ajuste manual' },
    ],
  },
  { titulo: 'Compras', enlaces: [{ ruta: '/compras', texto: 'Solicitar orden de compra' }] },
  { titulo: 'Aprobaciones', soloGerente: true, enlaces: [{ ruta: '/aprobaciones', texto: 'Aprobar ajustes' }] },
  {
    titulo: 'Reportes',
    enlaces: [
      { ruta: '/reportes/inventario', texto: 'Reporte de inventario' },
      { ruta: '/reportes/valorizacion', texto: 'Reporte de valorización' },
    ],
  },
];

export default function Layout() {
  const { empleado, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const esGerente = empleado?.cargo === 'Gerente';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-marca">
          <span className="marca-logo">F</span>
          <div>
            <strong>FASS</strong>
            <small>Gestión de inventarios</small>
          </div>
        </div>
        <nav>
          {menu.filter((g) => !g.soloGerente || esGerente).map((g, i) => (
            <div key={i} className="grupo">
              {g.titulo && <p className="grupo-titulo">{g.titulo}</p>}
              {g.enlaces.map((e) => (
                <NavLink key={e.ruta} to={e.ruta} end className={({ isActive }) => 'enlace' + (isActive ? ' activo' : '')}>
                  {e.texto}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-usuario">
          <span className="avatar">{empleado?.nombre_empleado.split(' ').map((p) => p[0]).join('')}</span>
          <div>
            <strong>{empleado?.nombre_empleado}</strong>
            <small>{empleado?.cargo}</small>
          </div>
          <button title="Cerrar sesión" onClick={() => { cerrarSesion(); navigate('/login'); }}>⏻</button>
        </div>
      </aside>
      <main className="contenido">
        <Outlet />
      </main>
    </div>
  );
}
