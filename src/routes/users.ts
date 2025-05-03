import { Hono } from 'hono';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {user} from "../db/schema";
import {eq} from "drizzle-orm";
import {authMiddleware} from "../middleware/auth";

export type Env = {
    NEON_DB: string;
}

const users = new Hono< {Bindings: Env }>();

users.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(user);
    const count = await db.$count(user);
    return c.json({ data, count });
})

users.post('/', async (c) => {
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAlly = await db.insert(user).values(payload).returning();
    return c.json({ data: newAlly[0] });
})

users.patch('/:userId', async (c) => {
    const params: any = c.req.param();
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAlly = await db.update(user).set(payload).where(eq(user.id, params.userId)).returning();
    return c.json({ data: updatedAlly[0] });
})

users.delete('/:id', async (c) => {
    const params: any = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(user).where(eq(user.id, params.id));
    return c.json({ message: 'Ally deleted successfully' });
})

export default users;
