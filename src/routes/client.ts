import { Hono } from 'hono';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {client} from "../db/schema";
import {eq} from "drizzle-orm";
import {authMiddleware} from "../middleware/auth";

export type Env = {
    NEON_DB: string;
}

const clientsRoutes = new Hono< {Bindings: Env }>();

clientsRoutes.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(client);
    const count = await db.$count(client);
    return c.json({ data, count });
})

clientsRoutes.post('/', async (c) => {
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAlly = await db.insert(client).values(payload).returning();
    return c.json({ data: newAlly[0] });
})

clientsRoutes.patch('/:clientId', async (c) => {
    const params: any = c.req.param();
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAlly = await db.update(client).set(payload).where(eq(client.id, params.clientId)).returning();
    return c.json({ data: updatedAlly[0] });
})

clientsRoutes.delete('/:id', async (c) => {
    const params: any = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(client).where(eq(client.id, params.id));
    return c.json({ message: 'Ally deleted successfully' });
})

export default clientsRoutes;
