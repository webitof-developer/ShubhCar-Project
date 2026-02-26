const env = require('../config/env');

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';

const FALLBACK_ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const FALLBACK_REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const parseDurationToMs = (value: any, fallbackMs: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value * 1000;
  }

  if (typeof value !== 'string') return fallbackMs;

  const input = value.trim();
  if (!input) return fallbackMs;

  const plainNumber = Number(input);
  if (Number.isFinite(plainNumber)) {
    return plainNumber * 1000;
  }

  const match = input.match(/^(\d+)\s*(ms|s|m|h|d)$/i);
  if (!match) return fallbackMs;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === 'ms') return amount;
  if (unit === 's') return amount * 1000;
  if (unit === 'm') return amount * 60 * 1000;
  if (unit === 'h') return amount * 60 * 60 * 1000;
  return amount * 24 * 60 * 60 * 1000;
};

const parseCookieHeader = (headerValue: any) => {
  const result: Record<string, string> = {};
  if (!headerValue || typeof headerValue !== 'string') return result;

  headerValue.split(';').forEach((chunk) => {
    const idx = chunk.indexOf('=');
    if (idx <= 0) return;
    const key = chunk.slice(0, idx).trim();
    const value = chunk.slice(idx + 1).trim();
    if (!key) return;
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
  });

  return result;
};

const getCookie = (req: any, name: string) => {
  if (!req || !name) return undefined;

  if (req.cookies && typeof req.cookies === 'object') {
    const direct = req.cookies[name];
    if (direct !== undefined) return direct;
  }

  const cookies = parseCookieHeader(req.headers?.cookie);
  return cookies[name];
};

const getAccessTokenFromRequest = (req: any) => {
  const authHeader = req?.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  const cookieToken = getCookie(req, ACCESS_TOKEN_COOKIE);
  if (cookieToken) return cookieToken;

  return undefined;
};

const getRefreshTokenFromRequest = (req: any) => {
  const bodyToken = req?.body?.refreshToken;
  if (bodyToken) return bodyToken;

  const cookieToken = getCookie(req, REFRESH_TOKEN_COOKIE);
  if (cookieToken) return cookieToken;

  return undefined;
};

const cookieBaseOptions = () => {
  const secure = env.NODE_ENV === 'production';
  const sameSite = secure ? 'none' : 'lax';

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  };
};

const setAccessTokenCookie = (res: any, token: string) => {
  if (!res?.cookie || !token) return;
  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    ...cookieBaseOptions(),
    maxAge: parseDurationToMs(
      env.JWT_EXPIRES_IN,
      FALLBACK_ACCESS_MAX_AGE_MS,
    ),
  });
};

const setRefreshTokenCookie = (res: any, token: string) => {
  if (!res?.cookie || !token) return;
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    ...cookieBaseOptions(),
    maxAge: parseDurationToMs(
      env.JWT_REFRESH_EXPIRES_IN,
      FALLBACK_REFRESH_MAX_AGE_MS,
    ),
  });
};

const setAuthCookies = (
  res: any,
  tokens: { accessToken?: string; refreshToken?: string } = {},
) => {
  if (tokens.accessToken) setAccessTokenCookie(res, tokens.accessToken);
  if (tokens.refreshToken) setRefreshTokenCookie(res, tokens.refreshToken);
};

const clearAuthCookies = (res: any) => {
  if (!res?.clearCookie) return;
  const options = cookieBaseOptions();
  res.clearCookie(ACCESS_TOKEN_COOKIE, options);
  res.clearCookie(REFRESH_TOKEN_COOKIE, options);
};

module.exports = {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  getCookie,
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setAuthCookies,
  clearAuthCookies,
};

