import { z } from 'zod';

export const AllyDto = z.object({
    email: z.string().email(),
    phoneNumber: z.string(),
    name: z.string(),
    lastname: z.string(),
    status: z.string(),
});

export type AllyDTO = z.infer<typeof AllyDto>;
