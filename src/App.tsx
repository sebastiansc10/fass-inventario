import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { RutaProtegida } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import InicioPage from './pages/InicioPage';
import RegistrarEntradaPage from './pages/entrada/RegistrarEntradaPage';
import RegistrarSalidaPage from './pages/salida/RegistrarSalidaPage';
import RegistrarMovimientoPage from './pages/movimiento/RegistrarMovimientoPage';
import RegistrarAjustePage from './pages/ajuste/RegistrarAjustePage';
import AprobarAjustesPage from './pages/ajuste/AprobarAjustesPage';
import SolicitarCompraPage from './pages/compras/SolicitarCompraPage';
import ReporteInventarioPage from './pages/reportes/ReporteInventarioPage';
import ReporteValorizacionPage from './pages/reportes/ReporteValorizacionPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RutaProtegida><Layout /></RutaProtegida>}>
        <Route path="/" element={<InicioPage />} />
        <Route path="/entrada" element={<RegistrarEntradaPage />} />
        <Route path="/salida" element={<RegistrarSalidaPage />} />
        <Route path="/movimiento" element={<RegistrarMovimientoPage />} />
        <Route path="/ajuste" element={<RegistrarAjustePage />} />
        <Route path="/aprobaciones" element={<RutaProtegida cargo="Gerente"><AprobarAjustesPage /></RutaProtegida>} />
        <Route path="/compras" element={<SolicitarCompraPage />} />
        <Route path="/reportes/inventario" element={<ReporteInventarioPage />} />
        <Route path="/reportes/valorizacion" element={<ReporteValorizacionPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
