import { Hono } from 'hono';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {eq} from "drizzle-orm";
import {authMiddleware} from "../../middleware/auth";
import {property} from "../../db/schema";

export type Env = {
    NEON_DB: string;
}

const properties = new Hono< {Bindings: Env }>();

properties.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(property);
    return c.json({ data });
})

properties.post('/', async (c) => {
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAlly = await db.insert(property).values(payload).returning();
    return c.json({ data: newAlly[0] });
})

properties.patch('/:allieId', async (c) => {
    const params: any = c.req.param();
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAlly = await db.update(property).set(payload).where(eq(property.id, params.allieId)).returning();
    return c.json({ data: updatedAlly[0] });
})

properties.delete('/:id', async (c) => {
    const params: any = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(property).where(eq(property.id, params.id));
    return c.json({ message: 'Ally deleted successfully' });
})

export default properties;
