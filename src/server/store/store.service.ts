import { createHash, randomBytes } from 'node:crypto';
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Workspace } from '../shared/types';
import { parseWorkspace } from './validate';

export const WORKSPACE_FILE = '.restyx.json';
type Secrets = Record<string, Record<string, string>>; // envId -> key -> value

const EMPTY: Workspace = { requests: [], environments: [], activeEnv: null };

async function readJson(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (e: any) {
    if (e?.code === 'ENOENT') return null;
    throw new Error(`Restyx: não foi possível ler ${path}: ${e?.message ?? e}`);
  }
}

// Write to a temp file and rename, so a crash never leaves half a file behind.
async function writeAtomic(path: string, data: string, mode: number) {
  const tmp = `${path}.${randomBytes(6).toString('hex')}.tmp`;
  await writeFile(tmp, data, { mode });
  await rename(tmp, path);
  await chmod(path, mode).catch(() => {}); // no-op on Windows
}

/**
 * The collection lives in <dir>/.restyx.json and can be shared or committed: it never holds secret values.
 * Secret values go to ~/.restyx/secrets/<hash of dir>.json (0600), outside any repository.
 */
export class StoreService {
  readonly file: string;
  readonly secretsFile: string;
  private queue = Promise.resolve();

  constructor(readonly dir: string, home = process.env.RESTYX_HOME ?? join(homedir(), '.restyx')) {
    this.file = join(dir, WORKSPACE_FILE);
    const id = createHash('sha256').update(resolve(dir)).digest('hex').slice(0, 16);
    this.secretsFile = join(home, 'secrets', `${id}.json`);
  }

  private async readSecrets(): Promise<Secrets> {
    const raw = await readJson(this.secretsFile);
    return raw && typeof raw === 'object' ? (raw as Secrets) : {};
  }

  /** The full workspace with secret values filled in. Server-side only. */
  async load(): Promise<Workspace> {
    const raw = await readJson(this.file);
    const ws = raw === null ? structuredClone(EMPTY) : parseWorkspace(raw);
    const secrets = await this.readSecrets();
    for (const env of ws.environments) {
      for (const v of env.vars) if (v.secret) v.value = secrets[env.id]?.[v.key] ?? '';
    }
    return ws;
  }

  /** What the browser sees: secret values replaced by a "stored" flag. */
  async loadPublic(): Promise<Workspace> {
    return redact(await this.load());
  }

  /** A secret sent back empty keeps its stored value; the browser never had it to send. */
  save(next: Workspace): Promise<Workspace> {
    const run = this.queue.then(async () => {
      const old = await this.load();
      const secrets: Secrets = {};
      const shared = structuredClone(next);
      for (const env of shared.environments) {
        for (const v of env.vars) {
          if (!v.secret) continue;
          const prev = old.environments.find((e) => e.id === env.id)?.vars.find((x) => x.secret && x.key === v.key)?.value ?? '';
          const value = v.value || prev;
          if (value) (secrets[env.id] ??= {})[v.key] = value;
          v.value = '';
          delete v.stored;
        }
      }
      await mkdir(join(this.secretsFile, '..'), { recursive: true, mode: 0o700 });
      await writeAtomic(this.secretsFile, JSON.stringify(secrets, null, 2), 0o600);
      await writeAtomic(this.file, JSON.stringify(shared, null, 2) + '\n', 0o644);
      return redact(await this.load());
    });
    this.queue = run.then(() => {}, () => {});
    return run;
  }
}

export function redact(ws: Workspace): Workspace {
  const out = structuredClone(ws);
  for (const env of out.environments) {
    for (const v of env.vars) {
      if (!v.secret) continue;
      v.stored = v.value !== '';
      v.value = '';
    }
  }
  return out;
}
