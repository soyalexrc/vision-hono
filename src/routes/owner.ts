import { Hono } from 'hono';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {owner} from "../db/schema";
import {eq} from "drizzle-orm";
import {authMiddleware} from "../middleware/auth";

export type Env = {
    NEON_DB: string;
}

const ownerRoutes = new Hono< {Bindings: Env }>();

ownerRoutes.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(owner);
    const count = await db.$count(owner);
    return c.json({ data, count });
})

ownerRoutes.post('/', async (c) => {
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAlly = await db.insert(owner).values(payload).returning();
    return c.json({ data: newAlly[0] });
})

ownerRoutes.patch('/:ownerId', async (c) => {
    const params: any = c.req.param();
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAlly = await db.update(owner).set(payload).where(eq(owner.id, params.ownerId)).returning();
    return c.json({ data: updatedAlly[0] });
})

ownerRoutes.delete('/:id', async (c) => {
    const params: any = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(owner).where(eq(owner.id, params.id));
    return c.json({ message: 'Ally deleted successfully' });
})

export default ownerRoutes;
