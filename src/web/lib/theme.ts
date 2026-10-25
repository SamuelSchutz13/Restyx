// Dark by default like GitView; the viewer's choice is a per-browser convenience.
const KEY = 'restyx.theme';

export function storedTheme(): 'dark' | 'light' {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch {
    // storage blocked
  }
  return 'dark';
}

export function applyTheme(t: 'dark' | 'light') {
  document.documentElement.classList.toggle('dark', t === 'dark');
  try {
    localStorage.setItem(KEY, t);
  } catch {
    // storage blocked
  }
}

export function toggleTheme(): 'dark' | 'light' {
  const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
