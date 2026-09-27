export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function money(n) {
  return (Number(n) || 0).toLocaleString('ar-EG') + ' ج.م';
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function statusClass(s) {
  return s === 'تم التسليم' ? 'status-done' : s === 'جاهز' ? 'status-ready' : 'status-open';
}
