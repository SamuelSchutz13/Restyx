import { createServer, AddressInfo, Server } from 'node:net';
import { createApp } from '../main';
import { req } from '../../../test/helpers/http';
import { makeDir, TempDir } from '../../../test/helpers/temp-dir';

describe('server security', () => {
  let tmp: TempDir;
  let ctx: Awaited<ReturnType<typeof createApp>>;
  let base: string;
  let host: string;

  beforeAll(async () => {
    tmp = makeDir();
    process.env.RESTYX_HOME = tmp.home;
    ctx = await createApp(tmp.dir, 0);
    const port = (ctx.app.getHttpServer().address() as AddressInfo).port;
    base = `http://127.0.0.1:${port}`;
    host = `127.0.0.1:${port}`;
  });
  afterAll(async () => {
    await ctx.app.close();
    tmp.cleanup();
  });
  const cookie = () => ctx.cookie;
  const origin = () => base;

  it('listens on loopback only', () => {
    expect((ctx.app.getHttpServer().address() as AddressInfo).address).toBe('127.0.0.1');
    expect(ctx.url).toBe(`${base}/?t=${ctx.token}`);
  });
  it('rejects a foreign Host with 421', async () => {
    expect((await req(base, '/api/health', { headers: { Host: 'evil.example:80', Cookie: cookie() } })).status).toBe(421);
  });
  it('rejects a foreign Origin with 403', async () => {
    expect((await req(base, '/api/health', { headers: { Origin: 'http://evil.example', Cookie: cookie() } })).status).toBe(403);
  });
  it('rejects a POST without Origin with 403', async () => {
    expect((await req(base, '/api/send', { method: 'POST', headers: { Cookie: cookie() } })).status).toBe(403);
  });
  it('rejects cross-site requests by Fetch Metadata', async () => {
    expect((await req(base, '/api/workspace', { headers: { 'Sec-Fetch-Site': 'same-site', Cookie: cookie() } })).status).toBe(403);
  });
  it('rejects requests without the cookie', async () => {
    const res = await req(base, '/api/workspace');
    expect(res.status).toBe(401);
    expect(res.text).toContain('Abra a URL impressa no terminal.');
  });
  it('does not parse bodies before authenticating', async () => {
    const res = await req(base, '/api/send', { method: 'POST', headers: { Origin: origin() }, body: { x: 1 } });
    expect(res.status).toBe(401);
  });
  it('rejects a wrong token', async () => {
    expect((await req(base, '/?t=wrong')).status).toBe(401);
  });
  it('exchanges the token for a strict HttpOnly cookie', async () => {
    const res = await req(base, `/?t=${ctx.token}`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
    const set = String(res.headers['set-cookie']);
    expect(set).toContain('HttpOnly');
    expect(set).toContain('SameSite=Strict');
    expect(set.startsWith(`restyx_${host.split(':')[1]}=`)).toBe(true);
    expect(ctx.cookie).toBe(set.split(';')[0]);
  });
  it('serves the API with the cookie and security headers', async () => {
    const res = await req(base, '/api/health', { headers: { Cookie: cookie() } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    const csp = String(res.headers['content-security-policy']);
    const directive = (name: string) => (csp.split(';').map((d) => d.trim().split(/\s+/)).find((d) => d[0] === name) ?? []).slice(1);
    // the page may only talk to this server; every outside request goes through /api/send
    // (tokens, not exact lists: local proxies such as AdGuard append their own hosts)
    expect(directive('connect-src')).toEqual(expect.arrayContaining(["'self'"]));
    expect(directive('connect-src').filter((d) => !d.includes('adguard'))).toEqual(["'self'"]);
    expect(directive('img-src').filter((d) => !d.includes('adguard'))).toEqual(["'self'", 'data:']);
    expect(directive('object-src')).toEqual(["'none'"]);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['cache-control']).toBe('no-store');
  });
  it('accepts localhost as host', async () => {
    const res = await req(base, '/api/health', { headers: { Host: host.replace('127.0.0.1', 'localhost'), Cookie: cookie() } });
    expect(res.status).toBe(200);
  });
  it('refuses to proxy a request to itself', async () => {
    const request = { id: 'a', name: 'a', method: 'GET', url: `${base}/api/health`, params: [], headers: [], bodyType: 'none', body: '' };
    const res = await req(base, '/api/send', { method: 'POST', headers: { Origin: origin(), Cookie: cookie() }, body: { request } });
    expect(res.body).toEqual({ ok: false, error: 'O Restyx não envia requisições para si mesmo.' });
  });
  it('rejects an invalid workspace with 400', async () => {
    const res = await req(base, '/api/workspace', { method: 'PUT', headers: { Origin: origin(), Cookie: cookie() }, body: { requests: 'x' } });
    expect(res.status).toBe(400);
  });
});

describe('createApp port in use', () => {
  it('rejects with EADDRINUSE', async () => {
    const tmp = makeDir();
    const blocker: Server = createServer();
    await new Promise<void>((r) => blocker.listen(0, '127.0.0.1', r));
    const port = (blocker.address() as AddressInfo).port;
    await expect(createApp(tmp.dir, port)).rejects.toMatchObject({ code: 'EADDRINUSE' });
    blocker.close();
    tmp.cleanup();
  });
});
