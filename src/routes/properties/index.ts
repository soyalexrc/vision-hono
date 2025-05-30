import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, sql as rawSql } from 'drizzle-orm';
import { authMiddleware } from '../../middleware/auth';
import {generalInformation, negotiationInfomation, property} from '../../db/schema';
import {PropertyDto, PropertyPatchDto} from "../../dto/property";

export type Env = {
    NEON_DB: string;
};

const properties = new Hono<{ Bindings: Env }>();

// GET all properties
properties.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const data = await db.select({
        // Property fields
        id: property.id,
        coverUrl: property.images,
        status: property.status,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
        isFeatured: property.isFeatured,
        // General information fields
        publicationTitle: generalInformation.publicationTitle,
        code: generalInformation.code,
        propertyType: generalInformation.propertyType,
        // Negotiation fields
        price: negotiationInfomation.price,
        adviserName: negotiationInfomation.realstateadvisername,
        operationType: negotiationInfomation.operationType,
    })
        .from(property)
        .leftJoin(generalInformation, eq(property.id, generalInformation.propertyId)) // Add proper join condition
        .leftJoin(negotiationInfomation, eq(property.id, negotiationInfomation.propertyId)); // Add proper join condition

    return c.json({
        data: data.map(item => ({ ...item, coverUrl: item.coverUrl!.length > 0 ? item.coverUrl![0] : [] })),
    });
});

properties.get('/list', async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(property);
    return c.json({ data });
});

// POST a new property entry
properties.post('/', async (c) => {
    const payload = await c.req.json();
    const parsed = PropertyDto.safeParse(payload);

    if (!parsed.success) {
        return c.json({ error: parsed.error.format() }, 400);
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newProperty = await db.insert(property).values(parsed.data as any).returning();
    return c.json({ data: newProperty[0] });
});

// PATCH an existing property entry
properties.patch('/:propertyId', async (c) => {
    const params = c.req.param();
    const payload = await c.req.json();
    const parsed = PropertyPatchDto.safeParse(payload);

    if (!parsed.success) {
        return c.json({ error: parsed.error.format() }, 400);
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedProperty = await db
        .update(property)
        .set(parsed.data)
        .where(eq(property.id, params.propertyId))
        .returning();

    return c.json({ data: updatedProperty[0] });
});

// DELETE a property entry
properties.delete('/:id', async (c) => {
    const params = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(property).where(eq(property.id, params.id));
    return c.json({ message: 'Property deleted successfully' });
});

export default properties;
