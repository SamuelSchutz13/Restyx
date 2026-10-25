import { useState, type ReactNode } from 'react';
import { Braces, ChevronLeft, ChevronRight, Download, History, Moon, Send, Settings, Sun } from 'lucide-react';
import { cn } from 'cn';
import { useSettings } from '../lib/settings';
import { Logo } from '@/components/logo';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLang } from '../lib/i18n';
import { FlagBR, FlagUS } from '@/components/flags';

export type View = 'request' | 'history' | 'environments' | 'export';

const TABS: { view: View; label: string; icon: typeof History }[] = [
  { view: 'request', label: 'Requisições', icon: Send },
  { view: 'history', label: 'Histórico', icon: History },
  { view: 'environments', label: 'Ambientes', icon: Braces },
  { view: 'export', label: 'Exportar', icon: Download },
];

export interface PaneDef {
  title: string;
  content: ReactNode;
  width?: number;
  action?: ReactNode;
}

/** Small uppercase heading used by every pane. */
export function PaneTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-b px-3">
      <h2 className="min-w-0 flex-1 truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{children}</h2>
      {action}
    </div>
  );
}

function SidePane({ pane, side }: { pane: PaneDef; side: 'left' | 'right' }) {
  const { t } = useLang();
  const [open, setOpen] = useState(true);
  const Icon = (side === 'left') === open ? ChevronLeft : ChevronRight;
  const toggle = (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-label={t(open ? 'Recolher {x}' : 'Mostrar {x}', { x: pane.title })}
      title={t(open ? 'Recolher {x}' : 'Mostrar {x}', { x: pane.title })}
      className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      <Icon className="size-4" />
    </button>
  );
  if (!open) {
    return <div className={cn('hidden w-9 shrink-0 flex-col items-center bg-surface pt-2 lg:flex', side === 'left' ? 'border-r' : 'border-l')}>{toggle}</div>;
  }
  return (
    <section
      className={cn(
        'flex max-h-[60vh] min-h-0 w-full shrink-0 flex-col bg-surface max-lg:border-b lg:max-h-none lg:w-[var(--pane-w)] lg:max-w-[45vw]',
        side === 'left' ? 'lg:border-r' : 'lg:border-l',
      )}
      style={{ '--pane-w': `${pane.width ?? 320}px` } as React.CSSProperties}
    >
      <PaneTitle action={<>{pane.action}{toggle}</>}>{pane.title}</PaneTitle>
      <div className="min-h-0 flex-1 overflow-auto">{pane.content}</div>
    </section>
  );
}

function OptionButton({ active, onClick, children, label }: { active: boolean; onClick(): void; children: ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-[13px] text-fg-2 transition-colors hover:text-foreground',
        active ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-muted',
      )}
    >
      {children}
    </button>
  );
}

/** Gear popover with the per-viewer preferences: language, theme and masking of sensitive headers. */
function SettingsMenu() {
  const { t, lang, setLang } = useLang();
  const { theme, setTheme, mask, setMask } = useSettings();
  const heading = 'mb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase';
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={t('Configurações')} title={t('Configurações')} className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
          <Settings className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4 bg-surface p-3">
        <div>
          <div className={heading}>{t('Idioma')}</div>
          <div className="flex gap-1.5">
            <OptionButton active={lang === 'pt'} onClick={() => setLang('pt')} label="Português (Brasil)">
              <FlagBR className="h-3.5 w-5 rounded-sm" /> Português
            </OptionButton>
            <OptionButton active={lang === 'en'} onClick={() => setLang('en')} label="English">
              <FlagUS className="h-3.5 w-5 rounded-sm" /> English
            </OptionButton>
          </div>
        </div>
        <div>
          <div className={heading}>{t('Tema')}</div>
          <div className="flex gap-1.5">
            <OptionButton active={theme === 'dark'} onClick={() => setTheme('dark')} label={t('Escuro')}>
              <Moon className="size-4" /> {t('Escuro')}
            </OptionButton>
            <OptionButton active={theme === 'light'} onClick={() => setTheme('light')} label={t('Claro')}>
              <Sun className="size-4" /> {t('Claro')}
            </OptionButton>
          </div>
        </div>
        <div>
          <div className={heading}>{t('Privacidade')}</div>
          <button
            type="button"
            role="switch"
            aria-checked={mask}
            aria-label={t('Ocultar credenciais')}
            onClick={() => setMask(!mask)}
            className="flex w-full items-start gap-3 rounded-md border bg-muted p-2.5 text-left"
          >
            <span className={cn('relative mt-0.5 h-4 w-7 shrink-0 rounded-full transition-colors', mask ? 'bg-primary' : 'bg-background ring-1 ring-border')}>
              <span className={cn('absolute top-0.5 size-3 rounded-full bg-white transition-all', mask ? 'left-3.5' : 'left-0.5')} />
            </span>
            <span>
              <span className="block text-[13px] font-medium">{t('Ocultar credenciais')}</span>
              <span className="block text-xs text-muted-foreground">{t('Esconde na tela os valores de Authorization, Cookie, Set-Cookie e chaves de API. O valor real continua sendo enviado.')}</span>
            </span>
          </button>
        </div>
        <p className="border-t pt-2 text-[11px] text-muted-foreground">{t('local · sem telemetria · sem IA')}</p>
      </PopoverContent>
    </Popover>
  );
}

