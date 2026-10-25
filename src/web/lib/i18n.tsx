import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { setLocale } from './format';

export type Lang = 'pt' | 'en';
type Vars = Record<string, string | number>;
const KEY = 'restyx.lang';

// Keys are the Portuguese text itself, so pt needs no table and a missing entry falls back to Portuguese.
export const EN: Record<string, string> = {
  'Requisições': 'Requests',
  'Histórico': 'History',
  'Ambientes': 'Environments',
  'Exportar': 'Export',
  'Telas': 'Views',
  'Idioma': 'Language',
  'Recolher {x}': 'Collapse {x}',
  'Mostrar {x}': 'Show {x}',
  'Servido só nesta máquina (127.0.0.1)': 'Served only on this machine (127.0.0.1)',
  'local': 'local',
  'local · sem telemetria · sem IA': 'local · no telemetry · no AI',
  'Configurações': 'Settings',
  'Tema': 'Theme',
  'Escuro': 'Dark',
  'Claro': 'Light',
  'Privacidade': 'Privacy',
  'Ocultar credenciais': 'Hide credentials',
  'Esconde na tela os valores de Authorization, Cookie, Set-Cookie e chaves de API. O valor real continua sendo enviado.': 'Hides the values of Authorization, Cookie, Set-Cookie and API keys on screen. The real value is still sent.',
  'sem ambiente': 'no environment',
  '{n} requisições': '{n} requests',
  'salvando…': 'saving…',
  'salvo em .restyx.json': 'saved to .restyx.json',
  'erro ao salvar': 'could not save',
  'Não foi possível abrir o workspace: {e}': 'Could not open the workspace: {e}',
  'Carregando…': 'Loading…',
  'Coleção · {n}': 'Collection · {n}',
  'Nova requisição': 'New request',
  'Apagar "{x}"?': 'Delete "{x}"?',
  'Apagar {x}': 'Delete {x}',
  'Apagar': 'Delete',
  'sem nome': 'untitled',
  'Nenhuma requisição salva.': 'No saved requests.',
  'Resposta': 'Response',
  'Escolha uma requisição à esquerda': 'Pick a request on the left',
  'Ou crie uma nova. Tudo fica em .restyx.json nesta pasta; valores secretos ficam fora dele.': 'Or create a new one. Everything lives in .restyx.json in this folder; secret values stay out of it.',
  'Nome': 'Name',
  'Método': 'Method',
  'Enviar': 'Send',
  'Use {{nome}} para variáveis do ambiente ativo. Elas são preenchidas no servidor local, e os segredos nunca chegam ao navegador.': 'Use {{name}} for variables of the active environment. The local server fills them in, and secrets never reach the browser.',
  'Parâmetros': 'Params',
  'Cabeçalhos': 'Headers',
  'Corpo': 'Body',
  'Opções': 'Options',
  'parâmetro': 'param',
  'cabeçalho': 'header',
  'valor': 'value',
  'nome': 'name',
  'Ativo': 'Enabled',
  'Remover': 'Remove',
  'Adicionar': 'Add',
  'Tipo do corpo': 'Body type',
  'Nenhum': 'None',
  'Texto': 'Text',
  'GET e HEAD são enviados sem corpo.': 'GET and HEAD are sent without a body.',
  'Redirecionamentos': 'Redirects',
  'Seguir redirecionamentos (até 5)': 'Follow redirects (up to 5)',
  'Authorization e Cookie são removidos quando o redirecionamento vai para outra origem.': 'Authorization and Cookie are removed when a redirect goes to another origin.',
  'Tempo limite': 'Timeout',
  'Nenhuma resposta ainda': 'No response yet',
  'Envie a requisição para ver a resposta aqui.': 'Send the request to see the response here.',
  'Enviando…': 'Sending…',
  'A requisição falhou': 'The request failed',
  'Corpo cortado em 10 MB': 'Body cut at 10 MB',
  'Conteúdo binário ({s}) não é exibido.': 'Binary content ({s}) is not shown.',
  'Resposta sem corpo.': 'Response without a body.',
  'erro': 'error',
  'Enviadas · {n}': 'Sent · {n}',
  'Limpar histórico': 'Clear history',
  'Nada enviado nesta sessão.': 'Nothing sent in this session.',
  'O histórico fica só na memória do servidor local e some quando o Restyx é encerrado. As {{variáveis}} aparecem sem resolver.': 'History lives only in the memory of the local server and is gone when Restyx stops. {{Variables}} are shown unresolved.',
  'Nenhuma requisição enviada': 'No requests sent',
  'Envie algo na tela Requisições.': 'Send something from the Requests view.',
  'Resultado': 'Result',
  'Status': 'Status',
  'Tempo': 'Time',
  'Tamanho': 'Size',
  'Abrir como nova requisição': 'Open as a new request',
  'Ambientes · {n}': 'Environments · {n}',
  'Novo ambiente': 'New environment',
  'Apagar o ambiente "{x}" e os segredos dele?': 'Delete the environment "{x}" and its secrets?',
  'ativo': 'active',
  'Nenhum ambiente.': 'No environments.',
  'Nenhum ambiente': 'No environment',
  'Variáveis secretas ficam em ~/.restyx, fora da pasta do projeto, e nunca voltam para o navegador.': 'Secret variables are kept in ~/.restyx, outside the project folder, and never go back to the browser.',
  'Crie um ambiente para usar {{variáveis}} nas requisições.': 'Create an environment to use {{variables}} in requests.',
  'Desativar': 'Deactivate',
  'Usar este ambiente': 'Use this environment',
  'Apagar ambiente': 'Delete environment',
  'Variáveis': 'Variables',
  'guardado: digite para trocar': 'stored: type to replace',
  'Secreta: fica fora do .restyx.json e não volta para o navegador': 'Secret: kept out of .restyx.json and never sent back to the browser',
  'Secreta': 'Secret',
  'a coleção e os ambientes, no formato do .restyx.json': 'the collection and environments, in the .restyx.json format',
  'um comando por requisição, com o ambiente ativo aplicado': 'one command per request, with the active environment applied',
  'O arquivo é baixado pelo navegador; nada é enviado para fora desta máquina.': 'The file is downloaded by the browser; nothing leaves this machine.',
  'Formato': 'Format',
  'Segredos': 'Secrets',
  'Incluir valores de variáveis secretas': 'Include secret variable values',
  'Por padrão, segredos ficam de fora: no JSON aparecem vazios e no cURL como {{nome}}.': 'By default secrets are left out: empty in JSON and {{name}} in cURL.',
  'Baixar': 'Download',
  'URL inválida.': 'Invalid URL.',
  'Só http:// e https:// são permitidos.': 'Only http:// and https:// are allowed.',
  'Coloque credenciais num cabeçalho Authorization, não na URL.': 'Put credentials in an Authorization header, not in the URL.',
  'Redirecionamento para um protocolo não permitido.': 'Redirect to a protocol that is not allowed.',
  'O Restyx não envia requisições para si mesmo.': 'Restyx does not send requests to itself.',
};

export function translate(lang: Lang, key: string, vars?: Vars): string {
  const text = lang === 'en' ? EN[key] ?? key : key;
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text;
}

export function initialLang(browser = typeof navigator !== 'undefined' ? navigator.language : 'pt-BR'): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'pt' || v === 'en') return v;
  } catch {
    // storage blocked
  }
  return browser.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

type Ctx = { lang: Lang; setLang(l: Lang): void; t(key: string, vars?: Vars): string };
const LangCtx = createContext<Ctx>({ lang: 'pt', setLang: () => {}, t: (k, v) => translate('pt', k, v) });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  setLocale(lang === 'pt' ? 'pt-BR' : 'en-US');
  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  }, [lang]);
  const setLang = useCallback((l: Lang) => {
    try {
      localStorage.setItem(KEY, l);
    } catch {
      // storage blocked
    }
    setLangState(l);
  }, []);
  const t = useCallback((key: string, vars?: Vars) => translate(lang, key, vars), [lang]);
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
export const useT = () => useContext(LangCtx).t;
