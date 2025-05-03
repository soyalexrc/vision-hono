// dto/utility.dto.ts
import { z } from 'zod';

export const UtilityDto = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
});

export const UtilityPatchDto = UtilityDto.partial();

export type UtilityInput = z.infer<typeof UtilityDto>;
export type UtilityPatchInput = z.infer<typeof UtilityPatchDto>;