export function Shell(props: {
  view: View;
  onNavigate(v: View): void;
  dir?: string;
  env?: string | null;
  left?: PaneDef;
  right?: PaneDef;
  status?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useLang();

  return (
    <div className="flex min-h-screen flex-col lg:h-screen">
      <header className="flex h-11 shrink-0 items-center gap-3 overflow-x-auto border-b bg-surface px-3">
        <button
          type="button"
          onClick={() => props.onNavigate('request')}
          aria-label={`Restyx: ${t('Requisições')}`}
          title={t('Requisições')}
          className="flex shrink-0 items-center gap-2 rounded-md px-1 py-0.5 text-primary hover:bg-accent"
        >
          <Logo className="size-6" />
          <span className="font-semibold text-foreground">Restyx</span>
        </button>
        {props.dir && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="max-w-56 truncate font-medium text-fg-2">{props.dir}</span>
          </>
        )}
        <span className="hidden max-w-48 shrink-0 truncate rounded-md border bg-muted px-1.5 py-0.5 font-mono text-xs text-fg-2 md:inline">{props.env ?? t('sem ambiente')}</span>
        <nav role="tablist" aria-label={t('Telas')} className="ml-auto flex shrink-0 gap-0.5 rounded-md border bg-muted p-0.5">
          {TABS.map(({ view, label, icon: Icon }) => {
            const active = props.view === view;
            return (
              <button
                key={view}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={t(label)}
                title={t(label)}
                onClick={() => props.onNavigate(view)}
                className={cn(
                  'flex items-center gap-1.5 rounded px-2.5 py-1 text-[13px] text-fg-2 transition-colors hover:text-foreground',
                  active && 'bg-surface text-foreground shadow-sm ring-1 ring-border',
                )}
              >
                <Icon className="size-3.5 opacity-80" aria-hidden />
                <span className={active ? 'hidden sm:inline' : 'hidden xl:inline'} aria-hidden>{t(label)}</span>
              </button>
            );
          })}
        </nav>
        <SettingsMenu />
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {props.left && <SidePane pane={props.left} side="left" />}
        <main className="canvas-grid min-h-0 min-w-0 flex-1 overflow-auto p-4">{props.children}</main>
        {props.right && <SidePane pane={props.right} side="right" />}
      </div>

      <footer className="flex h-6 shrink-0 items-center gap-4 border-t bg-surface px-3 text-[11px] text-muted-foreground">
        <div className="flex min-w-0 flex-1 items-center gap-4 truncate">{props.status}</div>
        <span title={t('Servido só nesta máquina (127.0.0.1)')}>
          <span className="mr-1.5 inline-block size-1.5 rounded-full bg-success align-middle" />
          {t('local')} · {typeof location !== 'undefined' ? location.host : ''}
        </span>
        <span>{t('local · sem telemetria · sem IA')}</span>
      </footer>
    </div>
  );
}
