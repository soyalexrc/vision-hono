import { Hono } from 'hono';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {eq} from "drizzle-orm";
import {authMiddleware} from "../../middleware/auth";
import {equipment} from "../../db/schema";

export type Env = {
    NEON_DB: string;
}

const equipments = new Hono< {Bindings: Env }>();

equipments.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(equipment);
    return c.json({ data });
})

equipments.post('/', async (c) => {
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAlly = await db.insert(equipment).values(payload).returning();
    return c.json({ data: newAlly[0] });
})

equipments.patch('/:allieId', async (c) => {
    const params: any = c.req.param();
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAlly = await db.update(equipment).set(payload).where(eq(equipment.id, params.allieId)).returning();
    return c.json({ data: updatedAlly[0] });
})

equipments.delete('/:id', async (c) => {
    const params: any = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(equipment).where(eq(equipment.id, params.id));
    return c.json({ message: 'Ally deleted successfully' });
})

export default equipments;
