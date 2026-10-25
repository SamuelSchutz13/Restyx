import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

// The page only ever talks to this server: requests to APIs go through POST /api/send, never from the browser.
const CSP =
  "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; " +
  "frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

function sameToken(a: string | undefined, b: string): boolean {
  if (!a) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function readCookie(req: Request, name: string): string | undefined {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return undefined;
}

// Cookies ignore ports, so two Restyx instances would overwrite each other's session.
export const cookieName = (port: number) => `restyx_${port}`;

export function securityMiddleware(token: string, port: number): RequestHandler {
  const hosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
  const origins = new Set([...hosts].map((h) => `http://${h}`));

  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Content-Security-Policy', CSP);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    // API answers can carry tokens and response bodies: keep them out of the browser cache.
    if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');

    // DNS rebinding: a page on another domain resolving to 127.0.0.1 still sends its own Host.
    if (!hosts.has(req.headers.host ?? '')) return void res.status(421).send('Host não permitido.');
    const origin = req.headers.origin;
    if (origin ? !origins.has(origin) : req.method !== 'GET' && req.method !== 'HEAD') {
      return void res.status(403).send('Origem não permitida.');
    }
    // Same-site pages on other ports share the cookie; Fetch Metadata tells them apart from our own page.
    const site = req.headers['sec-fetch-site'];
    if (site && site !== 'same-origin' && site !== 'none') return void res.status(403).send('Origem não permitida.');

    if (req.method === 'GET' && req.path === '/' && typeof req.query.t === 'string') {
      if (!sameToken(req.query.t, token)) return void res.status(401).send('Token inválido.');
      res.setHeader('Set-Cookie', `${cookieName(port)}=${token}; HttpOnly; SameSite=Strict; Path=/`);
      return void res.redirect(302, '/');
    }

    if (!sameToken(readCookie(req, cookieName(port)), token)) {
      return void res.status(401).send('Abra a URL impressa no terminal.');
    }
    next();
  };
}
