import { z } from 'zod';

export const CashFlowPaymentDto = z.object({
    id: z.number().int().optional(),
    cashflow: z.number(),
    canon: z.boolean().optional(),
    contract: z.boolean().optional(),
    guarantee: z.boolean().optional(),
    serviceType: z.string().optional(),
    reason: z.string(),
    service: z.string().optional(),
    taxPayer: z.string().optional(),
    amount: z.string(),
    currency: z.number(),
    wayToPay: z.number(),
    transactionType: z.number(),
    totalDue: z.string().optional(),
    incomeByThird: z.string().optional(),
    entity: z.number(),
    pendingToCollect: z.string(),
    observation: z.string().optional(),
});

export type CashFlowPaymentDTO = z.infer<typeof CashFlowPaymentDto>;
