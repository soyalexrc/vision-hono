import { Hono } from 'hono';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {eq} from "drizzle-orm";
import {authMiddleware} from "../../middleware/auth";
import {distribution} from "../../db/schema";

export type Env = {
    NEON_DB: string;
}

const distributions = new Hono< {Bindings: Env }>();

distributions.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(distribution);
    return c.json({ data });
})

distributions.post('/', async (c) => {
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAlly = await db.insert(distribution).values(payload).returning();
    return c.json({ data: newAlly[0] });
})

distributions.patch('/:allieId', async (c) => {
    const params: any = c.req.param();
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAlly = await db.update(distribution).set(payload).where(eq(distribution.id, params.allieId)).returning();
    return c.json({ data: updatedAlly[0] });
})

distributions.delete('/:id', async (c) => {
    const params: any = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(distribution).where(eq(distribution.id, params.id));
    return c.json({ message: 'Ally deleted successfully' });
})

export default distributions;
