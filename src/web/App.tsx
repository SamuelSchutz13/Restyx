import { useT } from './lib/i18n';
import { useCallback, useEffect, useState } from 'react';
import { Empty } from '@/components/kit';
import { api } from './lib/api';
import { newId, useWorkspace } from './lib/workspace';
import type { RequestDef, SendOptions, SendResult } from '../server/shared/types';
import { View } from './views/Shell';
import { Frame, FrameCtx } from './views/Frame';
import { RequestView } from './views/Request';
import type { Result } from './views/ResponseView';
import { History } from './views/History';
import { Environments } from './views/Environments';
import { Export } from './views/Export';

const VIEWS: View[] = ['request', 'history', 'environments', 'export'];
const fromHash = (): View => {
  const v = location.hash.slice(1) as View;
  return VIEWS.includes(v) ? v : 'request';
};

export function App() {
  const [view, setView] = useState<View>(fromHash);
  const t = useT();
  const { ws, error, save, update } = useWorkspace();
  const [info, setInfo] = useState<{ dir: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, Result>>({});
  useEffect(() => {
    api.get<{ dir: string }>('/api/info').then(setInfo).catch(() => {});
    const on = () => setView(fromHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const send = useCallback((r: RequestDef, options: SendOptions) => {
    setResults((m) => ({ ...m, [r.id]: { sending: true } }));
    api.post<SendResult>('/api/send', { request: r, options })
      .catch((e: Error) => ({ ok: false as const, error: e.message }))
      .then((res) => setResults((m) => ({ ...m, [r.id]: res })));
  }, []);

  const open = (r: RequestDef) => {
    const copy = { ...structuredClone(r), id: newId(), name: r.name };
    update((w) => ({ ...w, requests: [...w.requests, copy] }));
    setSelected(copy.id);
    location.hash = 'request';
  };

  const env = ws?.environments.find((e) => e.id === ws.activeEnv);
  const last = selected ? results[selected] : undefined;
  const status = ws && (
    <>
      <span>{t('{n} requisições', { n: ws.requests.length })}</span>
      <span className={save === 'error' ? 'text-destructive' : undefined}>
        {save === 'saving' ? t('salvando…') : save === 'saved' ? t('salvo em .restyx.json') : save === 'error' ? t('erro ao salvar') : ''}
      </span>
      {last && 'ok' in last && last.ok && <span>{`${last.response.status} · ${last.response.timeMs} ms`}</span>}
    </>
  );

  const body = !ws ? (
    <Frame><Empty title={error ? t('Não foi possível abrir o workspace: {e}', { e: error }) : t('Carregando…')} /></Frame>
  ) : view === 'history' ? <History onOpen={open} />
    : view === 'environments' ? <Environments ws={ws} update={update} />
    : view === 'export' ? <Frame><Export /></Frame>
    : <RequestView ws={ws} update={update} selected={selected} onSelect={setSelected} results={results} onSend={send} />;

  return (
    <FrameCtx.Provider value={{ view, onNavigate: (v) => (location.hash = v), dir: info?.dir, env: env?.name ?? null, status }}>
      {body}
    </FrameCtx.Provider>
  );
}
