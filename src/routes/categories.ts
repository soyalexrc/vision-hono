import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { categories } from '../db/schema-old';
import { eq } from 'drizzle-orm';
import jsonError from '../utils/jsonError';

export type Env = {
    NEON_DB: string;
};

const categoriesRoute = new Hono<{ Bindings: Env }>();

// GET /categories
categoriesRoute.get('/', async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const data = await db.select().from(categories);
        return c.json({ data });
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch categories',
            code: 'DATABASE_ERROR',
        });
    }
});

// GET /categories/featured
categoriesRoute.get('/featured', async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const data = await db.select().from(categories).where(eq(categories.isFeatured, true));
        return c.json({ data });
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch featured categories',
            code: 'DATABASE_ERROR',
        });
    }
});

export default categoriesRoute;
