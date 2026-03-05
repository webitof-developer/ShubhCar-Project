import { api } from '@/utils/apiClient';

export async function getPublicSettings(fetchOptions = {}) {
  try {
    const payload = await api.get('/settings/public', { cache: 'no-store', ...fetchOptions });
    return payload || {};
  } catch {
    return {};
  }
}

export function getFlashDealNowFromSettings(settings = {}) {
  const raw = settings?.flash_deal_today;
  if (!raw) return null;
  const date = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function getFlashDealRangeFromSettings(settings = {}) {
  const toIso = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };

  const maxDaysRaw = settings?.flash_deal_max_days ?? settings?.flash_deal_range_end;
  const maxDaysNum = Number(maxDaysRaw);
  const maxDays = Number.isFinite(maxDaysNum) ? Math.max(1, Math.trunc(maxDaysNum)) : null;

  const start = new Date();
  const end = maxDays ? new Date(start.getTime()) : null;
  if (end) end.setDate(end.getDate() + maxDays);

  return {
    start: start.toISOString(),
    end: end ? end.toISOString() : toIso(settings?.flash_deal_range_end),
  };
}
