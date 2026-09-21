import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health(): { ok: true; service: string; ts: string } {
    return { ok: true, service: 'harper-api', ts: new Date().toISOString() };
  }
}
