import { Hono } from 'hono';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {contactForm} from "../db/schema";
import {eq} from "drizzle-orm";
import {authMiddleware} from "../middleware/auth";

export type Env = {
    NEON_DB: string;
}

const contactForms = new Hono< {Bindings: Env }>();

contactForms.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(contactForm);
    return c.json({ data });
})

contactForms.post('/', async (c) => {
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAlly = await db.insert(contactForm).values(payload).returning();
    return c.json({ data: newAlly[0] });
})

contactForms.patch('/:allieId', async (c) => {
    const params: any = c.req.param();
    const payload: any = await c.req.json();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAlly = await db.update(contactForm).set(payload).where(eq(contactForm.id, params.allieId)).returning();
    return c.json({ data: updatedAlly[0] });
})

contactForms.delete('/:id', async (c) => {
    const params: any = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(contactForm).where(eq(contactForm.id, params.id));
    return c.json({ message: 'Ally deleted successfully' });
})

export default contactForms;
