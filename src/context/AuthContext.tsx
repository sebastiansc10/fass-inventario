import { createContext, useContext, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import repo from '../data';
import type { Empleado } from '../data/tipos';

interface Sesion {
  empleado: Empleado | null;
  iniciarSesion: (usuario: string, clave: string) => Promise<boolean>;
  cerrarSesion: () => void;
}

const AuthContext = createContext<Sesion>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [empleado, setEmpleado] = useState<Empleado | null>(null);

  async function iniciarSesion(usuario: string, clave: string) {
    const emp = await repo.iniciarSesion(usuario.trim(), clave); // RNF3
    setEmpleado(emp);
    return emp !== null;
  }

  return (
    <AuthContext.Provider value={{ empleado, iniciarSesion, cerrarSesion: () => setEmpleado(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/** Protege las rutas: sin sesión redirige al inicio de sesión; opcionalmente exige un cargo */
export function RutaProtegida({ children, cargo }: { children: ReactNode; cargo?: Empleado['cargo'] }) {
  const { empleado } = useAuth();
  if (!empleado) return <Navigate to="/login" replace />;
  if (cargo && empleado.cargo !== cargo) return <Navigate to="/" replace />;
  return <>{children}</>;
}
