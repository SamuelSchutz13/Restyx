import { useCallback, useEffect, useRef, useState } from 'react';
import type { Environment, RequestDef, Workspace } from '../../server/shared/types';
import { api } from './api';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

// Ids only need to be unique inside one workspace file.
export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const newRequest = (name: string): RequestDef => ({
  id: newId(), name, method: 'GET', url: '', params: [], headers: [], bodyType: 'none', body: '',
});

export const newEnvironment = (name: string): Environment => ({ id: newId(), name, vars: [] });

/** Loads the workspace once and saves every edit to .restyx.json, debounced. */
export function useWorkspace() {
  const [ws, setWs] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>('idle');
  const dirty = useRef(false);

  useEffect(() => {
    api.get<Workspace>('/api/workspace').then(setWs).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!ws || !dirty.current) return;
    const send = () => {
      dirty.current = false;
      setSave('saving');
      api.put('/api/workspace', ws).then(() => setSave('saved'), (e) => {
        setSave('error');
        setError(e.message);
      });
    };
    const timer = setTimeout(send, 400);
    // Closing the tab inside the debounce window must not lose the last edit.
    const flush = () => dirty.current && void fetch('/api/workspace', { method: 'PUT', keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ws) });
    window.addEventListener('pagehide', flush);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pagehide', flush);
    };
  }, [ws]);

  const update = useCallback((fn: (w: Workspace) => Workspace) => {
    dirty.current = true;
    setWs((w) => (w ? fn(w) : w));
  }, []);

  return { ws, error, save, update };
}
