import type { ReactNode } from 'react';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

const EXT: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', mts: 'typescript', cts: 'typescript',
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  json: 'json', css: 'css', scss: 'scss', less: 'less', html: 'xml', htm: 'xml', xml: 'xml', svg: 'xml', vue: 'xml',
  md: 'markdown', py: 'python', go: 'go', rs: 'rust', java: 'java', kt: 'kotlin', swift: 'swift', rb: 'ruby',
  php: 'php', sh: 'bash', bash: 'bash', zsh: 'bash', yml: 'yaml', yaml: 'yaml', sql: 'sql', c: 'c', h: 'c',
  cpp: 'cpp', cc: 'cpp', hpp: 'cpp', cs: 'csharp', lua: 'lua', r: 'r', ini: 'ini', toml: 'ini', diff: 'diff',
};

export function languageOf(path: string): string | null {
  const name = path.split('/').pop() ?? '';
  if (name === 'Dockerfile') return null;
  const lang = EXT[name.split('.').pop()?.toLowerCase() ?? ''];
  return lang && lowlight.registered(lang) ? lang : null;
}

type HastNode = { type: string; value?: string; tagName?: string; properties?: { className?: string[] }; children?: HastNode[] };

// Only text and span elements are produced, so repository content can never become markup.
function toReact(nodes: HastNode[], key = ''): ReactNode[] {
  return nodes.map((n, i) => {
    if (n.type === 'text') return n.value;
    if (n.type === 'element') {
      return <span key={key + i} className={(n.properties?.className ?? []).join(' ')}>{toReact(n.children ?? [], `${key}${i}.`)}</span>;
    }
    return null;
  });
}

export function highlightLine(text: string, path: string): ReactNode {
  const lang = languageOf(path);
  if (!lang) return text;
  return toReact(lowlight.highlight(lang, text).children as HastNode[]);
}
