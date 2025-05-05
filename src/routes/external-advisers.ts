import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { externalAdviser } from '../db/schema-old';
import { eq } from 'drizzle-orm';
import {ExternalAdviserDto} from "../dto/external-adviser.dto";
import jsonError from "../utils/jsonError";

export type Env = {
    NEON_DB: string;
    JWT_SECRET: string;
};

const externalAdvisersRoutes = new Hono<{ Bindings: Env }>();

externalAdvisersRoutes.get('', async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(externalAdviser);
    return c.json({ data });
});

externalAdvisersRoutes.post('/', async (c) => {
    const payload = await c.req.json();
    const parsed = ExternalAdviserDto.safeParse(payload);


    if (!parsed.success) {
        return jsonError(c, {
            message: 'Validation failed',
            status: 400,
            code: 'VALIDATION_ERROR',
        });
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAdviser = await db.insert(externalAdviser).values(parsed.data).returning();
    return c.json({ data: newAdviser[0] });
});

externalAdvisersRoutes.patch('/:allieId', async (c) => {
    const { allieId } = c.req.param();
    const payload = await c.req.json();
    const parsed = ExternalAdviserDto.partial().safeParse(payload);


    if (!parsed.success) {
        return jsonError(c, {
            message: 'Validation failed',
            status: 400,
            code: 'VALIDATION_ERROR',
        });
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updated = await db
        .update(externalAdviser)
        .set(parsed.data)
        .where(eq(externalAdviser.id, Number(allieId)))
        .returning();
    return c.json({ data: updated[0] });
});

externalAdvisersRoutes.delete('/:id', async (c) => {
    const { id } = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(externalAdviser).where(eq(externalAdviser.id, Number(id)));
    return c.json({ message: 'Adviser deleted successfully' });
});

export default externalAdvisersRoutes;
