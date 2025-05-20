import { Hono } from 'hono';
import { neon, Client } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {user, users2} from '../db/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { UserDto, UserPatchDto } from '../dto/user.dto';
import jsonError from "../utils/jsonError";
import postgres from "postgres";

export type Env = {
    NEON_DB: string;
    HYPERDRIVE: Hyperdrive;
    POSTGRES_ALT: Hyperdrive;
};

const users = new Hono<{ Bindings: Env }>();


users.get('/', authMiddleware, async (c) => {
    const sql = postgres(c.env.POSTGRES_ALT.connectionString);
    console.log('here')


    const [data, countResult] = await Promise.all([
        sql`select * from users`,
        sql`select count(*) as count from users`
    ]);

    const count = countResult[0]?.count || 0;

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
