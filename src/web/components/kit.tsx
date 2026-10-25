// House components for the GitView-like look: chips, sections, key/value tables, node cards.
import type { ReactNode } from 'react';
import { cn } from 'cn';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'violet';

const CHIP: Record<Tone, string> = {
  neutral: 'border-border bg-muted text-fg-2',
  info: 'border-info/40 bg-info/15 text-info',
  success: 'border-success/40 bg-success/15 text-success',
  warning: 'border-warning/40 bg-warning/15 text-warning',
  danger: 'border-destructive/40 bg-destructive/15 text-destructive',
  violet: 'border-[#b083f0]/40 bg-[#b083f0]/15 text-[#b083f0]',
};

/** Small uppercase badge, like GitView's HIGH / MEDIUM chips. */
export function Chip({ tone = 'neutral', mono, upper, className, children, title }: { tone?: Tone; mono?: boolean; upper?: boolean; className?: string; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex h-5 shrink-0 items-center rounded border px-1.5 text-[11px] leading-none whitespace-nowrap',
        upper && 'font-semibold tracking-wide uppercase',
        mono && 'font-mono',
        CHIP[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Gray uppercase heading for a block inside a pane ("WHY IT CAN BE A PROBLEM"). */
export function Section({ title, count, children, className, action }: { title: string; count?: number; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn('border-b px-3 py-3 last:border-b-0', className)}>
      <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
        {count !== undefined && <span className="font-normal">{count}</span>}
        {action && <span className="ml-auto font-normal tracking-normal normal-case">{action}</span>}
      </h3>
      {children}
    </section>
  );
}

/** Key/value rows, like the Severity / Confidence table in GitView's inspector. */
export function KV({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(84px,auto)_1fr] gap-x-4 gap-y-1 text-[13px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="min-w-0 truncate">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const STRIPE: Record<Tone, string> = {
  neutral: 'border-l-node-border',
  info: 'border-l-info',
  success: 'border-l-success',
  warning: 'border-l-warning',
  danger: 'border-l-destructive',
  violet: 'border-l-[#b083f0]',
};

/** A block styled like the nodes on GitView's canvas: dark fill, colored left stripe. */
export function NodeCard({ tone = 'info', title, subtitle, children, className }: { tone?: Tone; title: ReactNode; subtitle?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-md border border-l-[3px] border-node-border bg-node px-3 py-2.5', STRIPE[tone], className)}>
      <div className="text-[13px] font-medium">{title}</div>
      {subtitle && <div className="truncate font-mono text-[11px] text-muted-foreground">{subtitle}</div>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

/** Rounded hint pill at the top of the canvas ("Click a step for its code"). */
export function Hint({ children }: { children: ReactNode }) {
  return <div className="inline-flex rounded-full border bg-surface px-3 py-1 text-xs text-fg-2">{children}</div>;
}

/** Underlined tabs, like Overview / Evidence / Source in GitView's inspector. */
export function UnderlineTabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: ReactNode }[]; value: T; onChange(v: T): void }) {
  return (
    <div role="tablist" className="flex gap-1 border-b px-3">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn('-mb-px border-b-2 border-transparent px-2 py-2 text-[13px] text-muted-foreground hover:text-foreground', value === t.id && 'border-primary text-foreground')}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Group header inside a list ("Authentication  4"). */
export function GroupHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-3 pt-3 pb-1 text-xs font-semibold text-muted-foreground">
      <span>{title}</span>
      <span className="font-normal">{count}</span>
    </div>
  );
}

export function Empty({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {children && <p className="max-w-sm text-xs text-muted-foreground">{children}</p>}
    </div>
  );
}
