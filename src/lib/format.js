// src/lib/format.js
import { format, formatDistanceToNowStrict } from 'date-fns';

// Money formatting with tabular numerals via CSS class .mono
export function money(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function moneyPlain(amount) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

// Date formatting
export function dateShort(date) {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy');
}

export function dateISO(date) {
  if (!date) return '';
  return format(new Date(date), 'yyyy-MM-dd');
}

export function dateTimeShort(date) {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function relativeTime(date) {
  if (!date) return '';
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
}

// Status badge mapping
export function statusBadgeClass(status) {
  const map = {
    draft: 'info',
    quotation: 'warning',
    confirmed: 'info',
    active: 'success',
    closed: 'danger',
    paid: 'success',
    cancelled: 'danger',
  };
  return map[status] || 'info';
}

export function statusLabel(status) {
  const map = {
    draft: 'Draft',
    quotation: 'Quotation',
    confirmed: 'Confirmed',
    active: 'Active',
    closed: 'Closed',
    paid: 'Paid',
    cancelled: 'Cancelled',
  };
  return map[status] || status;
}
