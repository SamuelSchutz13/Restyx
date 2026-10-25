import { act, fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';
import { maskHeader } from './lib/settings';

const workspace = {
  requests: [{ id: 'r1', name: 'Listar usuários', method: 'GET', url: '{{base}}/users', params: [], headers: [{ key: 'Authorization', value: 'Bearer abc', enabled: true }], bodyType: 'none', body: '' }],
  environments: [{ id: 'e1', name: 'dev', vars: [{ key: 'token', value: '', secret: true, stored: true }] }],
  activeEnv: 'e1',
};
const sent = {
  ok: true,
  response: { status: 200, statusText: 'OK', url: 'http://api.test/users', headers: [['content-type', 'application/json'], ['set-cookie', 'sid=123']], body: '{"users":[]}', binary: false, truncated: false, size: 12, timeMs: 7, redirects: [] },
};
let calls: [string, RequestInit | undefined][] = [];

beforeEach(() => {
  calls = [];
  globalThis.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    calls.push([url, init]);
    const body = url === '/api/info' ? { dir: 'demo', file: '.restyx.json' }
      : url === '/api/workspace' ? workspace
      : url === '/api/history' ? []
      : url === '/api/send' ? sent
      : undefined;
    return { ok: body !== undefined, status: body ? 200 : 404, text: async () => JSON.stringify(body ?? {}) };
  }) as any;
});

describe('App', () => {
  it.each([
    ['', 'Coleção · 1'],
    ['#history', 'Nenhuma requisição enviada'],
    ['#environments', 'Ambientes · 1'],
    ['#export', 'Baixar'],
  ])('renders %s inside the frame', async (hash, marker) => {
    location.hash = hash;
    render(<App />);
    expect(await screen.findByText(marker)).toBeInTheDocument();
    expect(await screen.findByText('demo')).toBeInTheDocument();
    expect(screen.getAllByText('dev').length).toBeGreaterThan(0);
    await act(async () => {});
  });

  it('sends the selected request through the local server and shows the response as text', async () => {
    location.hash = '';
    render(<App />);
    fireEvent.click(await screen.findByText('Listar usuários'));
    fireEvent.click(screen.getByRole('button', { name: /Enviar/ }));
    expect(await screen.findByText((_, el) => el?.tagName === 'PRE' && !!el.textContent?.includes('"users": []'))).toBeInTheDocument();
    const send = calls.find(([u]) => u === '/api/send')!;
    expect(send[1]?.method).toBe('POST');
    // the unresolved template goes to the server; variables are filled in there
    expect(JSON.parse(String(send[1]?.body)).request.url).toBe('{{base}}/users');
    fireEvent.click(screen.getByRole('tab', { name: /Cabeçalhos · 2/ }));
    expect(screen.getByText('••••••••')).toBeInTheDocument();
    expect(screen.queryByText('sid=123')).not.toBeInTheDocument();
  });

  it('never shows stored secret values', async () => {
    location.hash = '#environments';
    render(<App />);
    expect(await screen.findByPlaceholderText('guardado: digite para trocar')).toHaveValue('');
  });
});

describe('maskHeader', () => {
  it('keeps the scheme and hides the credential', () => {
    expect(maskHeader('Authorization', 'Bearer abc', true)).toBe('Bearer ••••••••');
    expect(maskHeader('X-Other', 'abc', true)).toBe('abc');
    expect(maskHeader('Cookie', 'a=1', false)).toBe('a=1');
  });
});
