import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {desc, eq} from 'drizzle-orm';
import { authMiddleware } from '../../middleware/auth';
import { utility } from '../../db/schema';
import {UtilityDto, UtilityPatchDto} from "../../dto/property/utility.dto";

export type Env = {
    NEON_DB: string;
};

const utilities = new Hono<{ Bindings: Env }>();

utilities.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(utility).orderBy(desc(utility.id));
    return c.json(data);
});

utilities.post('/', async (c) => {
    const payload = await c.req.json();
    const parsed = UtilityDto.safeParse(payload);

    if (!parsed.success) {
        return c.json({ error: parsed.error.format() }, 400);
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAlly = await db.insert(utility).values(parsed.data).returning();
    return c.json({ data: newAlly[0] });
});

utilities.patch('/:allieId', async (c) => {
    const { allieId } = c.req.param();
    const payload = await c.req.json();
    const parsed = UtilityPatchDto.safeParse(payload);

    if (!parsed.success) {
        return c.json({ error: parsed.error.format() }, 400);
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAlly = await db
        .update(utility)
        .set(parsed.data)
        .where(eq(utility.id, Number(allieId)))
        .returning();

    return c.json({ data: updatedAlly[0] });
});

utilities.delete('/:id', async (c) => {
    const { id } = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(utility).where(eq(utility.id, Number(id)));
    return c.json({ message: 'Ally deleted successfully' });
});

export default utilities;
