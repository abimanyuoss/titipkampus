import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';

const COOKIE_NAME = 'titipkampus_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const DEFAULT_DEV_SECRET = 'development-only-session-secret-do-not-use-in-prod';

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable is required in production');
    }
    console.warn('[Auth] SESSION_SECRET not set, using insecure default. DO NOT use in production!');
    return DEFAULT_DEV_SECRET;
  }
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long');
  }
  return secret;
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(input: string) {
  const padded = input.padEnd(input.length + ((4 - (input.length % 4)) % 4), '=');
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function sign(value: string) {
  return base64Url(createHmac('sha256', getSecret()).update(value).digest());
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function parseCookies(req: Request) {
  const header = req.headers.cookie || '';
  return header.split(';').reduce<Record<string, string>>((acc, item) => {
    const [rawKey, ...rest] = item.trim().split('=');
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join('=') || '');
    return acc;
  }, {});
}

export function createSessionToken(userId: string) {
  const payload = base64Url(
    JSON.stringify({
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      nonce: randomBytes(12).toString('hex')
    })
  );
  return `${payload}.${sign(payload)}`;
}

export function readSessionUserId(req: Request) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;

  try {
    const decoded = JSON.parse(fromBase64Url(payload)) as { sub?: string; exp?: number };
    if (!decoded.sub || !decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded.sub;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, userId: string) {
  const token = createSessionToken(userId);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; HttpOnly; SameSite=Lax${secure}`
  );
}

export function clearSessionCookie(res: Response) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`);
}
