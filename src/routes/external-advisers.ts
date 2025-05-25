import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { externalAdviser } from '../db/schema';
import {eq, inArray} from 'drizzle-orm';
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

// DELETE /external-advisers/:id
externalAdvisersRoutes.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param();

        if (!id) {
            return jsonError(c, {
                status: 400,
                message: 'Adviser ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        const foundAdviser = await db
            .select()
            .from(externalAdviser)
            .where(eq(externalAdviser.id, Number(id)));

        if (foundAdviser.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'Adviser not found',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(externalAdviser)
            .set({ status: 'deleted' })
            .where(eq(externalAdviser.id, Number(id)))
            .returning();

        return c.json({
            data: result[0],
            message: 'Adviser marked as deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting adviser:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to delete adviser',
            code: 'DATABASE_ERROR',
        });
    }
});

// POST /external-advisers/delete-many
externalAdvisersRoutes.post('/delete-many', async (c) => {
    try {
        const body = await c.req.json();
        const ids = body.ids;

        if (!Array.isArray(ids) || ids.length === 0) {
            return jsonError(c, {
                status: 400,
                message: 'At least one ID must be provided',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        const foundAdvisers = await db
            .select({ id: externalAdviser.id })
            .from(externalAdviser)
            .where(inArray(externalAdviser.id, ids));

        const foundIds = foundAdvisers.map((a) => a.id);

        if (foundIds.length === 0) {
            return jsonError(c, {
                status: 404,
                message: 'No advisers found to delete',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(externalAdviser)
            .set({ status: 'deleted' })
            .where(inArray(externalAdviser.id, foundIds))
            .returning();

        return c.json({
            data: result,
            updatedCount: result.length,
            notFoundIds: ids.filter((id) => !foundIds.includes(id)),
            message: 'Advisers marked as deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting advisers:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to delete advisers',
            code: 'DATABASE_ERROR',
        });
    }
});

// POST /external-advisers/restore
externalAdvisersRoutes.post('/restore', async (c) => {
    try {
        const body = await c.req.json();
        const { id } = body;

        if (!id) {
            return jsonError(c, {
                status: 400,
                message: 'Adviser ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        const foundAdviser = await db
            .select()
            .from(externalAdviser)
            .where(eq(externalAdviser.id, Number(id)));

        if (foundAdviser.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'Adviser not found',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(externalAdviser)
            .set({ status: 'active' })
            .where(eq(externalAdviser.id, Number(id)))
            .returning();

        if (result.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'Failed to restore adviser',
                code: 'NOT_FOUND',
            });
        }

        return c.json({
            data: result[0],
            message: 'Adviser restored successfully',
        });
    } catch (error: any) {
        console.error('Error restoring adviser:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to restore adviser',
            code: 'DATABASE_ERROR',
        });
    }
});

export default externalAdvisersRoutes;
