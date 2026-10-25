import type { Workspace } from '../shared/types';
import { renderCurl, renderJson } from './export';

const ws: Workspace = {
  requests: [{ id: 'r', name: 'Create', method: 'POST', url: '{{base}}/users', params: [{ key: 'v', value: '1', enabled: true }], headers: [{ key: 'Authorization', value: 'Bearer {{token}}', enabled: true }], bodyType: 'json', body: `{"n":"O'Neil"}` }],
  environments: [{ id: 'e', name: 'dev', vars: [{ key: 'base', value: 'https://api.test', secret: false }, { key: 'token', value: 's3cr3t', secret: true }] }],
  activeEnv: 'e',
};

describe('export', () => {
  it('leaves secrets out unless asked', () => {
    expect(renderJson(ws, false)).not.toContain('s3cr3t');
    expect(renderJson(ws, true)).toContain('s3cr3t');
    expect(renderCurl(ws, false)).not.toContain('s3cr3t');
    expect(renderCurl(ws, false)).toContain('Bearer {{token}}');
    expect(renderCurl(ws, true)).toContain('Bearer s3cr3t');
  });
  it('quotes values for the shell', () => {
    const sh = renderCurl(ws, false);
    expect(sh).toContain(`curl -X POST 'https://api.test/users?v=1'`);
    expect(sh).toContain(`--data-raw '{"n":"O'\\''Neil"}'`);
  });
});
