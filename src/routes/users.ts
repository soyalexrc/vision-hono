import { Hono } from 'hono';
import { neon, Client } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {user} from '../db/schema';
import {eq, inArray} from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { UserDto, UserPatchDto } from '../dto/user.dto';
import jsonError from "../utils/jsonError";
import postgres from "postgres";

export type Env = {
    NEON_DB: string;
};

const users = new Hono<{ Bindings: Env }>();


users.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(user);
    const count = await db.$count(user);

    return c.json({ data, count });
});

users.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = UserDto.safeParse(body);

   if (!parsed.success) {
        return jsonError(c, {
            message: 'Validation failed',
            status: 400,
            code: 'VALIDATION_ERROR',
        });
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const newUser = await db.insert(user).values(parsed.data).returning();
    return c.json({ data: newUser[0] });
});

users.patch('/:userId', async (c) => {
    const { userId } = c.req.param();
    const body = await c.req.json();
    const parsed = UserPatchDto.safeParse(body);
   if (!parsed.success) {
        return jsonError(c, {
            message: 'Validation failed',
            status: 400,
            code: 'VALIDATION_ERROR',
        });
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const updatedUser = await db
        .update(user)
        .set(parsed.data)
        .where(eq(user.id, Number(userId)))
        .returning();

    return c.json({ data: updatedUser[0] });
});

// DELETE /users/:id
users.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param();

        if (!id) {
            return jsonError(c, {
                status: 400,
                message: 'User ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        const foundUser = await db
            .select()
            .from(user)
            .where(eq(user.id, Number(id)));

        if (foundUser.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'User not found',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(user)
            .set({ isactive: false, status: 'deleted' })
            .where(eq(user.id, Number(id)))
            .returning();

        return c.json({
            data: result[0],
            message: 'User marked as deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to delete user',
            code: 'DATABASE_ERROR',
        });
    }
});

// POST /users/delete-many
users.post('/delete-many', async (c) => {
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

        const foundUsers = await db
            .select({ id: user.id })
            .from(user)
            .where(inArray(user.id, ids));

        const foundIds = foundUsers.map((u) => u.id);

        if (foundIds.length === 0) {
            return jsonError(c, {
                status: 404,
                message: 'No users found to delete',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(user)
            .set({ isactive: false, status: 'deleted' })
            .where(inArray(user.id, foundIds))
            .returning();

        return c.json({
            data: result,
            updatedCount: result.length,
            notFoundIds: ids.filter((id) => !foundIds.includes(id)),
            message: 'Users marked as deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting users:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to delete users',
            code: 'DATABASE_ERROR',
        });
    }
});

// POST /users/restore
users.post('/restore', async (c) => {
    try {
        const body = await c.req.json();
        const { id } = body;

        if (!id) {
            return jsonError(c, {
                status: 400,
                message: 'User ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        const foundUser = await db
            .select()
            .from(user)
            .where(eq(user.id, Number(id)));

        if (foundUser.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'User not found',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(user)
            .set({ isactive: false, status: 'deleted' })
            .where(eq(user.id, Number(id)))
            .returning();

        if (result.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'Failed to restore user',
                code: 'NOT_FOUND',
            });
        }

        return c.json({
            data: result[0],
            message: 'User restored successfully',
        });
    } catch (error: any) {
        console.error('Error restoring user:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to restore user',
            code: 'DATABASE_ERROR',
        });
    }
});

export default users;
