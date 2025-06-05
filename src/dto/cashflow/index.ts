import { z } from 'zod';

export const CashFlowDto = z.object({
    id: z.number().int().optional(),
    property_id: z.number().int().nullable().optional(),
    client_id: z.number().int().nullable().optional(),
    user_id: z.number().int().optional(),
    owner_id: z.number().int().optional(),
    cashflow_person_id: z.number().int().optional(),
    date: z.string(),
    internalProperty: z.string(),
    person: z.string().optional(),
    month: z.string(),
    location: z.string().optional(),
    isTemporalTransaction: z.boolean().default(false),
});

export type CashFlowDTO = z.infer<typeof CashFlowDto>;

