// dto/utility.dto.ts
import { z } from 'zod';

export const EquipmentDto = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
});

export const EquipmentPatchDto = EquipmentDto.partial();

export type EquipmentInput = z.infer<typeof EquipmentDto>;
export type EquipmentPatchInput = z.infer<typeof EquipmentPatchDto>;
