import { z } from 'zod';

export const CashFlowPropertyDto = z.object({
    id: z.number().int().optional(),
    name: z.string(),
    location: z.string(),
});

export type CashFlowPropertyDTO = z.infer<typeof CashFlowPropertyDto>;
