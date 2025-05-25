import { z } from 'zod';

export const AllyDto = z.object({
    email: z.string().email(),
    phoneNumber: z.string(),
    name: z.string(),
    lastname: z.string(),
    status: z.string(),
});

export type OwnerDTO = z.infer<typeof AllyDto>;
