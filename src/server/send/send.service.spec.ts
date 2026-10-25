import { createServer, IncomingMessage, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { makeDir, TempDir } from '../../../test/helpers/temp-dir';
import type { RequestDef } from '../shared/types';
import { StoreService } from '../store/store.service';
import { MAX_BODY, SelfPort, SendService } from './send.service';
import { fill } from './vars';

type Seen = { method?: string; url?: string; headers: IncomingMessage['headers']; body: string };

function listen(handler: (req: IncomingMessage, body: string, res: import('node:http').ServerResponse) => void): Promise<{ server: Server; base: string }> {
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => handler(req, body, res));
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ server, base: `http://127.0.0.1:${(server.address() as AddressInfo).port}` })));
}

const def = (p: Partial<RequestDef>): RequestDef => ({ id: 'r', name: 'r', method: 'GET', url: '', params: [], headers: [], bodyType: 'none', body: '', ...p });
const opts = { followRedirects: false, timeoutMs: 5000 };

describe('SendService', () => {
  let tmp: TempDir;
  let store: StoreService;
  let svc: SendService;
  let api: { server: Server; base: string };
  let other: { server: Server; base: string };
  const seen: Seen[] = [];

  beforeAll(async () => {
    const record = (req: IncomingMessage, body: string) => seen.push({ method: req.method, url: req.url, headers: req.headers, body });
    other = await listen((req, body, res) => {
      record(req, body);
      res.end('other');
    });
    api = await listen((req, body, res) => {
      const path = req.url?.split('?')[0];
      record(req, body);
      if (path === '/json') return void res.setHeader('content-type', 'application/json').end('{"a":1}');
      if (path === '/redirect') return void res.writeHead(302, { location: '/json' }).end();
      if (path === '/away') return void res.writeHead(307, { location: `${other.base}/x` }).end();
      if (path === '/slow') return void setTimeout(() => res.end('late'), 2000);
      if (path === '/big') return void res.end(Buffer.alloc(MAX_BODY + 10, 97));
      if (path === '/bin') return void res.setHeader('content-type', 'image/png').end(Buffer.from([1, 2, 3]));
      res.end('ok');
    });
  });
  afterAll(() => {
    api.server.closeAllConnections();
    api.server.close();
    other.server.closeAllConnections();
    other.server.close();
  });
  beforeEach(async () => {
    seen.length = 0;
    tmp = makeDir();
    store = new StoreService(tmp.dir, tmp.home);
    svc = new SendService(store, new SelfPort());
    await store.save({
      requests: [],
      environments: [{ id: 'e', name: 'dev', vars: [{ key: 'base', value: api.base, secret: false }, { key: 'token', value: 'tok', secret: true }] }],
      activeEnv: 'e',
    });
  });
  afterEach(() => tmp.cleanup());

  it('sends with variables, params and a JSON body', async () => {
    const r = await svc.send(def({ method: 'POST', url: '{{base}}/json', params: [{ key: 'q', value: 'a b', enabled: true }, { key: 'off', value: '1', enabled: false }], headers: [{ key: 'Authorization', value: 'Bearer {{token}}', enabled: true }], bodyType: 'json', body: '{"x":"{{token}}"}' }), opts);
    expect(r.ok && r.response.status).toBe(200);
    expect(r.ok && r.response.body).toBe('{"a":1}');
    expect(seen[0]).toMatchObject({ method: 'POST', url: '/json?q=a+b', body: '{"x":"tok"}' });
    expect(seen[0].headers).toMatchObject({ authorization: 'Bearer tok', 'content-type': 'application/json', 'user-agent': 'Restyx' });
  });

  it('keeps the unresolved request in the history so secrets are not stored', async () => {
    await svc.send(def({ url: '{{base}}/', headers: [{ key: 'Authorization', value: 'Bearer {{token}}', enabled: true }] }), opts);
    expect(JSON.stringify(svc.listHistory())).not.toContain('tok"');
    expect(svc.listHistory()[0]).toMatchObject({ status: 200, request: { url: '{{base}}/' } });
  });

  it('does not follow redirects unless asked', async () => {
    const r = await svc.send(def({ url: `${api.base}/redirect` }), opts);
    expect(r.ok && r.response.status).toBe(302);
    const f = await svc.send(def({ url: `${api.base}/redirect` }), { ...opts, followRedirects: true });
    expect(f.ok && f.response).toMatchObject({ status: 200, redirects: [`${api.base}/json`] });
  });

  it('drops credentials on a redirect to another origin', async () => {
    const h = [{ key: 'Authorization', value: 'Bearer x', enabled: true }, { key: 'Cookie', value: 'a=1', enabled: true }, { key: 'X-Keep', value: '1', enabled: true }];
    await svc.send(def({ url: `${api.base}/away`, headers: h }), { ...opts, followRedirects: true });
    const last = seen[seen.length - 1];
    expect(last.url).toBe('/x');
    expect(last.headers.authorization).toBeUndefined();
    expect(last.headers.cookie).toBeUndefined();
    expect(last.headers['x-keep']).toBe('1');
  });

  it('times out', async () => {
    expect(await svc.send(def({ url: `${api.base}/slow` }), { ...opts, timeoutMs: 200 })).toEqual({ ok: false, error: 'Tempo esgotado após 200 ms.' });
  });

  it('caps the response body', async () => {
    const r = await svc.send(def({ url: `${api.base}/big` }), opts);
    expect(r.ok && r.response.truncated).toBe(true);
    // the first chunks are kept so the start of the body is still visible
    const len = r.ok ? r.response.body.length : -1;
    expect(len).toBeGreaterThan(0);
    expect(len).toBeLessThanOrEqual(MAX_BODY);
  });

  it('does not decode binary bodies', async () => {
    const r = await svc.send(def({ url: `${api.base}/bin` }), opts);
    expect(r.ok && r.response).toMatchObject({ binary: true, body: '', size: 3 });
  });

  it.each([
    ['file:///etc/passwd', 'Só http:// e https:// são permitidos.'],
    ['http://user:pass@x.test', 'Coloque credenciais num cabeçalho Authorization, não na URL.'],
    ['http://', 'URL inválida.'],
  ])('refuses %s', async (url, error) => {
    expect(await svc.send(def({ url }), opts)).toEqual({ ok: false, error });
    expect(seen).toHaveLength(0);
  });

  it('adds http:// when the scheme is missing', async () => {
    const r = await svc.send(def({ url: api.base.replace('http://', '') + '/' }), opts);
    expect(r.ok && r.response.status).toBe(200);
  });
});

describe('fill', () => {
  it('replaces known names and leaves unknown ones visible', () => {
    expect(fill('{{a}}/{{ b }}/{{c}}/{{constructor}}', { a: '1', b: '2' })).toBe('1/2/{{c}}/{{constructor}}');
  });
});
