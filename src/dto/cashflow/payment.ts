import { z } from 'zod';

export const CashFlowPaymentDto = z.object({
    id: z.number().int().optional(),
    cashflow: z.number().optional(),
    canon: z.boolean().optional(),
    contract: z.boolean().optional(),
    guarantee: z.boolean().optional(),
    serviceType: z.string().optional(),
    reason: z.string(),
    service: z.string().optional(),
    taxPayer: z.string().optional(),
    amount: z.number(),
    currency: z.number(),
    wayToPay: z.number(),
    transactionType: z.number(),
    totalDue: z.number().optional(),
    incomeByThird: z.number().optional(),
    entity: z.number().nullable().optional(),
    pendingToCollect: z.number(),
    observation: z.string().optional(),
});

export type CashFlowPaymentDTO = z.infer<typeof CashFlowPaymentDto>;
