import { Check, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import { cn } from 'cn';
import { Chip, type Tone } from '@/components/kit';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { METHODS, type KeyValue, type Method } from '../../server/shared/types';
import { useT } from '../lib/i18n';

const METHOD_TONE: Record<Method, Tone> = { GET: 'success', POST: 'warning', PUT: 'info', PATCH: 'violet', DELETE: 'danger', HEAD: 'neutral', OPTIONS: 'neutral' };

export function MethodChip({ method }: { method: Method }) {
  return <Chip tone={METHOD_TONE[method]} mono className="w-14 justify-center">{method === 'OPTIONS' ? 'OPT' : method === 'DELETE' ? 'DEL' : method}</Chip>;
}

const METHOD_TEXT: Record<Tone, string> = { success: 'text-success', warning: 'text-warning', info: 'text-info', violet: 'text-[#b083f0]', danger: 'text-destructive', neutral: 'text-fg-2' };

/** Themed method picker: a native <select> opens an OS-drawn list that ignores the dark theme. */
export function MethodSelect({ value, onChange, label }: { value: Method; onChange(m: Method): void; label: string }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={label}
        className={cn(
          'flex h-9 w-28 shrink-0 items-center justify-between gap-1 rounded-md border border-input bg-transparent px-2.5 font-mono text-[13px] font-semibold outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30',
          METHOD_TEXT[METHOD_TONE[value]],
        )}
      >
        {value}
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="start" sideOffset={4} className="z-50 min-w-28 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {METHODS.map((m) => (
            <DropdownMenu.Item
              key={m}
              onSelect={() => onChange(m)}
              className={cn('flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 font-mono text-[13px] font-semibold outline-none data-[highlighted]:bg-accent', METHOD_TEXT[METHOD_TONE[m]])}
            >
              {m}
              {m === value && <Check className="size-3.5" aria-hidden />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
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
