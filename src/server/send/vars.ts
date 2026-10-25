import type { Environment, RequestDef } from '../shared/types';

export type Vars = Record<string, string>;

export function envVars(env: Environment | undefined, includeSecrets = true): Vars {
  const out: Vars = {};
  for (const v of env?.vars ?? []) if (v.key && (includeSecrets || !v.secret)) out[v.key] = v.value;
  return out;
}

/** Replaces {{name}}; unknown names stay as typed so the mistake is visible. */
export function fill(text: string, vars: Vars): string {
  return text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (m, k: string) => (Object.hasOwn(vars, k) ? vars[k] : m));
}

export function resolveRequest(r: RequestDef, vars: Vars): RequestDef {
  const kv = (l: RequestDef['params']) => l.filter((x) => x.enabled && x.key.trim()).map((x) => ({ ...x, key: fill(x.key, vars).trim(), value: fill(x.value, vars) }));
  return { ...r, url: fill(r.url, vars).trim(), params: kv(r.params), headers: kv(r.headers), body: fill(r.body, vars) };
}
