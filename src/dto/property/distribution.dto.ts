// dto/utility.dto.ts
import { z } from 'zod';

export const DistributionDto = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
});

export const DistributionPatchDto = DistributionDto.partial();

export type DistributionInput = z.infer<typeof DistributionDto>;
export type DistributionPatchInput = z.infer<typeof DistributionPatchDto>;
