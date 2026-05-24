import crypto from 'crypto';

const COOKIE_NAME = 'pulito_admin_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

export function hasAdminPassword() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function isValidAdminPassword(password) {
  return hasAdminPassword() && password === process.env.ADMIN_PASSWORD;
}

export function createAdminSessionCookie() {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(JSON.stringify({
    iat: now,
    exp: now + SESSION_DURATION_SECONDS,
  }));
  const signature = sign(payload);

  return {
    name: COOKIE_NAME,
    value: `${payload}.${signature}`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    },
  };
}

export function isAdminRequest(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = getSecret();

  if (!token || !secret) {
    return false;
  }

  const [payload, signature] = token.split('.');
  if (!payload || !signature || sign(payload) !== signature) {
    return false;
  }

  try {
    const session = JSON.parse(base64UrlDecode(payload));
    return typeof session.exp === 'number' && session.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
