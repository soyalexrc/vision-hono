import { Hono } from 'hono';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {eq} from "drizzle-orm";
import {authMiddleware} from "../../middleware/auth";
import {adjacency} from "../../db/schema";

export type Env = {
    NEON_DB: string;
}

const adjacencies = new Hono< {Bindings: Env }>();

adjacencies.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(adjacency);
    return c.json({ data });
})

adjacencies.post('/', async (c) => {
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAlly = await db.insert(adjacency).values(payload).returning();
    return c.json({ data: newAlly[0] });
})

adjacencies.patch('/:allieId', async (c) => {
    const params: any = c.req.param();
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAlly = await db.update(adjacency).set(payload).where(eq(adjacency.id, params.allieId)).returning();
    return c.json({ data: updatedAlly[0] });
})

adjacencies.delete('/:id', async (c) => {
    const params: any = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(adjacency).where(eq(adjacency.id, params.id));
    return c.json({ message: 'Ally deleted successfully' });
})

export default adjacencies;
