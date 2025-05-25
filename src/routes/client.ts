import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { client } from '../db/schema';
import {eq, inArray} from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import jsonError from '../utils/jsonError';
import {ClientDto} from "../dto/client.dto";

export type Env = {
    NEON_DB: string;
};

const clientsRoutes = new Hono<{ Bindings: Env }>();

// GET /clients
clientsRoutes.get('/', authMiddleware, async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const data = await db.select().from(client);
        const count = await db.$count(client);
        return c.json({ data, count });
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch clients',
            code: 'DATABASE_ERROR',
        });
    }
});

// GET /clients/:id
clientsRoutes.get('/:id', authMiddleware, async (c) => {
    try {
        const params: any = c.req.param();

        if (!params.id) {
            return jsonError(c, {
                status: 400,
                message: 'ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const data = await db.select().from(client).where(eq(client.id, params.id));
        return c.json({ data: data[0] });
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch clients',
            code: 'DATABASE_ERROR',
        });
    }
});

// POST /clients
clientsRoutes.post('/', async (c) => {
    try {
        const body = await c.req.json();
        console.log(body);
        const parsed = ClientDto.safeParse(body);

        if (!parsed.success) {
            return jsonError(c, {
                message: 'Validation failed',
                status: 400,
                code: 'VALIDATION_ERROR',
                details: parsed.error?.issues, // Add detailed error info
        });
        }
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const newClient = await db.insert(client).values(parsed.data).returning();
        return c.json({ data: newClient[0] });
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to create client',
            code: 'DATABASE_ERROR',
            details: error.message, // Add detailed error info
        });
    }
});

// PATCH /clients/:clientId
clientsRoutes.patch('/:id', async (c) => {
    try {
        const params: any = c.req.param();

        if (!params.id) {
            return jsonError(c, {
                status: 400,
                message: 'ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        console.log(params.id)

        const body = await c.req.json();
        console.log(body)
        const parsed = ClientDto.partial().safeParse(body); // PATCH = partial update

        if (!parsed.success) {
            return jsonError(c, {
                message: 'Validation failed',
                status: 400,
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const updatedClient = await db.update(client).set(parsed.data).where(eq(client.id, params.id)).returning();
        console.log(updatedClient[0])

        return c.json({ data: updatedClient[0] });
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to update client',
            code: 'DATABASE_ERROR',
        });
    }
});

// DELETE /allies/:id
clientsRoutes.delete('/:id', async (c) => {
    try {
        const id = c.req.param('id');

        if (!id) {
            return jsonError(c, {
                status: 400,
                message: 'Client ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        const foundedClient = await db.select().from(client).where(eq(client.id, Number(id)));

        if (foundedClient.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'Client not found',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(client)
            .set({ status: 'deleted' })
            .where(eq(client.id, Number(id)))
            .returning();

        return c.json({
            data: result[0],
            message: 'Client marked as deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting client:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to delete client',
            code: 'DATABASE_ERROR',
        });
    }
});

// POST /clients/remove-many
clientsRoutes.post('/remove-many', async (c) => {
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

        const foundAllies = await db
            .select({ id: client.id })
            .from(client)
            .where(inArray(client.id, ids));

        const foundIds = foundAllies.map((a) => a.id);

        if (foundIds.length === 0) {
            return jsonError(c, {
                status: 404,
                message: 'No clients found to delete',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(client)
            .set({ status: 'deleted' })
            .where(inArray(client.id, foundIds))
            .returning();

        return c.json({
            data: result,
            updatedCount: result.length,
            notFoundIds: ids.filter((id) => !foundIds.includes(id)),
            message: 'Allies marked as deleted successfully',
        });
    } catch (error: any) {
        console.error('Error removing clients:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to delete clients',
            code: 'DATABASE_ERROR',
        });
    }
});

// PATCH /client/restore/:id
clientsRoutes.post('/restore', async (c) => {
    try {
        const body = await c.req.json();
        const id = body.id;

        if (!id) {
            return jsonError(c, {
                status: 400,
                message: 'Client ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        const foundedClient = await db.select().from(client).where(eq(client.id, Number(id)));

        if (foundedClient.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'Client not found',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(client)
            .set({ status: 'active' })
            .where(eq(client.id, Number(id)))
            .returning();

        if (result.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'Failed to restore client',
                code: 'NOT_FOUND',
            });
        }

        return c.json({
            data: result[0],
            message: 'client restored successfully',
        });
    } catch (error: any) {
        console.error('Error restoring client:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to restore client',
            code: 'DATABASE_ERROR',
        });
    }
});


export default clientsRoutes;
