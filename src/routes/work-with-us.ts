import { Hono } from 'hono';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {workWithUsForm} from "../db/schema";
import {eq} from "drizzle-orm";
import {authMiddleware} from "../middleware/auth";

export type Env = {
    NEON_DB: string;
}

const workWithUsForms = new Hono< {Bindings: Env }>();

workWithUsForms.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(workWithUsForm);
    return c.json({ data });
})

workWithUsForms.post('/', async (c) => {
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAlly = await db.insert(workWithUsForm).values(payload).returning();
    return c.json({ data: newAlly[0] });
})

workWithUsForms.patch('/:allieId', async (c) => {
    const params: any = c.req.param();
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAlly = await db.update(workWithUsForm).set(payload).where(eq(workWithUsForm.id, params.allieId)).returning();
    return c.json({ data: updatedAlly[0] });
})

workWithUsForms.delete('/:id', async (c) => {
    const params: any = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(workWithUsForm).where(eq(workWithUsForm.id, params.id));
    return c.json({ message: 'Ally deleted successfully' });
})

export default workWithUsForms;
