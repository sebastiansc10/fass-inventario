import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!usuario.trim() || !clave) {
      setError('Ingrese su usuario y contraseña');
      return;
    }
    setCargando(true);
    const ok = await iniciarSesion(usuario, clave);
    setCargando(false);
    if (ok) navigate('/');
    else setError('Usuario o contraseña incorrectos');
  }

  return (
    <div className="login">
      <section className="login-panel">
        <div className="login-marca">
          <span className="marca-logo grande">F</span>
          <h1>FASS</h1>
          <p>Sistema de Gestión de Inventarios</p>
        </div>
        <ul className="login-puntos">
          <li>Stock de insumos y productos terminados en tiempo real</li>
          <li>Kardex valorizado bajo el método FIFO</li>
          <li>Alertas de reposición y solicitudes de compra</li>
        </ul>
      </section>

      <form className="login-form" onSubmit={enviar}>
        <h2>Iniciar sesión</h2>
        <p className="subtitulo">Ingrese sus credenciales para acceder al sistema</p>
        <div className="campo">
          <label htmlFor="usuario">Usuario</label>
          <input id="usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Ingrese su usuario" autoComplete="username" />
        </div>
        <div className="campo">
          <label htmlFor="clave">Contraseña</label>
          <input id="clave" type="password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Ingrese su contraseña" autoComplete="current-password" />
        </div>
        {error && <p className="mensaje-error">{error}</p>}
        <button className="btn btn-primario" disabled={cargando}>
          {cargando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
