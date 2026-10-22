export const FIELDS = [
  { key: 'client', label: 'Customer name' },
  { key: 'item', label: 'Order details', multiline: true },
  { key: 'date', label: 'Delivery date', placeholder: 'YYYY-MM-DD' },
  { key: 'time', label: 'Delivery time', placeholder: 'HH:MM' },
  { key: 'price', label: 'Price' },
  { key: 'deposit', label: 'Deposit' },
  { key: 'address', label: 'Address' },
];

// Turns the server response into form values and a status flag per field:
// 'ok' | 'missing' | 'uncertain'
export function normalize(raw) {
  const values = {};
  const flags = {};
  const uncertain = Array.isArray(raw?.uncertain) ? raw.uncertain : [];
  for (const { key } of FIELDS) {
    let v = raw?.[key];
    v = v == null || String(v).trim().toLowerCase() === 'null' ? '' : String(v).trim();
    values[key] = v;
    flags[key] = !v ? 'missing' : uncertain.includes(key) ? 'uncertain' : 'ok';
  }
  return { values, flags };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function dueDate(order) {
  if (!DATE_RE.test(order.date || '')) return null;
  const time = /^\d{1,2}:\d{2}$/.test(order.time || '') ? order.time.padStart(5, '0') : '12:00';
  const d = new Date(`${order.date}T${time}:00`);
  return isNaN(d) ? null : d;
}

export function formatDate(dateStr) {
  if (!DATE_RE.test(dateStr || '')) return '';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

export function relativeLabel(dateStr) {
  if (!DATE_RE.test(dateStr || '')) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((new Date(`${dateStr}T00:00:00`) - today) / 864e5);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return formatDate(dateStr);
}

// Orders that are within 24 hours of delivery (and not long past).
export function remindersDue(orders, now = new Date()) {
  return orders.filter((o) => {
    const d = dueDate(o);
    return d && now >= d - 864e5 && now <= +d + 3 * 36e5;
  });
}

export const TABLE_ROWS = [
  { key: 'client', label: 'Customer', keys: ['client'] },
  { key: 'item', label: 'Item', keys: ['item'] },
  { key: 'when', label: 'Due', keys: ['date', 'time'] },
  { key: 'price', label: 'Price', keys: ['price'] },
  { key: 'deposit', label: 'Deposit', keys: ['deposit'] },
  { key: 'address', label: 'Address', keys: ['address'] },
];

export function whenText(o) {
  if (!o.date) return '';
  return formatDate(o.date) + (o.time ? `, ${o.time}` : '');
}

export function rowValue(o, key) {
  return key === 'when' ? whenText(o) : o[key] || '';
}

// Message the maker can send to the customer for confirmation.
// Missing fields turn into questions; uncertain fields ask for a double-check.
export function confirmationText(o) {
  const unsure = o.uncertain || [];
  const lines = [];
  const add = (icon, label, value, keys, ask) => {
    if (!value) lines.push(`❓ ${label}: ${ask}`);
    else lines.push(`${icon} ${label}: ${value}${keys.some((k) => unsure.includes(k)) ? ' (please double-check)' : ''}`);
  };
  add('🎂', 'Order', o.item, ['item'], 'please tell me the details');
  add('📅', 'Delivery', whenText(o), ['date', 'time'], 'please tell me the date and time');
  add('💰', 'Price', o.price, ['price'], 'to be confirmed');
  add('💳', 'Deposit', o.deposit, ['deposit'], 'please let me know about the deposit');
  add('📍', 'Address', o.address, ['address'], 'please send me the delivery address');
  const greeting = o.client ? `Hello, ${o.client}!` : 'Hello!';
  return `${greeting} Please confirm your order:\n\n${lines.join('\n')}\n\nIs everything correct? Reply "Yes" to confirm, or tell me what to change. Thank you! 🙏`;
}

export const STATUSES = [
  { key: 'new',         label: 'New',         color: '#2563EB', bg: '#E6EEFD' },
  { key: 'in_progress', label: 'In progress', color: '#7C3AED', bg: '#F0E8FD' },
  { key: 'ready',       label: 'Ready',       color: '#1F7A4D', bg: '#E8F5EE' },
  { key: 'done',        label: 'Delivered',   color: '#6B7280', bg: '#ECEDEF' },
];

export function statusInfo(key) {
  return STATUSES.find((s) => s.key === key) || STATUSES[0];
}
// "15 000", "15,000", "5000 тг" -> number (or null)
export function parseAmount(v) {
  if (v == null) return null;
  const s = String(v)
    .replace(/[\s\u00A0]/g, '')
    .replace(/,(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  const m = s.match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

export function hasDeposit(o) {
  return (parseAmount(o.deposit) || 0) > 0;
}

// Balance left to pay: price minus deposit (the deposit counts only if received).
// Returns '' when the price is unknown.
// Balance left to pay as a number: 0 if paid in full, null if the price is unknown
export function balanceAmount(o) {
  const price = parseAmount(o.price);
  if (price == null) return null;
  if (o.paid) return 0;
  const paid = o.depositPaid ? parseAmount(o.deposit) || 0 : 0;
  return Math.max(price - paid, 0);
}

export function remainderText(o) {
  const b = balanceAmount(o);
  if (b == null) return '';
  const currency = String(o.price).replace(/[\d\s\u00A0.,]/g, '').trim();
  const amount = b.toLocaleString('ru-RU');
  return currency ? `${amount} ${currency}` : amount;
}