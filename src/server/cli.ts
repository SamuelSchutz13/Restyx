export interface CliArgs {
  dir: string;
  port: number;
  open: boolean;
}

function parsePort(v: string | undefined): number {
  const n = Number(v);
  if (!v || !Number.isInteger(n) || n < 0 || n > 65535) throw new Error(`Porta inválida: ${v}`);
  return n;
}

export function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = { dir: process.cwd(), port: 0, open: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--port') out.port = parsePort(argv[++i]);
    else if (a.startsWith('--port=')) out.port = parsePort(a.slice(7));
    else if (a === '--open' || a === '--open=true') out.open = true;
    else if (a === '--open=false') out.open = false;
    else if (a.startsWith('-')) throw new Error(`Opção desconhecida: ${a}`);
    else out.dir = a;
  }
  return out;
}
