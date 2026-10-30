import type { Repositorio } from './repositorio';
import { repositorioPrueba } from './repositorioPrueba';

/** Si hay credenciales de Supabase se usa la base de datos real; si no, los datos de prueba. */
export const usaSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL);

let repo: Repositorio = repositorioPrueba;
if (usaSupabase) {
  repo = (await import('./repositorioSupabase')).repositorioSupabase;
}

export default repo;
