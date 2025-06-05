import { z } from 'zod';

export const CashFlowPersonDto = z.object({
    id: z.number().int().optional(),
    name: z.string(),
    source: z.string(),
});

export type CashFlowPersonDTO = z.infer<typeof CashFlowPersonDto>;
