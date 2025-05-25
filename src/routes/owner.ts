import {Hono} from 'hono';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {owner} from "../db/schema";
import {eq, inArray} from "drizzle-orm";
import {OwnerSchema} from "../dto/owner.dto";
import jsonError from "../utils/jsonError";

export type Env = {
    NEON_DB: string;
}

const ownerRoutes = new Hono<{ Bindings: Env }>();

ownerRoutes.get('/', async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(owner);
    const count = await db.$count(owner);
    return c.json({data, count});
})

ownerRoutes.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = OwnerSchema.safeParse(body);

    if (!parsed.success) {
        return jsonError(c, {
            message: 'Validation failed',
            status: 400,
            code: 'VALIDATION_ERROR',
        });
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const newOwner = await db.insert(owner).values(parsed.data).returning();
    return c.json({data: newOwner[0]});
})

ownerRoutes.patch('/:ownerId', async (c) => {
    const params: any = c.req.param();

    if (!params.ownerId) {
        return jsonError(c, {
            status: 400,
            message: 'ID is required',
            code: 'VALIDATION_ERROR',
        });
    }

    const body = await c.req.json();
    const parsed = OwnerSchema.partial().safeParse(body); // PATCH = partial update

    if (!parsed.success) {
        return jsonError(c, {
            message: 'Validation failed',
            status: 400,
            code: 'VALIDATION_ERROR',
        });
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedAlly = await db.update(owner).set(parsed.data).where(eq(owner.id, params.ownerId)).returning();
    return c.json({data: updatedAlly[0]});
})

// DELETE /owners/:id
ownerRoutes.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param();

        if (!id) {
            return jsonError(c, {
                status: 400,
                message: 'Owner ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        const foundOwner = await db
            .select()
            .from(owner)
            .where(eq(owner.id, Number(id)));

        if (foundOwner.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'Owner not found',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(owner)
            .set({ status: 'deleted' })
            .where(eq(owner.id, Number(id)))
            .returning();

        return c.json({
            data: result[0],
            message: 'Owner marked as deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting owner:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to delete owner',
            code: 'DATABASE_ERROR',
        });
    }
});

// POST /owners/delete-many
ownerRoutes.post('/delete-many', async (c) => {
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

        const foundOwners = await db
            .select({ id: owner.id })
            .from(owner)
            .where(inArray(owner.id, ids));

        const foundIds = foundOwners.map((o) => o.id);

        if (foundIds.length === 0) {
            return jsonError(c, {
                status: 404,
                message: 'No owners found to delete',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(owner)
            .set({ status: 'deleted' })
            .where(inArray(owner.id, foundIds))
            .returning();

        return c.json({
            data: result,
            updatedCount: result.length,
            notFoundIds: ids.filter((id) => !foundIds.includes(id)),
            message: 'Owners marked as deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting owners:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to delete owners',
            code: 'DATABASE_ERROR',
        });
    }
});

// POST /owners/restore
ownerRoutes.post('/restore', async (c) => {
    try {
        const body = await c.req.json();
        const { id } = body;

        if (!id) {
            return jsonError(c, {
                status: 400,
                message: 'Owner ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        const foundOwner = await db
            .select()
            .from(owner)
            .where(eq(owner.id, Number(id)));

        if (foundOwner.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'Owner not found',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(owner)
            .set({ status: 'active' })
            .where(eq(owner.id, Number(id)))
            .returning();

        if (result.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'Failed to restore owner',
                code: 'NOT_FOUND',
            });
        }

        return c.json({
            data: result[0],
            message: 'Owner restored successfully',
        });
    } catch (error: any) {
        console.error('Error restoring owner:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to restore owner',
            code: 'DATABASE_ERROR',
        });
    }
});

export default ownerRoutes;
