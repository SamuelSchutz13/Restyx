import { useState } from 'react';
import { Braces, Check, Lock, Plus, Trash2 } from 'lucide-react';
import { cn } from 'cn';
import { Chip, Empty, Hint, Section } from '@/components/kit';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { Environment, Variable, Workspace } from '../../server/shared/types';
import { useT } from '../lib/i18n';
import { newEnvironment } from '../lib/workspace';
import { Frame } from './Frame';

export function Environments({ ws, update }: { ws: Workspace; update(fn: (w: Workspace) => Workspace): void }) {
  const t = useT();
  const [sel, setSel] = useState<string | null>(ws.activeEnv);
  const env = ws.environments.find((e) => e.id === sel) ?? ws.environments[0];

  const add = () => {
    const e = newEnvironment(t('Novo ambiente'));
    update((w) => ({ ...w, environments: [...w.environments, e], activeEnv: w.activeEnv ?? e.id }));
    setSel(e.id);
  };
  const edit = (patch: Partial<Environment>) => env && update((w) => ({ ...w, environments: w.environments.map((e) => (e.id === env.id ? { ...e, ...patch } : e)) }));
  const setVar = (i: number, patch: Partial<Variable>) => env && edit({ vars: env.vars.map((v, j) => (j === i ? { ...v, ...patch } : v)) });
  const remove = () => {
    if (!env || !window.confirm(t('Apagar o ambiente "{x}" e os segredos dele?', { x: env.name }))) return;
    update((w) => ({ ...w, environments: w.environments.filter((e) => e.id !== env.id), activeEnv: w.activeEnv === env.id ? null : w.activeEnv }));
    setSel(null);
  };

  const left = {
    title: t('Ambientes · {n}', { n: ws.environments.length }),
    width: 280,
    action: (
      <button type="button" onClick={add} aria-label={t('Novo ambiente')} title={t('Novo ambiente')} className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground">
        <Plus className="size-4" />
      </button>
    ),
    content: (
      <ul className="py-1">
        {ws.environments.map((e) => (
          <li key={e.id}>
            <button type="button" onClick={() => setSel(e.id)} className={cn('flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-accent', e.id === env?.id && 'bg-accent')}>
              <span className="min-w-0 flex-1 truncate text-[13px]">{e.name || t('sem nome')}</span>
              <span className="text-[11px] text-muted-foreground">{e.vars.length}</span>
              {ws.activeEnv === e.id && <Chip tone="success" upper>{t('ativo')}</Chip>}
            </button>
          </li>
        ))}
        {!ws.environments.length && <li className="px-3 py-2 text-[13px] text-muted-foreground">{t('Nenhum ambiente.')}</li>}
      </ul>
    ),
  };

  return (
    <Frame left={left}>
      <div className="mx-auto max-w-3xl space-y-4">
        <Hint>{t('Variáveis secretas ficam em ~/.restyx, fora da pasta do projeto, e nunca voltam para o navegador.')}</Hint>
        {!env ? (
          <Empty icon={<Braces className="size-8" />} title={t('Nenhum ambiente')}>{t('Crie um ambiente para usar {{variáveis}} nas requisições.')}</Empty>
        ) : (
          <div className="rounded-md border bg-surface">
            <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
              <Input value={env.name} onChange={(e) => edit({ name: e.target.value })} aria-label={t('Nome')} className="h-8 max-w-xs" />
              <span className="ml-auto" />
              {ws.activeEnv === env.id ? (
                <Button size="sm" variant="outline" onClick={() => update((w) => ({ ...w, activeEnv: null }))}>{t('Desativar')}</Button>
              ) : (
                <Button size="sm" onClick={() => update((w) => ({ ...w, activeEnv: env.id }))}><Check className="size-4" /> {t('Usar este ambiente')}</Button>
              )}
              <Button size="sm" variant="ghost" onClick={remove} aria-label={t('Apagar ambiente')}><Trash2 className="size-4" /></Button>
            </div>
            <Section title={t('Variáveis')} count={env.vars.length}>
              <div className="space-y-1.5">
                {env.vars.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={v.key} onChange={(e) => setVar(i, { key: e.target.value })} placeholder={t('nome')} aria-label={t('nome')} className="h-8 flex-1 font-mono text-xs" />
                    <Input
                      value={v.value}
                      type={v.secret ? 'password' : 'text'}
                      autoComplete="off"
                      onChange={(e) => setVar(i, { value: e.target.value })}
                      placeholder={v.secret && v.stored ? t('guardado: digite para trocar') : t('valor')}
                      aria-label={t('valor')}
                      className="h-8 flex-[2] font-mono text-xs"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-fg-2" title={t('Secreta: fica fora do .restyx.json e não volta para o navegador')}>
                      <Checkbox checked={v.secret} onCheckedChange={(c) => setVar(i, { secret: c === true })} />
                      <Lock className="size-3.5" aria-hidden /> <span className="sr-only">{t('Secreta')}</span>
                    </label>
                    <button type="button" onClick={() => edit({ vars: env.vars.filter((_, j) => j !== i) })} aria-label={t('Remover')} title={t('Remover')} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => edit({ vars: [...env.vars, { key: '', value: '', secret: false }] })} className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs text-primary hover:bg-accent">
                  <Plus className="size-3.5" /> {t('Adicionar')}
                </button>
              </div>
            </Section>
          </div>
        )}
      </div>
    </Frame>
  );
}
