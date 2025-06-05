import { z } from 'zod';
import {CashFlowPaymentDto} from "./payment";

export const CashFlowDto = z.object({
    id: z.number().int().optional(),
    property: z.number().nullable().optional(),
    client: z.number().nullable().optional(),
    user: z.number(),
    owner: z.number().nullable().optional(),
    person: z.number().nullable().optional(),
    date: z.string(),
    month: z.string(),
    location: z.string().optional(),
    attachments: z.any().optional(),
    createdBy: z.any(),
    updatedby: z.any(),
    temporalTransactionId: z.number().nullable().optional(),
    isTemporalTransaction: z.boolean().optional().default(false),
    payments: z.array(CashFlowPaymentDto),
});

export type CashFlowDTO = z.infer<typeof CashFlowDto>;

