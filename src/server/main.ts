#!/usr/bin/env node
import 'reflect-metadata';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, statSync } from 'node:fs';
import { AddressInfo } from 'node:net';
import { join, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { parseArgs } from './cli';
import { SelfPort } from './send/send.service';
import { cookieName, securityMiddleware } from './security/security';

export async function createApp(dir: string, port: number) {
  const token = randomBytes(24).toString('base64url');
  const self = new SelfPort();
  const app = await NestFactory.create<NestExpressApplication>(AppModule.forRoot(dir, self), { logger: false, bodyParser: false });
  app.disable('x-powered-by');
  // The real port is known only after binding, so the middleware reads it lazily.
  let guard = securityMiddleware(token, port);
  app.use((req: any, res: any, next: any) => guard(req, res, next));
  // Registered after the guard: nothing is parsed before the token and origin checks pass.
  app.useBodyParser('json', { limit: '12mb' });
  const web = join(__dirname, '..', 'web');
  if (existsSync(web)) app.useStaticAssets(web);
  try {
    await app.listen(port, '127.0.0.1');
  } catch (e) {
    await app.close().catch(() => {});
    throw e;
  }
  self.port = (app.getHttpServer().address() as AddressInfo).port;
  guard = securityMiddleware(token, self.port);
  return { app, token, cookie: `${cookieName(self.port)}=${token}`, url: `http://127.0.0.1:${self.port}/?t=${token}` };
}

function openBrowser(url: string) {
  const [cmd, args] =
    process.platform === 'win32' ? ['rundll32', ['url.dll,FileProtocolHandler', url]]
    : process.platform === 'darwin' ? ['open', [url]]
    : ['xdg-open', [url]];
  spawn(cmd, args as string[], { detached: true, stdio: 'ignore', windowsHide: true }).on('error', () => {}).unref();
}

async function cli() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const dir = resolve(args.dir);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) throw new Error(`Restyx: pasta não encontrada: ${dir}`);
    const { app, url } = await createApp(dir, args.port);
    const stop = (code: number) => void app.close().finally(() => process.exit(code));
    process.once('SIGINT', () => stop(130));
    process.once('SIGTERM', () => stop(143));
    console.log(`Restyx em ${dir}\n${url}\nCtrl+C para encerrar.`);
    if (args.open) openBrowser(url);
  } catch (e: any) {
    if (e?.code === 'EADDRINUSE') console.error(`Restyx: a porta ${e.port} já está em uso.`);
    else console.error(e?.message?.startsWith('Restyx:') ? e.message : `Restyx: ${e?.message ?? e}`);
    process.exit(1);
  }
}

if (require.main === module) void cli();
