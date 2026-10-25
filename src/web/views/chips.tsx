import { Plus, Trash2 } from 'lucide-react';
import { Chip, type Tone } from '@/components/kit';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { KeyValue, Method } from '../../server/shared/types';
import { useT } from '../lib/i18n';

const METHOD_TONE: Record<Method, Tone> = { GET: 'success', POST: 'warning', PUT: 'info', PATCH: 'violet', DELETE: 'danger', HEAD: 'neutral', OPTIONS: 'neutral' };

export function MethodChip({ method }: { method: Method }) {
  return <Chip tone={METHOD_TONE[method]} mono className="w-14 justify-center">{method === 'OPTIONS' ? 'OPT' : method === 'DELETE' ? 'DEL' : method}</Chip>;
}

export const statusTone = (s: number | null): Tone => (s === null ? 'danger' : s < 300 ? 'success' : s < 400 ? 'info' : s < 500 ? 'warning' : 'danger');

export function StatusChip({ status }: { status: number | null }) {
  const t = useT();
  return <Chip tone={statusTone(status)} mono upper>{status ?? t('erro')}</Chip>;
}

/** Editable key/value rows for params and headers; disabled rows are kept but not sent. */
export function KVEditor({ rows, onChange, keyLabel, secret }: { rows: KeyValue[]; onChange(r: KeyValue[]): void; keyLabel: string; secret?(key: string): boolean }) {
  const t = useT();
  const set = (i: number, patch: Partial<KeyValue>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => {
        const masked = secret?.(r.key) ?? false;
        return (
          <div key={i} className="flex items-center gap-2">
            <Checkbox checked={r.enabled} onCheckedChange={(v) => set(i, { enabled: v === true })} aria-label={t('Ativo')} />
            <Input value={r.key} onChange={(e) => set(i, { key: e.target.value })} placeholder={keyLabel} aria-label={keyLabel} className="h-8 flex-1 font-mono text-xs" />
            <Input
              value={r.value}
              type={masked ? 'password' : 'text'}
              autoComplete="off"
              onChange={(e) => set(i, { value: e.target.value })}
              placeholder={t('valor')}
              aria-label={t('valor')}
              className="h-8 flex-[2] font-mono text-xs"
            />
            <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label={t('Remover')} title={t('Remover')} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        );
      })}
      <button type="button" onClick={() => onChange([...rows, { key: '', value: '', enabled: true }])} className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs text-primary hover:bg-accent">
        <Plus className="size-3.5" /> {t('Adicionar')}
      </button>
    </div>
  );
}
