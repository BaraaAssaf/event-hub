import { isProd, env } from '../config/env.js';

export const AUTH_COOKIE_NAME = 'eventhub_token';

function cookieMaxAgeMs() {
  const raw = env.jwtExpiresIn;
  const match = /^(\d+)([smhd])$/i.exec(String(raw).trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * multipliers[unit];
}

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: cookieMaxAgeMs(),
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
  });
}

export function readTokenFromRequest(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }
  return req.cookies?.[AUTH_COOKIE_NAME] || null;
}
