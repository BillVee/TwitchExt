export interface DecodedTwitchJwt {
  valid: boolean;
  header: {
    alg?: string;
    typ?: string;
    [key: string]: any;
  } | null;
  payload: {
    exp?: number;
    iat?: number;
    opaque_user_id?: string;
    user_id?: string;
    channel_id?: string;
    role?: 'broadcaster' | 'moderator' | 'viewer' | 'external' | string;
    is_unlinked?: boolean;
    pubsub_perms?: {
      listen?: string[];
      send?: string[];
      [key: string]: any;
    };
    [key: string]: any;
  } | null;
  signature: string;
  rawHeader: string;
  rawPayload: string;
  rawSignature: string;
  isExpired: boolean;
  expiresInSec: number | null;
  formattedExpiry: string | null;
  error?: string;
}

/**
 * Base64 URL decoding helper supporting UTF-8
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  try {
    const raw = atob(base64);
    return decodeURIComponent(
      raw
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return atob(base64);
  }
}

/**
 * Base64 URL encoding helper supporting UTF-8
 */
function base64UrlEncode(str: string): string {
  const utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
  return btoa(utf8Bytes)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Generates a compliant Twitch Extension mock JWT
 */
export function generateTwitchJwt(
  params: {
    channelId: string;
    userId: string;
    role: 'broadcaster' | 'moderator' | 'viewer' | 'external';
    opaqueUserId?: string;
    expiresInSec?: number;
  }
): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const expSec = params.expiresInSec ?? 3600 * 24; // 24 hours by default

  const payload = {
    exp: now + expSec,
    iat: now,
    opaque_user_id: params.opaqueUserId || `U${params.userId || '98765432'}`,
    user_id: params.userId || '98765432',
    channel_id: params.channelId || '12345678',
    role: params.role || 'broadcaster',
    is_unlinked: false,
    pubsub_perms: {
      listen: ['broadcast', 'global'],
      send: params.role === 'broadcaster' ? ['broadcast'] : [],
    },
  };

  const rawHeader = base64UrlEncode(JSON.stringify(header));
  const rawPayload = base64UrlEncode(JSON.stringify(payload));
  const rawSig = base64UrlEncode(`sig_${params.channelId}_${params.userId}_${params.role}`);

  return `${rawHeader}.${rawPayload}.${rawSig}`;
}

/**
 * Parses and validates a JWT token string
 */
export function decodeTwitchJwt(token: string): DecodedTwitchJwt {
  if (!token || typeof token !== 'string') {
    return {
      valid: false,
      header: null,
      payload: null,
      signature: '',
      rawHeader: '',
      rawPayload: '',
      rawSignature: '',
      isExpired: false,
      expiresInSec: null,
      formattedExpiry: null,
      error: 'Token is empty or undefined.',
    };
  }

  const trimmed = token.trim();
  const parts = trimmed.split('.');

  if (parts.length !== 3) {
    return {
      valid: false,
      header: null,
      payload: null,
      signature: '',
      rawHeader: parts[0] || '',
      rawPayload: parts[1] || '',
      rawSignature: parts[2] || '',
      isExpired: false,
      expiresInSec: null,
      formattedExpiry: null,
      error: `Invalid JWT structure: Expected 3 period-separated parts (Header.Payload.Signature), found ${parts.length}.`,
    };
  }

  let header: any = null;
  let payload: any = null;
  let error: string | undefined;

  try {
    const decodedHeaderStr = base64UrlDecode(parts[0]);
    header = JSON.parse(decodedHeaderStr);
  } catch (e: any) {
    error = `Failed to decode JWT Header: ${e.message || 'Malformed base64 JSON'}`;
  }

  try {
    const decodedPayloadStr = base64UrlDecode(parts[1]);
    payload = JSON.parse(decodedPayloadStr);
  } catch (e: any) {
    error = error ? `${error} | Payload Error: ${e.message}` : `Failed to decode JWT Payload: ${e.message || 'Malformed base64 JSON'}`;
  }

  const now = Math.floor(Date.now() / 1000);
  let isExpired = false;
  let expiresInSec: number | null = null;
  let formattedExpiry: string | null = null;

  if (payload && typeof payload.exp === 'number') {
    expiresInSec = payload.exp - now;
    isExpired = expiresInSec <= 0;
    formattedExpiry = new Date(payload.exp * 1000).toLocaleString();
  }

  const valid = !error && header !== null && payload !== null;

  return {
    valid,
    header,
    payload,
    signature: parts[2],
    rawHeader: parts[0],
    rawPayload: parts[1],
    rawSignature: parts[2],
    isExpired,
    expiresInSec,
    formattedExpiry,
    error,
  };
}
