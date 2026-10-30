# FASS – Sistema de Gestión de Inventarios (frontend)

React + TypeScript + Vite. Backend: Supabase (PostgreSQL + Auth).

## Ejecutar
```bash
npm install
npm run dev        # http://localhost:5173
```
Sin variables de entorno el sistema usa datos de prueba en memoria (src/data/datosPrueba.ts).
Usuarios de prueba: `lfernandez` / `fass2026` (Jefe de Almacén) y `fsalas` / `fass2026` (Gerente).

## Conectar Supabase
Copie `.env.example` a `.env` y complete `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
El repositorio `src/data/repositorioSupabase.ts` espera las tablas del modelo físico (sección 3.6),
la vista `v_ubicacion_ocupacion` y la función RPC `registrar_movimiento` (transacción movimiento + lotes + kardex).

## Estructura
- `src/pages` – una carpeta por caso de uso (pantallas)
- `src/services` – reglas de negocio (FIFO, umbral 4 %, punto de reorden, validaciones RF6/RF7)
- `src/data` – contrato del repositorio y sus implementaciones (prueba / Supabase)
- `scripts/capturasCodigo.mjs` – genera las capturas de código del informe
