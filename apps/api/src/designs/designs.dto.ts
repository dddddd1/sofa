import { z } from 'zod';
import { designSchema } from '@harper/core';

/** POST /v1/designs/validate 请求体 */
export const validateRequestSchema = z.object({
  design: designSchema,
  options: z
    .object({
      room: z
        .object({
          widthM: z.number().positive(),
          depthM: z.number().positive(),
        })
        .nullable()
        .optional(),
      shippingZone: z.enum(['US-CONUS', 'US-AK-HI']).optional(),
      shippingService: z.enum(['white_glove', 'economy']).optional(),
      taxMinor: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

export type ValidateRequest = z.infer<typeof validateRequestSchema>;
