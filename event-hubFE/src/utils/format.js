const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const currencyFormat = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export function formatDateTime(value) {
  const date = toDate(value);
  return date ? dateTimeFormat.format(date) : '—';
}

export function formatDate(value) {
  const date = toDate(value);
  return date ? dateFormat.format(date) : '—';
}

export function formatPrice(value) {
  if (value === null || value === undefined) return '—';
  return Number(value) === 0 ? 'Free' : currencyFormat.format(Number(value));
}

export function isPast(value) {
  const date = toDate(value);
  return Boolean(date) && date.getTime() < Date.now();
}

export function toDateInput(value) {
  const date = toDate(value);
  if (!date) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };


export function highlightToHtml(fragment) {
  if (!fragment) return '';
  const text = Array.isArray(fragment) ? fragment.join(' … ') : String(fragment);
  return text
    .replace(/[&<>"']/g, (char) => ESCAPES[char])
    .replaceAll('&lt;em&gt;', '<mark>')
    .replaceAll('&lt;/em&gt;', '</mark>');
}

export function highlightOr(highlight, field, fallback) {
  return highlight?.[field] ? highlightToHtml(highlight[field]) : highlightToHtml(fallback);
}

export function truncate(text, max = 160) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
