import { Agent, request as httpRequest, IncomingHttpHeaders } from 'node:http';

// Fresh 'Connection: close' sockets get reset ~2% of the time on some Windows machines; keep-alive avoids it.
const agent = new Agent({ keepAlive: true });

export interface Res {
  status: number;
  headers: IncomingHttpHeaders;
  text: string;
  body: any;
}

interface Opts {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

function once(base: string, path: string, o: Opts): Promise<Res> {
  const url = new URL(path, base);
  const data = o.body === undefined ? undefined : JSON.stringify(o.body);
  const headers: Record<string, string> = { ...o.headers };
  if (data) headers['Content-Type'] = 'application/json';
  return new Promise((resolve, reject) => {
    const r = httpRequest(
      { host: url.hostname, port: url.port, path: url.pathname + url.search, method: o.method ?? 'GET', headers, agent },
      (res) => {
        let text = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (text += c));
        res.on('end', () => {
          let body: any = text;
          try {
            body = JSON.parse(text);
          } catch {
            // not JSON
          }
          resolve({ status: res.statusCode!, headers: res.headers, text, body });
        });
      },
    );
    r.on('error', reject);
    r.end(data);
  });
}

// GETs are retried on a reset as a second line of defense; other methods are not idempotent.
export async function req(base: string, path: string, o: Opts = {}): Promise<Res> {
  for (let i = 0; ; i++) {
    try {
      return await once(base, path, o);
    } catch (e: any) {
      if (e.code !== 'ECONNRESET' || (o.method ?? 'GET') !== 'GET' || i >= 5) throw e;
    }
  }
}
