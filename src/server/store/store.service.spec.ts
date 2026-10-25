import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { makeDir, TempDir } from '../../../test/helpers/temp-dir';
import type { Workspace } from '../shared/types';
import { StoreService } from './store.service';
import { parseWorkspace } from './validate';

const ws = (value: string): Workspace => ({
  requests: [{ id: 'r1', name: 'Users', method: 'GET', url: '{{base}}/users', params: [], headers: [{ key: 'Authorization', value: 'Bearer {{token}}', enabled: true }], bodyType: 'none', body: '' }],
  environments: [{ id: 'e1', name: 'dev', vars: [{ key: 'base', value: 'http://api.test', secret: false }, { key: 'token', value, secret: true }] }],
  activeEnv: 'e1',
});

describe('StoreService', () => {
  let tmp: TempDir;
  let store: StoreService;
  beforeEach(() => {
    tmp = makeDir();
    store = new StoreService(tmp.dir, tmp.home);
  });
  afterEach(() => tmp.cleanup());

  it('starts empty when there is no file', async () => {
    expect(await store.load()).toEqual({ requests: [], environments: [], activeEnv: null });
  });

  it('keeps secret values out of .restyx.json and out of what the browser sees', async () => {
    const pub = await store.save(ws('s3cr3t'));
    expect(readFileSync(store.file, 'utf8')).not.toContain('s3cr3t');
    expect(readFileSync(store.secretsFile, 'utf8')).toContain('s3cr3t');
    expect(pub.environments[0].vars[1]).toEqual({ key: 'token', value: '', secret: true, stored: true });
    expect((await store.load()).environments[0].vars[1].value).toBe('s3cr3t');
  });

  it('keeps the stored secret when the browser sends it back empty', async () => {
    await store.save(ws('s3cr3t'));
    await store.save(ws(''));
    expect((await store.load()).environments[0].vars[1].value).toBe('s3cr3t');
    await store.save(ws('new'));
    expect((await store.load()).environments[0].vars[1].value).toBe('new');
  });

  it('writes the secrets file readable by the owner only', async () => {
    await store.save(ws('x'));
    if (process.platform !== 'win32') expect(statSync(store.secretsFile).mode & 0o077).toBe(0);
  });

  it('refuses a malformed .restyx.json instead of overwriting it', async () => {
    writeFileSync(store.file, '{ broken');
    await expect(store.load()).rejects.toThrow(/não foi possível ler/);
  });
});

describe('parseWorkspace', () => {
  it('rejects unknown methods and wrong types', () => {
    const bad = ws('');
    (bad.requests[0] as any).method = 'TRACE';
    expect(() => parseWorkspace(bad)).toThrow(/method/);
    expect(() => parseWorkspace({ requests: [{}], environments: [] })).toThrow();
  });
  it('drops unknown fields', () => {
    const extra = { ...ws(''), evil: 1 } as any;
    expect(parseWorkspace(extra)).not.toHaveProperty('evil');
  });
});
