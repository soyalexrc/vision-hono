import { z } from 'zod';

export const ExternalAdviserDto = z.object({
    name: z.string().min(1),
    lastname: z.string().min(1),
    email: z.string().email(),
    phoneNumber: z.string(),
    realStateCompanyName: z.string(),
});

export type ExternalAdviserDtoType = z.infer<typeof ExternalAdviserDto>;
