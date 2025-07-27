import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {desc, eq} from 'drizzle-orm';
import { attribute } from '../../db/schema';
import {AttributeDto, AttributePatchDto} from "../../dto/property/attribute.dto";

export type Env = {
    NEON_DB: string;
};

const attributes = new Hono<{ Bindings: Env }>();

// GET all attributes
attributes.get('/', async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(attribute).orderBy(desc(attribute.id));
    return c.json(data);
});

// POST a new attribute entry
attributes.post('/', async (c) => {
    const payload = await c.req.json();
    const parsed = AttributeDto.safeParse(payload);

    if (!parsed.success) {
        return c.json({ error: parsed.error.format() }, 400);
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newAttribute = await db.insert(attribute).values(parsed.data).returning();
    return c.json({ data: newAttribute[0] });
});

// PATCH an existing attribute entry
attributes.patch('/:attributeId', async (c) => {
    const { attributeId } = c.req.param();
    const payload = await c.req.json();
    const parsed = AttributePatchDto.safeParse(payload);

    if (!parsed.success) {
        return c.json({ error: parsed.error.format() }, 400);
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAttribute = await db
        .update(attribute)
        .set(parsed.data)
        .where(eq(attribute.id, Number(attributeId)))
        .returning();

    return c.json({ data: updatedAttribute[0] });
});

// DELETE an attribute entry
attributes.delete('/:id', async (c) => {
    const { id } = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(attribute).where(eq(attribute.id, Number(id)));
    return c.json({ message: 'Attribute deleted successfully' });
});

export default attributes;
