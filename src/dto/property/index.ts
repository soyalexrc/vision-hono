// dto/property.dto.ts
import { z } from 'zod';

export const PropertyDto = z.object({
    userId: z.string().min(1, 'User ID is required'),
    images: z.array(z.string()), // Images is optional
    distribution: z.array(z.any()), // Distribution is optional (array of any JSON)
    slug: z.string().min(1, 'Slug is required'),
    furnishedAreas: z.array(z.string()), // Furnished areas is optional
    isFeatured: z.boolean().default(false),
    active: z.boolean().default(false),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export const PropertyPatchDto = PropertyDto.partial(); // For patch updates (all fields are optional)

export type PropertyInput = z.infer<typeof PropertyDto>;
export type PropertyPatchInput = z.infer<typeof PropertyPatchDto>;
