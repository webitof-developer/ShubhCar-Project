import APP_CONFIG from '@/config/app.config';

const API_BASE_URL = APP_CONFIG.api.baseUrl;

const readJsonSafe = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export async function getPublicSettings(fetchOptions = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/public`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      ...fetchOptions,
    });

    if (!response.ok) return {};
    const data = await readJsonSafe(response);
    return data?.data || data || {};
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
