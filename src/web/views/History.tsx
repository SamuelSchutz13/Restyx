import { useState } from 'react';
import { History as HistoryIcon, Trash2 } from 'lucide-react';
import { cn } from 'cn';
import { Empty, Hint, KV, NodeCard, Section } from '@/components/kit';
import { Button } from '@/components/ui/button';
import type { HistoryEntry, RequestDef } from '../../server/shared/types';
import { api, useApi } from '../lib/api';
import { bytes, fullDate, relativeTime } from '../lib/format';
import { useT } from '../lib/i18n';
import { maskHeader, useSettings } from '../lib/settings';
import { Frame } from './Frame';
import { MethodChip, StatusChip, statusTone } from './chips';

/** Requests sent in this session. Kept only in the server's memory: closing Restyx erases it. */
export function History({ onOpen }: { onOpen(r: RequestDef): void }) {
  const t = useT();
  const { mask } = useSettings();
  const list = useApi<HistoryEntry[]>('/api/history');
  const [sel, setSel] = useState<string | null>(null);
  const entries = list.data ?? [];
  const e = entries.find((x) => x.id === sel) ?? entries[0];

  const clear = async () => {
    await api.del('/api/history');
    list.reload();
  };

  const left = {
    title: t('Enviadas · {n}', { n: entries.length }),
    width: 340,
    action: entries.length > 0 && (
      <button type="button" onClick={() => void clear()} aria-label={t('Limpar histórico')} title={t('Limpar histórico')} className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-destructive">
        <Trash2 className="size-4" />
      </button>
    ),
    content: (
      <ul className="py-1">
        {list.error && <li className="p-3 text-sm text-destructive">{list.error.message}</li>}
        {entries.map((x) => (
          <li key={x.id}>
            <button type="button" onClick={() => setSel(x.id)} className={cn('flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-accent', x.id === e?.id && 'bg-accent')}>
              <MethodChip method={x.request.method} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-xs">{x.request.url}</span>
                <span className="block text-[11px] text-muted-foreground">{relativeTime(x.at / 1000)} · {x.timeMs} ms</span>
              </span>
              <StatusChip status={x.status} />
            </button>
          </li>
        ))}
        {list.data && !entries.length && <li className="px-3 py-2 text-[13px] text-muted-foreground">{t('Nada enviado nesta sessão.')}</li>}
      </ul>
    ),
  };

  return (
    <Frame left={left}>
      <div className="mx-auto max-w-3xl space-y-4">
        <Hint>{t('O histórico fica só na memória do servidor local e some quando o Restyx é encerrado. As {{variáveis}} aparecem sem resolver.')}</Hint>
        {!e ? (
          <Empty icon={<HistoryIcon className="size-8" />} title={t('Nenhuma requisição enviada')}>{t('Envie algo na tela Requisições.')}</Empty>
        ) : (
          <NodeCard tone={statusTone(e.status)} title={<span className="flex items-center gap-2"><MethodChip method={e.request.method} /><span className="truncate font-mono text-xs">{e.request.url}</span></span>} subtitle={fullDate(e.at / 1000)}>
            <div className="-mx-3 -mb-2.5">
              <Section title={t('Resultado')}>
                <KV rows={[
                  [t('Status'), e.error ? <span className="text-destructive">{t(e.error)}</span> : <StatusChip status={e.status} />],
                  [t('Tempo'), `${e.timeMs} ms`],
                  [t('Tamanho'), bytes(e.size)],
                ]} />
              </Section>
              {e.request.headers.length > 0 && (
                <Section title={t('Cabeçalhos')} count={e.request.headers.length}>
                  <ul className="space-y-0.5 font-mono text-xs">
                    {e.request.headers.map((h, i) => <li key={i} className={cn('break-all', !h.enabled && 'line-through opacity-50')}>{h.key}: {maskHeader(h.key, h.value, mask)}</li>)}
                  </ul>
                </Section>
              )}
              <div className="px-3 py-3">
                <Button size="sm" onClick={() => onOpen(e.request)}>{t('Abrir como nova requisição')}</Button>
              </div>
            </div>
          </NodeCard>
        )}
      </div>
    </Frame>
  );
}
