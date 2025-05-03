// dto/utility.dto.ts
import { z } from 'zod';

// Enum values for formType and formValueType
export const formTypes = ['check', 'text', 'select'] as const;


export const AttributeDto = z.object({
    label: z.string(),
    placeholder: z.string(),
    formType: z.enum(formTypes), // Form Type should be one of the values ['check', 'text', 'select']
    options: z.string(),
});

export const AttributePatchDto = AttributeDto.partial();

export type AttributeInput = z.infer<typeof AttributeDto>;
export type AttributePatchInput = z.infer<typeof AttributePatchDto>;
