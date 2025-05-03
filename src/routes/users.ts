import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { UserDto, UserPatchDto } from '../dto/user.dto';
import jsonError from "../utils/jsonError";

export type Env = {
    NEON_DB: string;
};

const users = new Hono<{ Bindings: Env }>();

users.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const data = await db.select().from(user);
    const count = await db.$count(user);

    return c.json({ data, count });
});

users.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = UserDto.safeParse(body);
   if (!parsed.success) {
        return jsonError(c, {
            message: 'Validation failed',
            status: 400,
            code: 'VALIDATION_ERROR',
        });
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const newUser = await db.insert(user).values(parsed.data).returning();
    return c.json({ data: newUser[0] });
});

users.patch('/:userId', async (c) => {
    const { userId } = c.req.param();
    const body = await c.req.json();
    const parsed = UserPatchDto.safeParse(body);
   if (!parsed.success) {
        return jsonError(c, {
            message: 'Validation failed',
            status: 400,
            code: 'VALIDATION_ERROR',
        });
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const updatedUser = await db
        .update(user)
        .set(parsed.data)
        .where(eq(user.id, Number(userId)))
        .returning();

    return c.json({ data: updatedUser[0] });
});

users.delete('/:id', async (c) => {
    const { id } = c.req.param();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    await db.delete(user).where(eq(user.id, Number(id)));
    return c.json({ message: 'User deleted successfully' });
});

export default users;
