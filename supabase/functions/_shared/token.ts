// Firma/verificación HMAC-SHA256 de tokens cortos (QR de negocio y códigos
// de canje). Formato compacto: base64url(payload).base64url(firma).

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromB64url(s: string): Uint8Array {
  const norm = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = norm.length % 4 ? '='.repeat(4 - (norm.length % 4)) : '';
  return Uint8Array.from(atob(norm + pad), c => c.charCodeAt(0));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signToken(
  payload: Record<string, unknown>,
  secret: string,
  ttlSeconds: number,
): Promise<string> {
  const body = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    jti: crypto.randomUUID(),
  };
  const p = b64url(enc.encode(JSON.stringify(body)));
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(p)));
  return `${p}.${b64url(sig)}`;
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<Record<string, any>> {
  const [p, s] = token.split('.');
  if (!p || !s) throw new Error('token_malformado');
  const key = await hmacKey(secret);
  const ok = await crypto.subtle.verify('HMAC', key, fromB64url(s), enc.encode(p));
  if (!ok) throw new Error('firma_invalida');
  const payload = JSON.parse(dec.decode(fromB64url(p)));
  if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('token_expirado');
  }
  return payload;
}
