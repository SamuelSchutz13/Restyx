// Shared between the server and the web UI.
export const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
export type Method = (typeof METHODS)[number];
export const BODY_TYPES = ['none', 'json', 'text'] as const;
export type BodyType = (typeof BODY_TYPES)[number];

export interface KeyValue {
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestDef {
  id: string;
  name: string;
  method: Method;
  url: string;
  params: KeyValue[];
  headers: KeyValue[];
  bodyType: BodyType;
  body: string;
}

export interface Variable {
  key: string;
  value: string;
  secret: boolean;
  /** Set by the server on secret variables: a value is stored, but it never leaves the server. */
  stored?: boolean;
}

export interface Environment {
  id: string;
  name: string;
  vars: Variable[];
}

export interface Workspace {
  requests: RequestDef[];
  environments: Environment[];
  activeEnv: string | null;
}

export interface SendOptions {
  followRedirects: boolean;
  timeoutMs: number;
}

export interface ResponseData {
  status: number;
  statusText: string;
  url: string;
  headers: [string, string][];
  body: string;
  binary: boolean;
  truncated: boolean;
  size: number;
  timeMs: number;
  redirects: string[];
}

export type SendResult = { ok: true; response: ResponseData } | { ok: false; error: string };

export interface HistoryEntry {
  id: string;
  at: number;
  /** As typed, with {{variables}} unresolved, so secret values never land in the history. */
  request: RequestDef;
  status: number | null;
  timeMs: number;
  size: number;
  error?: string;
}
