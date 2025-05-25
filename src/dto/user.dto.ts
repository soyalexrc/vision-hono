import { z } from 'zod';

export const UserDto = z.object({
    id: z.number(),
    email: z.string().email(),
    username: z.string().min(1),
    phoneNumber: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    imageUrl: z.string().optional(),
    createdat: z.string(),
    updatedat: z.string(),
    status: z.string(),
    role: z.string(),
    isActive: z.boolean().default(true),
    permissions: z.record(z.any()).optional(),
    isSuperAdmin: z.boolean().default(false),
    lastLogin: z.string().optional(),
    twoFactorEnabled: z.boolean().default(false),
    password: z.string().min(1),
    pushToken: z.string().optional(),
});

export const UserPatchDto = UserDto.partial();

export type UserDtoType = z.infer<typeof UserDto>;
export type UserPatchDtoType = z.infer<typeof UserPatchDto>;
