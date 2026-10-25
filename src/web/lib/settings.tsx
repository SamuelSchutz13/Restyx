import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { applyTheme, storedTheme } from './theme';

const MASK_KEY = 'restyx.maskSensitive';

function readMask(): boolean {
  try {
    return localStorage.getItem(MASK_KEY) !== '0';
  } catch {
    return true;
  }
}

type Theme = 'dark' | 'light';
type Settings = { mask: boolean; setMask(v: boolean): void; theme: Theme; setTheme(t: Theme): void };

const Ctx = createContext<Settings>({ mask: true, setMask: () => {}, theme: 'dark', setTheme: applyTheme });

/** Per-viewer preferences: masking of sensitive headers (on by default) and the theme. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [mask, setMaskState] = useState(readMask);
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : storedTheme(),
  );
  const setMask = useCallback((v: boolean) => {
    try {
      localStorage.setItem(MASK_KEY, v ? '1' : '0');
    } catch {
      // storage blocked: the choice lasts for this page only
    }
    setMaskState(v);
  }, []);
  const setTheme = useCallback((t: Theme) => {
    applyTheme(t);
    setThemeState(t);
  }, []);
  return <Ctx.Provider value={{ mask, setMask, theme, setTheme }}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);

const SENSITIVE = /^(authorization|proxy-authorization|cookie|set-cookie|x-api-key|api-key|x-auth-token|x-csrf-token)$/i;

export const isSensitive = (key: string) => SENSITIVE.test(key.trim());

/** Hides the value of credential headers on screen; the real value is still sent. */
export function maskHeader(key: string, value: string, mask: boolean): string {
  if (!mask || !isSensitive(key) || !value) return value;
  const scheme = /^(Bearer|Basic|Digest|Token)\s+/i.exec(value)?.[0] ?? '';
  return `${scheme}••••••••`;
}
