import {Hono} from 'hono';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {owner} from "../db/schema";
import {eq} from "drizzle-orm";
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

ownerRoutes.delete('/:id', async (c) => {
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
    await db.delete(owner).where(eq(owner.id, params.id));
    return c.json({message: 'Propietario eliminado correctamente'});
})

export default ownerRoutes;
