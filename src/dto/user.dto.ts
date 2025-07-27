import { z } from 'zod';

export const UserDto = z.object({
    id: z.number().optional(),
    email: z.string().email(),
    username: z.string().min(1),
    phonenumber: z.string(),
    firstname: z.string(),
    lastname: z.string(),
    imageurl: z.string().optional(),
    createdat: z.string().optional(),
    updatedat: z.string().optional(),
    status: z.string(),
    role: z.string(),
    isactive: z.boolean().default(true),
    permissions: z.record(z.any()).optional(),
    issuperadmin: z.boolean().default(false),
    lastlogin: z.string().optional(),
    twofactorenabled: z.boolean().default(false),
    password: z.string().min(1),
    pushtoken: z.string().optional(),
});

export const UserPatchDto = UserDto.partial();

export type UserDtoType = z.infer<typeof UserDto>;
export type UserPatchDtoType = z.infer<typeof UserPatchDto>;
