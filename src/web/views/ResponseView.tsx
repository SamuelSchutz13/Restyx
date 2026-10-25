import { useMemo, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Chip, Empty, NodeCard, Section, UnderlineTabs } from '@/components/kit';
import type { ResponseData, SendResult } from '../../server/shared/types';
import { bytes } from '../lib/format';
import { highlightLine } from '../lib/highlight';
import { useT } from '../lib/i18n';
import { maskHeader, useSettings } from '../lib/settings';
import { StatusChip } from './chips';

const HIGHLIGHT_MAX = 200_000; // larger bodies stay plain text so the page stays responsive

function pretty(r: ResponseData): { text: string; lang: string | null } {
  const type = r.headers.find(([k]) => k === 'content-type')?.[1] ?? '';
  if (/json/i.test(type)) {
    try {
      return { text: JSON.stringify(JSON.parse(r.body), null, 2), lang: 'x.json' };
    } catch {
      return { text: r.body, lang: null };
    }
  }
  return { text: r.body, lang: /html|xml|svg/i.test(type) ? 'x.xml' : null };
}

export type Result = SendResult | { sending: true };

/** The response as text only: bodies are never rendered as HTML, so an API cannot run script in Restyx. */
export function ResponseView({ result }: { result?: Result }) {
  const t = useT();
  const { mask } = useSettings();
  const [tab, setTab] = useState<'body' | 'headers'>('body');
  const r = result && 'ok' in result && result.ok ? result.response : null;
  const body = useMemo(() => (r ? pretty(r) : null), [r]);

  if (!result) return <Empty icon={<Send className="size-8" />} title={t('Nenhuma resposta ainda')}>{t('Envie a requisição para ver a resposta aqui.')}</Empty>;
  if ('sending' in result) return <Empty icon={<Loader2 className="size-8 animate-spin" />} title={t('Enviando…')} />;
  if (!result.ok) {
    return (
      <div className="p-3">
        <NodeCard tone="danger" title={t('A requisição falhou')}>
          <p className="text-[13px] break-words text-destructive">{t(result.error)}</p>
        </NodeCard>
      </div>
    );
  }
  const res = result.response;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 text-[13px]">
        <StatusChip status={res.status} />
        <span className="text-fg-2">{res.statusText}</span>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">{res.timeMs} ms · {bytes(res.size)}</span>
      </div>
      {res.redirects.length > 0 && (
        <Section title={t('Redirecionamentos')} count={res.redirects.length}>
          <ol className="space-y-0.5 font-mono text-[11px] break-all text-fg-2">{res.redirects.map((u, i) => <li key={i}>→ {u}</li>)}</ol>
        </Section>
      )}
      <UnderlineTabs<'body' | 'headers'> tabs={[{ id: 'body', label: t('Corpo') }, { id: 'headers', label: `${t('Cabeçalhos')} · ${res.headers.length}` }]} value={tab} onChange={setTab} />
      {tab === 'headers' ? (
        <div className="p-3">
          {/* not KV: header names repeat (set-cookie) */}
          <dl className="grid grid-cols-[minmax(84px,auto)_1fr] gap-x-4 gap-y-1">
            {res.headers.map(([k, v], i) => (
              <div key={i} className="contents">
                <dt className="font-mono text-xs text-muted-foreground">{k}</dt>
                <dd className="min-w-0 font-mono text-xs break-all">{maskHeader(k, v, mask)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div className="space-y-2 p-3">
          {res.truncated && <Chip tone="warning">{t('Corpo cortado em 10 MB')}</Chip>}
          {res.binary ? (
            <p className="text-[13px] text-muted-foreground">{t('Conteúdo binário ({s}) não é exibido.', { s: bytes(res.size) })}</p>
          ) : body && body.text ? (
            <pre className="overflow-auto rounded-md border bg-background p-2 font-mono text-xs whitespace-pre-wrap break-all">
              {body.lang && body.text.length <= HIGHLIGHT_MAX ? highlightLine(body.text, body.lang) : body.text}
            </pre>
          ) : (
            <p className="text-[13px] text-muted-foreground">{t('Resposta sem corpo.')}</p>
          )}
        </div>
      )}
    </div>
  );
}
