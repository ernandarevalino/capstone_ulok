/**
 * Utility: resolve form detail route based on submission type.
 * Extracted here to avoid importing the heavy ActivityCalendarCabang component.
 */
export function getFormRoute(jenisBadanHukum?: string, id?: string): string {
  const suffix = id ? `?id=${id}` : '';
  if (!jenisBadanHukum) {
    return `/admin/cabang/usulan-lokasi/form/perorangan${suffix}`;
  }
  const bh = jenisBadanHukum.toLowerCase();
  if (bh.includes('cv') || bh.includes('pt') || bh.includes('badan')) {
    return `/admin/cabang/usulan-lokasi/form/badanhukum${suffix}`;
  }
  return `/admin/cabang/usulan-lokasi/form/perorangan${suffix}`;
}
