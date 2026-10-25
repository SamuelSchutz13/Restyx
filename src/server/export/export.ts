import type { Workspace } from '../shared/types';
import { buildUrl } from '../send/send.service';
import { envVars, resolveRequest } from '../send/vars';
import { redact } from '../store/store.service';

const q = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

/** The collection as JSON. Without includeSecrets, secret values are left out (only the "stored" flag). */
export function renderJson(ws: Workspace, includeSecrets: boolean): string {
  return JSON.stringify(includeSecrets ? ws : redact(ws), null, 2) + '\n';
}

/** One cURL command per request, resolved with the active environment; secrets stay as {{name}} unless included. */
export function renderCurl(ws: Workspace, includeSecrets: boolean): string {
  const vars = envVars(ws.environments.find((e) => e.id === ws.activeEnv), includeSecrets);
  const out = ['#!/bin/sh', '# Restyx: requisições exportadas', ''];
  for (const def of ws.requests) {
    const r = resolveRequest(def, vars);
    let url: string;
    try {
      url = buildUrl(r).href;
    } catch {
      url = r.url;
    }
    const parts = [`curl -X ${r.method} ${q(url)}`, ...r.headers.map((h) => `-H ${q(`${h.key}: ${h.value}`)}`)];
    if (r.bodyType !== 'none' && r.method !== 'GET' && r.method !== 'HEAD') parts.push(`--data-raw ${q(r.body)}`);
    out.push(`# ${r.name.replace(/[\r\n]+/g, ' ')}`, parts.join(' \\\n  '), '');
  }
  return out.join('\n');
}
