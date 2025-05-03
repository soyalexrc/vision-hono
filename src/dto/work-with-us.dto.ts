import { z } from 'zod';

export const WorkWithUsDto = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    message: z.string().min(1),
    role: z.string().min(1),
    office: z.string().min(1),
    cvUrl: z.string().url(),
});

export const WorkWithUsPatchDto = WorkWithUsDto.partial();

export type WorkWithUsInput = z.infer<typeof WorkWithUsDto>;
export type WorkWithUsPatchInput = z.infer<typeof WorkWithUsPatchDto>;
