// dto/serviceDto.ts
import { z } from 'zod';

export const ServiceDto = z.object({
    title: z.string().min(1),
});

export const SubServiceDto = z.object({
    service: z.string().min(1),
    serviceId: z.number().int(),
});

export const SubServicePatchDto = SubServiceDto.partial();

export type ServiceDtoType = z.infer<typeof ServiceDto>;
export type SubServiceDtoType = z.infer<typeof SubServiceDto>;
