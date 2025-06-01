import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { workWithUsForm } from '../db/schema';
import { eq } from 'drizzle-orm';
import { WorkWithUsDto, WorkWithUsPatchDto } from '../dto/work-with-us.dto';
import jsonError from "../utils/jsonError";

export type Env = {
    NEON_DB: string;
};

const workWithUsForms = new Hono<{ Bindings: Env }>();

workWithUsForms.get('/', async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(workWithUsForm);
    return c.json({ data });
});

workWithUsForms.post('/', async (c) => {
    const payload = await c.req.json();
    const parsed = WorkWithUsDto.safeParse(payload);

     if (!parsed.success) {
            return jsonError(c, {
                message: 'Validation failed',
                status: 400,
                code: 'VALIDATION_ERROR',
            });
        }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAlly = await db.insert(workWithUsForm).values(parsed.data).returning();
    return c.json({ data: newAlly[0] });
});

workWithUsForms.patch('/:allieId', async (c) => {
    const { allieId } = c.req.param();
    const payload = await c.req.json();
    const parsed = WorkWithUsPatchDto.safeParse(payload);

     if (!parsed.success) {
            return jsonError(c, {
                message: 'Validation failed',
                status: 400,
                code: 'VALIDATION_ERROR',
            });
        }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAlly = await db
        .update(workWithUsForm)
        .set(parsed.data)
        .where(eq(workWithUsForm.id, Number(allieId)))
        .returning();

    return c.json({ data: updatedAlly[0] });
});

workWithUsForms.delete('/:id', async (c) => {
    const { id } = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(workWithUsForm).where(eq(workWithUsForm.id, Number(id)));
    return c.json({ message: 'Ally deleted successfully' });
});

export default workWithUsForms;
