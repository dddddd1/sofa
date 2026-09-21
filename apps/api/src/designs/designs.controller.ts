import { Body, Controller, Get, Post, UsePipes } from '@nestjs/common';
import { ruleDescriptors } from '@harper/core';
import { ZodValidationPipe } from '../zod-validation.pipe';
import { type ValidateRequest, validateRequestSchema } from './designs.dto';
import { DesignsService } from './designs.service';

/**
 * 配置域：
 *  POST /v1/designs/validate  权威校验 + layout + BOM + 报价 + snapshotHash
 *  GET  /v1/designs/rules     规则描述下发（前端即时提示，永远不做权威判定）
 */
@Controller('designs')
export class DesignsController {
  constructor(private readonly designs: DesignsService) {}

  @Post('validate')
  @UsePipes(new ZodValidationPipe(validateRequestSchema))
  validate(@Body() body: ValidateRequest) {
    return this.designs.validate(body);
  }

  @Get('rules')
  getRules() {
    return { rules: ruleDescriptors };
  }
}
