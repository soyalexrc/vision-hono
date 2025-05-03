import { Hono } from 'hono';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {eq} from "drizzle-orm";
import {authMiddleware} from "../../middleware/auth";
import {utility} from "../../db/schema";

export type Env = {
    NEON_DB: string;
}

const utilities = new Hono< {Bindings: Env }>();

utilities.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(utility);
    return c.json({ data });
})

utilities.post('/', async (c) => {
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAlly = await db.insert(utility).values(payload).returning();
    return c.json({ data: newAlly[0] });
})

utilities.patch('/:allieId', async (c) => {
    const params: any = c.req.param();
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAlly = await db.update(utility).set(payload).where(eq(utility.id, params.allieId)).returning();
    return c.json({ data: updatedAlly[0] });
})

utilities.delete('/:id', async (c) => {
    const params: any = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(utility).where(eq(utility.id, params.id));
    return c.json({ message: 'Ally deleted successfully' });
})

export default utilities;
