import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../../middleware/auth';
import { adjacency } from '../../db/schema';
import {AdjacencyDto, AdjacencyPatchDto} from "../../dto/property/adjacency.dto";

export type Env = {
    NEON_DB: string;
};

const adjacencies = new Hono<{ Bindings: Env }>();

// GET all adjacencies
adjacencies.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(adjacency);
    return c.json({ data });
});

// POST a new adjacency entry
adjacencies.post('/', async (c) => {
    const payload = await c.req.json();
    const parsed = AdjacencyDto.safeParse(payload);

    if (!parsed.success) {
        return c.json({ error: parsed.error.format() }, 400);
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAdjacency = await db.insert(adjacency).values(parsed.data).returning();
    return c.json({ data: newAdjacency[0] });
});

// PATCH an existing adjacency entry
adjacencies.patch('/:adjacencyId', async (c) => {
    const { adjacencyId } = c.req.param();
    const payload = await c.req.json();
    const parsed = AdjacencyPatchDto.safeParse(payload);

    if (!parsed.success) {
        return c.json({ error: parsed.error.format() }, 400);
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAdjacency = await db
        .update(adjacency)
        .set(parsed.data)
        .where(eq(adjacency.id, Number(adjacencyId)))
        .returning();

    return c.json({ data: updatedAdjacency[0] });
});

// DELETE an adjacency entry
adjacencies.delete('/:id', async (c) => {
    const { id } = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(adjacency).where(eq(adjacency.id, Number(id)));
    return c.json({ message: 'Adjacency deleted successfully' });
});

export default adjacencies;
