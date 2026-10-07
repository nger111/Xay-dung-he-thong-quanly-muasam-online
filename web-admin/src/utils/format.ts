import { format, parseISO, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function formatDate(dateStr: string | undefined | null, fmt = 'dd/MM/yyyy'): string {
  if (!dateStr) return '—';
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return '—';
    return format(date, fmt, { locale: vi });
  } catch {
    return '—';
  }
}

export function formatDateTime(dateStr: string | undefined | null): string {
  return formatDate(dateStr, 'dd/MM/yyyy HH:mm');
}

export function formatRelativeTime(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  } catch {
    return '—';
  }
}

export function truncate(str: string, maxLength = 50): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}
