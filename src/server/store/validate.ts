import { BadRequestException } from '@nestjs/common';
import { BODY_TYPES, METHODS, type Environment, type KeyValue, type RequestDef, type SendOptions, type Variable, type Workspace } from '../shared/types';

// Everything from the browser (and from .restyx.json, which anyone may edit) passes through here.
const MAX_ITEMS = 2000;
const MAX_TEXT = 10 * 1024 * 1024;

function fail(what: string): never {
  throw new BadRequestException(`Campo inválido: ${what}`);
}

const str = (v: unknown, what: string, max = 8192): string => (typeof v === 'string' && v.length <= max ? v : fail(what));
const list = (v: unknown, what: string): unknown[] => (Array.isArray(v) && v.length <= MAX_ITEMS ? v : fail(what));
const obj = (v: unknown, what: string): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : fail(what));
const oneOf = <T extends string>(v: unknown, all: readonly T[], what: string): T => (all.includes(v as T) ? (v as T) : fail(what));

function keyValue(v: unknown, what: string): KeyValue {
  const o = obj(v, what);
  return { key: str(o.key, `${what}.key`), value: str(o.value, `${what}.value`), enabled: o.enabled !== false };
}

export function parseRequest(v: unknown, what = 'request'): RequestDef {
  const o = obj(v, what);
  return {
    id: str(o.id, `${what}.id`, 64),
    name: str(o.name, `${what}.name`, 256),
    method: oneOf(o.method, METHODS, `${what}.method`),
    url: str(o.url, `${what}.url`, 16384),
    params: list(o.params, `${what}.params`).map((p, i) => keyValue(p, `${what}.params[${i}]`)),
    headers: list(o.headers, `${what}.headers`).map((h, i) => keyValue(h, `${what}.headers[${i}]`)),
    bodyType: oneOf(o.bodyType, BODY_TYPES, `${what}.bodyType`),
    body: str(o.body, `${what}.body`, MAX_TEXT),
  };
}

function variable(v: unknown, what: string): Variable {
  const o = obj(v, what);
  return { key: str(o.key, `${what}.key`, 256), value: str(o.value, `${what}.value`), secret: o.secret === true };
}

function environment(v: unknown, what: string): Environment {
  const o = obj(v, what);
  return {
    id: str(o.id, `${what}.id`, 64),
    name: str(o.name, `${what}.name`, 256),
    vars: list(o.vars, `${what}.vars`).map((x, i) => variable(x, `${what}.vars[${i}]`)),
  };
}

export function parseWorkspace(v: unknown): Workspace {
  const o = obj(v, 'workspace');
  return {
    requests: list(o.requests, 'requests').map((r, i) => parseRequest(r, `requests[${i}]`)),
    environments: list(o.environments, 'environments').map((e, i) => environment(e, `environments[${i}]`)),
    activeEnv: o.activeEnv === null || o.activeEnv === undefined ? null : str(o.activeEnv, 'activeEnv', 64),
  };
}

export function parseOptions(v: unknown): SendOptions {
  const o = v === undefined ? {} : obj(v, 'options');
  const t = o.timeoutMs ?? 30_000;
  if (typeof t !== 'number' || !Number.isInteger(t) || t < 100 || t > 300_000) fail('options.timeoutMs');
  return { followRedirects: o.followRedirects === true, timeoutMs: t };
}
