<p align="center">
  <img src=".github/assets/logo.svg" alt="" width="72" />
</p>

<h1 align="center">Restyx</h1>

<p align="center">
  <a href="README.md">English</a> · <b>Português (Brasil)</b>
</p>

<p align="center">
  Um cliente de REST API no navegador: coleções, ambientes com segredos, histórico e exportação. Roda na sua máquina, sem conta, sem telemetria e sem IA.
</p>

> [!NOTE]
> **Nada sai da sua máquina além das requisições que você envia.** O servidor escuta só em `127.0.0.1`, a página exige um token aleatório e não há telemetria, conta, CDN nem fonte remota.

## Recursos

- **Requisições**: método, URL, parâmetros, cabeçalhos e corpo JSON ou texto, salvos numa coleção. A resposta mostra status, tempo, tamanho, cabeçalhos e o corpo com destaque de sintaxe.
- **Ambientes**: `{{variáveis}}` preenchidas pelo servidor local. Variáveis **secretas** ficam fora do projeto e nunca voltam para o navegador.
- **Histórico**: o que você enviou nesta sessão, só em memória, apagado quando o Restyx é encerrado.
- **Exportar**: a coleção em JSON ou em comandos cURL, sem os segredos, a menos que você os inclua.
- **Configurações**: português e inglês, temas escuro e claro, e ocultação de cabeçalhos de credenciais na tela.

## Privacidade e segurança

| O quê | Como |
| --- | --- |
| Quem abre a interface | Só `127.0.0.1`/`localhost`, com token aleatório trocado por um cookie `HttpOnly` e `SameSite=Strict` |
| DNS rebinding e CSRF | `Host` estranho → 421; `Origin` estranho, `Sec-Fetch-Site` de outro site ou escrita sem `Origin` → 403. O corpo só é lido depois dessas checagens |
| A página | CSP rígida (`connect-src 'self'`, sem script inline, sem frames, sem objects), `nosniff`, `no-referrer`, `no-store` na API |
| Respostas | Exibidas só como texto, nunca renderizadas como HTML: uma API não consegue rodar script dentro do Restyx |
| Segredos | Guardados em `~/.restyx/secrets/<hash>.json` (modo `0600`), nunca no `.restyx.json`, nunca enviados ao navegador, ao histórico nem à exportação (a menos que você marque a opção) |
| Redirecionamentos | Não são seguidos por padrão; quando seguidos (até 5), `Authorization`, `Proxy-Authorization` e `Cookie` são removidos ao mudar de origem |
| Requisições | Só `http://` e `https://`; credenciais na URL são recusadas; TLS sempre verificado; tempo limite máximo de 5 minutos; corpo da resposta limitado a 10 MB; sem pote de cookies |
| Entrada | Tudo o que vem do navegador e do `.restyx.json` é validado antes do uso |

## Como usar

Basta ter o [Node.js](https://nodejs.org) **20.19 ou mais novo**.

```sh
git clone https://github.com/SamuelSchutz13/Restyx.git
cd Restyx
npm install
npm run build
npm link          # deixa o comando `restyx` disponível em qualquer pasta
```

Depois, em qualquer pasta:

```sh
restyx                          # sobe o servidor e abre o navegador
restyx --port 8080 --open=false
restyx ../outro-projeto
```

O terminal mostra uma URL como `http://127.0.0.1:54321/?t=…`. Aperte **Ctrl+C** para encerrar.

A coleção fica em `.restyx.json` nessa pasta. Ele não guarda valores secretos, então pode ser versionado e compartilhado.

## Desenvolvimento

```sh
npm run dev:server   # API em 127.0.0.1:4317; abra a URL impressa uma vez
npm run dev:web      # Vite com proxy de /api
npm test             # Jest: servidor e web
```
