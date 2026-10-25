import { randomUUID } from 'node:crypto';
import type { HistoryEntry, RequestDef, ResponseData, SendOptions, SendResult } from '../shared/types';
import { StoreService } from '../store/store.service';
import { envVars, resolveRequest } from './vars';

export const MAX_BODY = 10 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const MAX_HISTORY = 100;
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]', '0.0.0.0', '[::]']);
// Credentials that must not follow a redirect to another origin.
const CREDENTIALS = ['authorization', 'proxy-authorization', 'cookie'];
const TEXTY = /^(text\/|application\/([\w.+-]*\+)?(json|xml|javascript|x-www-form-urlencoded|graphql|yaml|x-yaml|csv)|image\/svg)/i;

/** The real port is known only after listen(), so main.ts fills it in. */
export class SelfPort {
  port = 0;
}

class SendError extends Error {}

export function buildUrl(r: RequestDef): URL {
  const raw = /^[a-z][a-z\d+.-]*:\/\//i.test(r.url) ? r.url : `http://${r.url}`;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SendError('URL inválida.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new SendError('Só http:// e https:// são permitidos.');
  if (url.username || url.password) throw new SendError('Coloque credenciais num cabeçalho Authorization, não na URL.');
  for (const p of r.params) url.searchParams.append(p.key, p.value);
  return url;
}

async function readCapped(res: Response): Promise<{ bytes: Buffer; size: number; truncated: boolean }> {
  const chunks: Buffer[] = [];
  let size = 0;
  let truncated = false;
  if (res.body) {
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) {
        truncated = true;
        await reader.cancel().catch(() => {});
        break;
      }
      chunks.push(Buffer.from(value));
    }
  }
  return { bytes: Buffer.concat(chunks), size, truncated };
}

export class SendService {
  private history: HistoryEntry[] = [];

  constructor(private readonly store: StoreService, private readonly self: SelfPort) {}

  listHistory(): HistoryEntry[] {
    return this.history;
  }

  clearHistory() {
    this.history = [];
  }

  async send(def: RequestDef, opts: SendOptions): Promise<SendResult> {
    const result = await this.run(def, opts);
    const r = result.ok ? result.response : null;
    this.history.unshift({ id: randomUUID(), at: Date.now(), request: def, status: r?.status ?? null, timeMs: r?.timeMs ?? 0, size: r?.size ?? 0, error: result.ok ? undefined : result.error });
    this.history.length = Math.min(this.history.length, MAX_HISTORY);
    return result;
  }

  private async run(def: RequestDef, opts: SendOptions): Promise<SendResult> {
    const started = performance.now();
    try {
      const ws = await this.store.load();
      const r = resolveRequest(def, envVars(ws.environments.find((e) => e.id === ws.activeEnv)));
      let url = buildUrl(r);
      const headers = new Headers({ 'user-agent': 'Restyx' });
      for (const h of r.headers) {
        try {
          headers.set(h.key, h.value);
        } catch {
          throw new SendError(`Cabeçalho inválido: ${h.key}`);
        }
      }
      let method: string = r.method;
      let body: string | undefined = r.bodyType === 'none' || method === 'GET' || method === 'HEAD' ? undefined : r.body;
      if (body !== undefined && !headers.has('content-type')) headers.set('content-type', r.bodyType === 'json' ? 'application/json' : 'text/plain; charset=utf-8');

      const signal = AbortSignal.timeout(opts.timeoutMs);
      const redirects: string[] = [];
      for (;;) {
        this.refuseSelf(url);
        const res = await fetch(url, { method, headers, body, redirect: 'manual', signal });
        const location = res.headers.get('location');
        if (opts.followRedirects && location && res.status >= 300 && res.status < 400 && redirects.length < MAX_REDIRECTS) {
          await res.body?.cancel().catch(() => {});
          const next = new URL(location, url);
          if (next.protocol !== 'http:' && next.protocol !== 'https:') throw new SendError('Redirecionamento para um protocolo não permitido.');
          if (next.origin !== url.origin) CREDENTIALS.forEach((h) => headers.delete(h));
          if (res.status === 303 || ((res.status === 301 || res.status === 302) && method === 'POST')) {
            method = 'GET';
            body = undefined;
            headers.delete('content-type');
          }
          redirects.push(next.href);
          url = next;
          continue;
        }
        return { ok: true, response: await this.toResponse(res, url, redirects, started) };
      }
    } catch (e: any) {
      if (e instanceof SendError) return { ok: false, error: e.message };
      if (e?.name === 'TimeoutError') return { ok: false, error: `Tempo esgotado após ${opts.timeoutMs} ms.` };
      const cause = e?.cause?.code ?? e?.cause?.message ?? e?.message ?? String(e);
      return { ok: false, error: `Falha na conexão: ${cause}` };
    }
  }

  // Defense in depth: the security middleware would reject it anyway, but the proxy should never talk to Restyx itself.
  private refuseSelf(url: URL) {
    const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
    if (LOOPBACK.has(url.hostname) && port === this.self.port) throw new SendError('O Restyx não envia requisições para si mesmo.');
  }

  private async toResponse(res: Response, url: URL, redirects: string[], started: number): Promise<ResponseData> {
    const { bytes, size, truncated } = await readCapped(res);
    const type = res.headers.get('content-type') ?? '';
    const binary = type !== '' && !TEXTY.test(type);
    return {
      status: res.status,
      statusText: res.statusText,
      url: url.href,
      headers: [...res.headers.entries()],
      body: binary ? '' : bytes.toString('utf8'),
      binary,
      truncated,
      size,
      timeMs: Math.round(performance.now() - started),
      redirects,
    };
  }
}
