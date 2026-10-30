/** Fecha/hora local en formato ISO sin zona (yyyy-mm-ddThh:mm:ss) */
export function ahoraISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export const hoyISO = () => ahoraISO().slice(0, 10);

export function fechaHora(iso: string): string {
  const [f, h = ''] = iso.split('T');
  const [a, m, d] = f.split('-');
  return `${d}/${m}/${a}${h ? ' ' + h.slice(0, 5) : ''}`;
}

export const fecha = (iso: string) => fechaHora(iso).slice(0, 10);

export const soles = (n: number) =>
  'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
