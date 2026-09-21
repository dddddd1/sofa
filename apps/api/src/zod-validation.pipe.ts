import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import { type ZodType, type ZodTypeDef } from 'zod';

/**
 * 通用 Zod 校验管。错误响应为 400 + 结构化 issues，
 * 前端可直接定位字段（与 Design JSON 契约一致）。
 *
 * 第三泛型固定 unknown，兼容 z.object 推导出来的宽输入类型
 * （含 optional/nullable 字段）。
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T, ZodTypeDef, unknown>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    throw new BadRequestException({
      error: 'VALIDATION_FAILED',
      issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
}
