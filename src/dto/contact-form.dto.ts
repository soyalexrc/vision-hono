import { z } from 'zod';

export const ContactFormDto = z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    message: z.string(),
    from: z.string(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type ContactFormDtoType = z.infer<typeof ContactFormDto>;
