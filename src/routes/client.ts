import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { client } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import jsonError from '../utils/jsonError';
import {AllyDto} from "../dto/ally.dto";
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
        });
    }
});

// PATCH /clients/:clientId
clientsRoutes.patch('/:clientId', async (c) => {
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
        const updatedClient = await db.update(client).set(parsed.data).where(eq(client.id, params.clientId)).returning();
        return c.json({ data: updatedClient[0] });
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to update client',
            code: 'DATABASE_ERROR',
        });
    }
});

// DELETE /clients/:id
clientsRoutes.delete('/:id', async (c) => {
    try {
        const params: any = c.req.param();
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        await db.delete(client).where(eq(client.id, params.id));
        return c.json({ message: 'Client deleted successfully' });
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to delete client',
            code: 'DATABASE_ERROR',
        });
    }
});

export default clientsRoutes;
