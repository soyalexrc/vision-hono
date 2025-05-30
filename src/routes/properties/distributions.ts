import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {desc, eq} from 'drizzle-orm';
import { authMiddleware } from '../../middleware/auth';
import {distribution} from '../../db/schema';
import {DistributionDto, DistributionPatchDto} from "../../dto/property/distribution.dto";

export type Env = {
    NEON_DB: string;
};

const distributions = new Hono<{ Bindings: Env }>();

// GET all distributions
distributions.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(distribution).orderBy(desc(distribution.id));
    return c.json(data);
});

// POST a new distribution entry
distributions.post('/', async (c) => {
    const payload = await c.req.json();
    const parsed = DistributionDto.safeParse(payload);

    if (!parsed.success) {
        return c.json({ error: parsed.error.format() }, 400);
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newDistribution = await db.insert(distribution).values(parsed.data).returning();
    return c.json({ data: newDistribution[0] });
});

// PATCH an existing distribution entry
distributions.patch('/:distributionId', async (c) => {
    const { distributionId } = c.req.param();
    const payload = await c.req.json();
    const parsed = DistributionPatchDto.safeParse(payload);

    if (!parsed.success) {
        return c.json({ error: parsed.error.format() }, 400);
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedDistribution = await db
        .update(distribution)
        .set(parsed.data)
        .where(eq(distribution.id, Number(distributionId)))
        .returning();

    return c.json({ data: updatedDistribution[0] });
});

// DELETE a distribution entry
distributions.delete('/:id', async (c) => {
    const { id } = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(distribution).where(eq(distribution.id, Number(id)));
    return c.json({ message: 'Distribution deleted successfully' });
});

export default distributions;
