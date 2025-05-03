import { z } from 'zod';

export const OwnerSchema = z.object({
    email: z.string().email(),
    phoneNumber: z.string(),
    name: z.string(),
    lastname: z.string(),
    isInvestor: z.boolean(),
    birthdate: z.string(),
});

export type OwnerDTO = z.infer<typeof OwnerSchema>;
