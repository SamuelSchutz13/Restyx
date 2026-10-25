import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface TempDir {
  dir: string;
  home: string;
  cleanup(): void;
}

/** A workspace folder plus a separate fake ~/.restyx for secrets. */
export function makeDir(): TempDir {
  const root = mkdtempSync(join(tmpdir(), 'restyx-'));
  const dir = join(root, 'ws');
  const home = join(root, 'home');
  mkdirSync(dir);
  return { dir, home, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}
