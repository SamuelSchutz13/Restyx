import { Body, Controller, Delete, DynamicModule, Get, Header, Module, Post, Put, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { basename } from 'node:path';
import { renderCurl, renderJson } from './export/export';
import { SelfPort, SendService } from './send/send.service';
import { StoreService, WORKSPACE_FILE } from './store/store.service';
import { parseOptions, parseRequest, parseWorkspace } from './store/validate';

@Controller('api')
class ApiController {
  constructor(private readonly store: StoreService, private readonly sender: SendService) {}

  @Get('health')
  health() {
    return { ok: true };
  }

  @Get('info')
  info() {
    return { dir: basename(this.store.dir), file: WORKSPACE_FILE };
  }

  @Get('workspace')
  workspace() {
    return this.store.loadPublic();
  }

  @Put('workspace')
  save(@Body() body: unknown) {
    return this.store.save(parseWorkspace(body));
  }

  @Post('send')
  send(@Body() body: any) {
    return this.sender.send(parseRequest(body?.request), parseOptions(body?.options));
  }

  @Get('history')
  history() {
    return this.sender.listHistory();
  }

  @Delete('history')
  clear() {
    this.sender.clearHistory();
    return { ok: true };
  }

  @Get('export')
  @Header('Cache-Control', 'no-store')
  async export(@Query('format') format: string, @Query('includeSecrets') secrets: string, @Res() res: Response) {
    const ws = await this.store.load();
    const include = secrets === '1';
    const [name, type, text] = format === 'curl' ? ['restyx.sh', 'text/x-shellscript', renderCurl(ws, include)] : ['restyx.json', 'application/json', renderJson(ws, include)];
    res.setHeader('Content-Type', `${type}; charset=utf-8`);
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.send(text);
  }
}

@Module({})
export class AppModule {
  static forRoot(dir: string, self: SelfPort): DynamicModule {
    return {
      module: AppModule,
      controllers: [ApiController],
      providers: [
        { provide: StoreService, useValue: new StoreService(dir) },
        { provide: SelfPort, useValue: self },
        { provide: SendService, useFactory: (s: StoreService, p: SelfPort) => new SendService(s, p), inject: [StoreService, SelfPort] },
      ],
    };
  }
}
