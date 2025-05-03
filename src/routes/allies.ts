import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { ally } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import jsonError from '../utils/jsonError';
import {OwnerSchema} from "../dto/owner.dto";
import {AllyDto} from "../dto/ally.dto";

export type Env = {
    NEON_DB: string;
};

const allies = new Hono<{ Bindings: Env }>();

// GET /allies
allies.get('/', authMiddleware, async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const data = await db.select().from(ally);
        return c.json({ data });
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch allies',
            code: 'DATABASE_ERROR',
        });
    }
});

// POST /allies
allies.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const parsed = AllyDto.safeParse(body);

        if (!parsed.success) {
            return jsonError(c, {
                message: 'Validation failed',
                status: 400,
                code: 'VALIDATION_ERROR',
            });
        }


        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const newAlly = await db.insert(ally).values(parsed.data).returning();
        return c.json({ data: newAlly[0] });
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to create ally',
            code: 'DATABASE_ERROR',
        });
    }
});

// PATCH /allies/:allieId
allies.patch('/:allieId', async (c) => {
    try {
        const params: any = c.req.param();

        if (!params.ownerId) {
            return jsonError(c, {
                status: 400,
                message: 'ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const body = await c.req.json();
        const parsed = AllyDto.partial().safeParse(body); // PATCH = partial update

        if (!parsed.success) {
            return jsonError(c, {
                message: 'Validation failed',
                status: 400,
                code: 'VALIDATION_ERROR',
            });
        }
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const updatedAlly = await db.update(ally).set(parsed.data).where(eq(ally.id, params.allieId)).returning();
        return c.json({ data: updatedAlly[0] });
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to update ally',
            code: 'DATABASE_ERROR',
        });
    }
});

// DELETE /allies/:id
allies.delete('/:id', async (c) => {
    try {
        const params: any = c.req.param();

        if (!params.id) {
            return jsonError(c, {
                status: 400,
                message: 'Ally ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        await db.delete(ally).where(eq(ally.id, params.id));
        return c.json({ message: 'Ally deleted successfully' });
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to delete ally',
            code: 'DATABASE_ERROR',
        });
    }
});

export default allies;
