// Genera capturas del código fuente con apariencia de VS Code (dos paneles, como en el ejemplo)
import { codeToHtml } from 'shiki';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('/opt/npm-tools/node_modules/playwright');
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..');
const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });

const pares = [
  ['c00_estructura', ['src/App.tsx', 'export default function App', 26], ['src/data/index.ts', 'import', 12, 'src/data/repositorioSupabase.ts', 'export const repositorioSupabase', 14]],
  ['c01_login', ['src/pages/LoginPage.tsx', 'async function enviar', 30], ['src/context/AuthContext.tsx', 'export function AuthProvider', 30]],
  ['c02_inicio', ['src/pages/InicioPage.tsx', 'useEffect(() => {', 30], ['src/services/compraService.ts', 'export type EstadoReposicion', 24]],
  ['c03_compra', ['src/pages/compras/SolicitarCompraPage.tsx', 'function verDetalle', 26], ['src/services/compraService.ts', 'export const cantidadSugerida', 24]],
  ['c04_entrada', ['src/pages/entrada/RegistrarEntradaPage.tsx', 'async function siguiente', 30], ['src/services/movimientoService.ts', 'export async function validarDatosComunes', 30]],
  ['c05_ubicacion', ['src/pages/entrada/RegistrarEntradaPage.tsx', '<h3>Registrar ubicación</h3>', 26], ['src/services/movimientoService.ts', 'export async function registrarEntrada', 28]],
  ['c06_salida', ['src/pages/salida/RegistrarSalidaPage.tsx', 'async function siguiente', 22, 'src/pages/salida/RegistrarSalidaPage.tsx', 'Lotes que respaldan', 12], ['src/services/movimientoService.ts', 'export async function calcularSalidaFIFO', 30]],
  ['c07_movimiento', ['src/pages/movimiento/RegistrarMovimientoPage.tsx', 'async function siguiente', 30], ['src/services/movimientoService.ts', 'export async function registrarMovimientoGeneral', 22]],
  ['c08_ajuste', ['src/pages/ajuste/RegistrarAjustePage.tsx', 'async function siguiente', 34], ['src/services/ajusteService.ts', 'export const UMBRAL_AJUSTE', 34]],
  ['c09_motivos', ['src/pages/ajuste/RegistrarAjustePage.tsx', '{modalMotivo && (', 30], ['src/services/ajusteService.ts', '/** Lleva el ajuste aprobado', 30]],
  ['c10_aprobacion', ['src/pages/ajuste/AprobarAjustesPage.tsx', 'export default function AprobarAjustesPage', 28], ['src/services/ajusteService.ts', '/** El Gerente aprueba', 12, 'src/data/repositorioSupabase.ts', 'async registrarAjuste', 14]],
  ['c11_rep_inventario', ['src/pages/reportes/ReporteInventarioPage.tsx', 'async function generar', 28], ['src/services/reporteService.ts', 'export const estadoStock', 30]],
  ['c12_rep_valorizacion', ['src/pages/reportes/ReporteValorizacionPage.tsx', 'async function generar', 26], ['src/services/reporteService.ts', '/** Valorización del periodo', 28]],
];

function extracto(archivo, marcador, n) {
  const lineas = fs.readFileSync(path.join(RAIZ, archivo), 'utf8').split('\n');
  const i = lineas.findIndex((l) => l.includes(marcador));
  if (i < 0) throw new Error(`No se encontró «${marcador}» en ${archivo}`);
  return { desde: i + 1, codigo: lineas.slice(i, i + n).join('\n').replace(/\s+$/, '') };
}

async function panel(spec) {
  const bloques = [];
  for (let k = 0; k < spec.length; k += 3) {
    const [archivo, marcador, n] = spec.slice(k, k + 3);
    const { desde, codigo } = extracto(archivo, marcador, n);
    const lang = archivo.endsWith('.css') ? 'css' : 'tsx';
    let html = await codeToHtml(codigo, { lang, theme: 'dark-plus' });
    html = html.replace('<pre', `<pre style="counter-reset: linea ${desde - 1}"`);
    bloques.push({ archivo, html });
  }
  const pestanas = [...new Set(bloques.map((b) => b.archivo))]
    .map((a, i) => `<span class="tab ${i === 0 ? 'on' : ''}">${icono(a)} ${path.basename(a)}</span>`).join('');
  const migas = bloques[0].archivo.split('/').join(' › ');
  return `<div class="panel"><div class="tabs">${pestanas}</div><div class="migas">${migas}</div>${bloques.map((b, i) => (i ? `<div class="sep">${b.archivo}</div>` : '') + b.html).join('')}</div>`;
}

const icono = (a) => `<b class="ic ${a.endsWith('.tsx') ? 'tsx' : a.endsWith('.css') ? 'css' : 'ts'}">${a.endsWith('.tsx') ? '⚛' : a.endsWith('.css') ? '#' : 'TS'}</b>`;

const css = `
body{margin:0;background:#1e1e1e;font-family:'DejaVu Sans Mono',Consolas,monospace}
.ventana{display:grid;grid-template-columns:1fr 1fr;width:1840px;background:#1e1e1e}
.panel{border-right:1px solid #2b2b2b;min-width:0;overflow:hidden}
.tabs{background:#252526;height:34px;display:flex}
.tab{color:#969696;font:13px Arial,sans-serif;padding:9px 16px;border-right:1px solid #1e1e1e}
.tab.on{background:#1e1e1e;color:#fff;border-top:1px solid #0078d4}
.ic{font-size:11px;margin-right:4px}.ic.tsx{color:#4fc1ff}.ic.ts{color:#3178c6}.ic.css{color:#cc6699}
.migas{color:#a9a9a9;font:12px Arial,sans-serif;padding:4px 16px 6px;}
.sep{color:#6a9955;font-size:12px;padding:8px 16px;border-top:1px dashed #3c3c3c;margin-top:4px}
pre{margin:0;padding:2px 0 10px;background:#1e1e1e!important;font-size:12.5px;line-height:19px;white-space:pre;}
code{counter-reset:none}
.line{display:inline}
.line::before{counter-increment:linea;content:counter(linea);display:inline-block;width:44px;margin-right:18px;text-align:right;color:#6e7681}
`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1.5, viewport: { width: 1840, height: 600 } });
for (const [nombre, izq, der] of pares) {
  const html = `<html><head><style>${css}</style></head><body><div class="ventana">${await panel(izq)}${await panel(der)}</div></body></html>`;
  await page.setContent(html);
  await page.locator('.ventana').screenshot({ path: path.join(OUT, nombre + '.png') });
  console.log('ok', nombre);
}
await browser.close();
