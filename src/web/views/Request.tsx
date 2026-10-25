import { useState } from 'react';
import { FilePlus2, Loader2, Plus, Send, Trash2 } from 'lucide-react';
import { cn } from 'cn';
import { Empty, Hint, Section, UnderlineTabs } from '@/components/kit';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { BODY_TYPES, type RequestDef, type SendOptions, type Workspace } from '../../server/shared/types';
import { useT } from '../lib/i18n';
import { isSensitive, useSettings } from '../lib/settings';
import { newRequest } from '../lib/workspace';
import { Frame } from './Frame';
import { KVEditor, MethodChip, MethodSelect } from './chips';
import { ResponseView, type Result } from './ResponseView';

type Tab = 'params' | 'headers' | 'body' | 'options';
const BODY_LABEL: Record<RequestDef['bodyType'], string> = { none: 'Nenhum', json: 'JSON', text: 'Texto' };

export function RequestView(props: {
  ws: Workspace;
  update(fn: (w: Workspace) => Workspace): void;
  selected: string | null;
  onSelect(id: string | null): void;
  results: Record<string, Result>;
  onSend(r: RequestDef, o: SendOptions): void;
}) {
  const t = useT();
  const { mask } = useSettings();
  const [tab, setTab] = useState<Tab>('params');
  const [opts, setOpts] = useState<SendOptions>({ followRedirects: false, timeoutMs: 30_000 });
  const req = props.ws.requests.find((r) => r.id === props.selected) ?? null;

  const add = () => {
    const r = newRequest(t('Nova requisição'));
    props.update((w) => ({ ...w, requests: [...w.requests, r] }));
    props.onSelect(r.id);
  };
  const edit = (patch: Partial<RequestDef>) => req && props.update((w) => ({ ...w, requests: w.requests.map((r) => (r.id === req.id ? { ...r, ...patch } : r)) }));
  const remove = (r: RequestDef) => {
    if (!window.confirm(t('Apagar "{x}"?', { x: r.name }))) return;
    props.update((w) => ({ ...w, requests: w.requests.filter((x) => x.id !== r.id) }));
    if (r.id === props.selected) props.onSelect(null);
  };
  const result = req ? props.results[req.id] : undefined;
  const sending = !!result && 'sending' in result;
  const send = () => req && !sending && props.onSend(req, opts);

  const left = {
    title: t('Coleção · {n}', { n: props.ws.requests.length }),
    width: 300,
    action: (
      <button type="button" onClick={add} aria-label={t('Nova requisição')} title={t('Nova requisição')} className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground">
        <Plus className="size-4" />
      </button>
    ),
    content: (
      <ul className="py-1">
        {props.ws.requests.map((r) => (
          <li key={r.id} className={cn('group flex items-center gap-2 px-3 py-1.5 hover:bg-accent', r.id === props.selected && 'bg-accent')}>
            <button type="button" onClick={() => props.onSelect(r.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
              <MethodChip method={r.method} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px]">{r.name || t('sem nome')}</span>
                <span className="block truncate font-mono text-[11px] text-muted-foreground">{r.url || '—'}</span>
              </span>
            </button>
            <button type="button" onClick={() => remove(r)} aria-label={t('Apagar {x}', { x: r.name })} title={t('Apagar')} className="rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive focus:opacity-100">
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
        {!props.ws.requests.length && <li className="px-3 py-2 text-[13px] text-muted-foreground">{t('Nenhuma requisição salva.')}</li>}
      </ul>
    ),
  };
  const right = { title: t('Resposta'), width: 480, content: <ResponseView result={result} /> };

  if (!req) {
    return (
      <Frame left={left} right={right}>
        <Empty icon={<FilePlus2 className="size-8" />} title={t('Escolha uma requisição à esquerda')}>
          {t('Ou crie uma nova. Tudo fica em .restyx.json nesta pasta; valores secretos ficam fora dele.')}
        </Empty>
        <div className="flex justify-center"><Button size="sm" onClick={add}><Plus className="size-4" /> {t('Nova requisição')}</Button></div>
      </Frame>
    );
  }

  const count = (n: number) => (n ? ` · ${n}` : '');
  return (
    <Frame left={left} right={right}>
      <div className="mx-auto max-w-4xl space-y-3">
        <Input value={req.name} onChange={(e) => edit({ name: e.target.value })} aria-label={t('Nome')} className="h-8 border-transparent bg-transparent px-1 text-[15px] font-medium shadow-none dark:bg-transparent" />
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <MethodSelect value={req.method} onChange={(method) => edit({ method })} label={t('Método')} />
          <Input value={req.url} onChange={(e) => edit({ url: e.target.value })} placeholder="https://api.exemplo.com/users ou {{base}}/users" aria-label="URL" spellCheck={false} className="flex-1 font-mono text-[13px]" />
          <Button type="submit" disabled={sending || !req.url.trim()}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} {t('Enviar')}
          </Button>
        </form>
        <Hint>{t('Use {{nome}} para variáveis do ambiente ativo. Elas são preenchidas no servidor local, e os segredos nunca chegam ao navegador.')}</Hint>

        <div className="rounded-md border bg-surface">
          <UnderlineTabs<Tab>
            tabs={[
              { id: 'params', label: `${t('Parâmetros')}${count(req.params.length)}` },
              { id: 'headers', label: `${t('Cabeçalhos')}${count(req.headers.length)}` },
              { id: 'body', label: t('Corpo') },
              { id: 'options', label: t('Opções') },
            ]}
            value={tab}
            onChange={setTab}
          />
          <div className="p-3">
            {tab === 'params' && <KVEditor rows={req.params} onChange={(params) => edit({ params })} keyLabel={t('parâmetro')} />}
            {tab === 'headers' && <KVEditor rows={req.headers} onChange={(headers) => edit({ headers })} keyLabel={t('cabeçalho')} secret={(k) => mask && isSensitive(k)} />}
            {tab === 'body' && (
              <div className="space-y-2">
                <div role="radiogroup" aria-label={t('Tipo do corpo')} className="flex gap-1">
                  {BODY_TYPES.map((b) => (
                    <button key={b} type="button" role="radio" aria-checked={req.bodyType === b} onClick={() => edit({ bodyType: b })}
                      className={cn('rounded-md border px-2.5 py-1 text-xs text-fg-2', req.bodyType === b ? 'border-primary bg-primary/10 text-foreground' : 'bg-muted')}>
                      {t(BODY_LABEL[b])}
                    </button>
                  ))}
                </div>
                {req.bodyType !== 'none' && (
                  <textarea
                    value={req.body}
                    onChange={(e) => edit({ body: e.target.value })}
                    aria-label={t('Corpo')}
                    spellCheck={false}
                    rows={12}
                    placeholder={req.bodyType === 'json' ? '{ "name": "{{user}}" }' : ''}
                    className="w-full rounded-md border border-input bg-background p-2 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                )}
                {req.bodyType !== 'none' && (req.method === 'GET' || req.method === 'HEAD') && <p className="text-xs text-warning">{t('GET e HEAD são enviados sem corpo.')}</p>}
              </div>
            )}
            {tab === 'options' && (
              <div className="-m-3">
                <Section title={t('Redirecionamentos')}>
                  <label className="flex items-start gap-3 text-[13px]">
                    <Checkbox checked={opts.followRedirects} onCheckedChange={(v) => setOpts({ ...opts, followRedirects: v === true })} className="mt-0.5" />
                    <span>
                      {t('Seguir redirecionamentos (até 5)')}
                      <span className="block text-xs text-muted-foreground">{t('Authorization e Cookie são removidos quando o redirecionamento vai para outra origem.')}</span>
                    </span>
                  </label>
                </Section>
                <Section title={t('Tempo limite')}>
                  <label className="flex items-center gap-2 text-[13px]">
                    <Input type="number" min={100} max={300000} step={100} value={opts.timeoutMs} onChange={(e) => setOpts({ ...opts, timeoutMs: Math.min(300_000, Math.max(100, Number(e.target.value) || 30_000)) })} className="h-8 w-28 font-mono text-xs" aria-label={t('Tempo limite')} />
                    ms
                  </label>
                </Section>
              </div>
            )}
          </div>
        </div>
      </div>
    </Frame>
  );
}
