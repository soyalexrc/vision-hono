import { Hono } from 'hono';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {eq} from "drizzle-orm";
import {authMiddleware} from "../../middleware/auth";
import {attribute} from "../../db/schema";

export type Env = {
    NEON_DB: string;
}

const attributes = new Hono< {Bindings: Env }>();

attributes.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(attribute);
    return c.json({ data });
})

attributes.post('/', async (c) => {
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAlly = await db.insert(attribute).values(payload).returning();
    return c.json({ data: newAlly[0] });
})

attributes.patch('/:allieId', async (c) => {
    const params: any = c.req.param();
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAlly = await db.update(attribute).set(payload).where(eq(attribute.id, params.allieId)).returning();
    return c.json({ data: updatedAlly[0] });
})

attributes.delete('/:id', async (c) => {
    const params: any = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(attribute).where(eq(attribute.id, params.id));
    return c.json({ message: 'Ally deleted successfully' });
})

export default attributes;
