import { Hono } from 'hono';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {service, subService} from "../db/schema";
import {eq} from "drizzle-orm";
import {authMiddleware} from "../middleware/auth";

export type Env = {
    NEON_DB: string;
}

const serviceRoutes = new Hono< {Bindings: Env }>();

serviceRoutes.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(service);
    const count = await db.$count(service);
    return c.json({ data, count });
})

serviceRoutes.post('/', async (c) => {
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAlly = await db.insert(service).values(payload).returning();
    return c.json({ data: newAlly[0] });
})

serviceRoutes.patch('/:serviceId', async (c) => {
    const params: any = c.req.param();
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAlly = await db.update(service).set(payload).where(eq(service.id, params.serviceId)).returning();
    return c.json({ data: updatedAlly[0] });
})

serviceRoutes.delete('/:id', async (c) => {
    const params: any = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(service).where(eq(service.id, params.id));
    return c.json({ message: 'Ally deleted successfully' });
})


serviceRoutes.get('/subservice', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(subService);
    const count = await db.$count(subService);
    return c.json({ data, count });
})

serviceRoutes.post('/subservice', async (c) => {
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAlly = await db.insert(subService).values(payload).returning();
    return c.json({ data: newAlly[0] });
})

serviceRoutes.patch('/subservice/:serviceId', async (c) => {
    const params: any = c.req.param();
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAlly = await db.update(subService).set(payload).where(eq(subService.id, params.serviceId)).returning();
    return c.json({ data: updatedAlly[0] });
})

serviceRoutes.delete('subservice/:id', async (c) => {
    const params: any = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(subService).where(eq(subService.id, params.id));
    return c.json({ message: 'Ally deleted successfully' });
})


export default serviceRoutes;
