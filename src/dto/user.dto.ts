import { z } from 'zod';

export const UserDto = z.object({
    email: z.string().email(),
    username: z.string().min(1),
    phoneNumber: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    imageUrl: z.string().url(),
    role: z.string(),
    isActive: z.boolean().default(true),
    createdAt: z.string(),
    updatedAt: z.string(),
    lastLogin: z.string(),
    permissions: z.record(z.any()),
    isSuperAdmin: z.boolean().default(false),
    twoFactorEnabled: z.boolean().default(false),
    password: z.string().min(6),
    pushToken: z.string(),
});

export const UserPatchDto = UserDto.partial();

export type UserDtoType = z.infer<typeof UserDto>;
export type UserPatchDtoType = z.infer<typeof UserPatchDto>;
