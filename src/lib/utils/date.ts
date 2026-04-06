/** Format date string to dd/mm/yyyy */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Convert dd/mm/yyyy to yyyy-mm-dd (ISO) */
export function parseViDate(str: string): string {
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return str;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Convert yyyy-mm-dd (ISO) to dd/mm/yyyy */
export function isoToVi(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}
