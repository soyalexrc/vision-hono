// dto/utility.dto.ts
import { z } from 'zod';

export const AdjacencyDto = z.object({
    title: z.string(),
    description: z.string(),
});

export const AdjacencyPatchDto = AdjacencyDto.partial();

export type AdjacencyInput = z.infer<typeof AdjacencyDto>;
export type AdjacencyPatchInput = z.infer<typeof AdjacencyPatchDto>;
