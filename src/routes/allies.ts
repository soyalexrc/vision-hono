import { Hono } from 'hono';
import jsonError from '../utils/jsonError';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {categories} from "../db/schema";
import {count} from "drizzle-orm";

export type Env = {
    NEON_DB: string;
};

const allies = new Hono<{ Bindings: Env }>();

// GET /allies
allies.get('/', async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const [data, countResult] = await Promise.all([
            db.select().from(categories),
            db.select({ count: count() }).from(categories)
        ]);

        const countRows = countResult[0]?.count || 0;

        return c.json({
            allies: data,
            count: countRows
        });
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch allies',
            code: 'DATABASE_ERROR',
        });
    }
});

// POST /allies
// allies.post('/', async (c) => {
//     try {
//         const body = await c.req.json();
//         const parsed = AllyDto.safeParse(body);
//
//         if (!parsed.success) {
//             return jsonError(c, {
//                 message: 'Validation failed',
//                 status: 400,
//                 code: 'VALIDATION_ERROR',
//             });
//         }
//
//
//         const sql = neon(c.env.NEON_DB);
//         const db = drizzle(sql);
//         const newAlly = await db.insert(ally).values(parsed.data).returning();
//         return c.json({ data: newAlly[0] });
//     } catch (error: any) {
//         return jsonError(c, {
//             status: 500,
//             message: 'Failed to create ally',
//             code: 'DATABASE_ERROR',
//         });
//     }
// });

// PATCH /allies/:allieId
// allies.patch('/:allieId', async (c) => {
//     try {
//         const params: any = c.req.param();
//
//         if (!params.ownerId) {
//             return jsonError(c, {
//                 status: 400,
//                 message: 'ID is required',
//                 code: 'VALIDATION_ERROR',
//             });
//         }
//
//         const body = await c.req.json();
//         const parsed = AllyDto.partial().safeParse(body); // PATCH = partial update
//
//         if (!parsed.success) {
//             return jsonError(c, {
//                 message: 'Validation failed',
//                 status: 400,
//                 code: 'VALIDATION_ERROR',
//             });
//         }
//         const sql = neon(c.env.NEON_DB);
//         const db = drizzle(sql);
//         const updatedAlly = await db.update(ally).set(parsed.data).where(eq(ally.id, params.allieId)).returning();
//         return c.json({ data: updatedAlly[0] });
//     } catch (error: any) {
//         return jsonError(c, {
//             status: 500,
//             message: 'Failed to update ally',
//             code: 'DATABASE_ERROR',
//         });
//     }
// });

// DELETE /allies/:id
// allies.delete('/:id', async (c) => {
//     try {
//         const params: any = c.req.param();
//
//         if (!params.id) {
//             return jsonError(c, {
//                 status: 400,
//                 message: 'Ally ID is required',
//                 code: 'VALIDATION_ERROR',
//             });
//         }
//
//         const sql = neon(c.env.NEON_DB);
//         const db = drizzle(sql);
//         await db.delete(ally).where(eq(ally.id, params.id));
//         return c.json({ message: 'Ally deleted successfully' });
//     } catch (error: any) {
//         return jsonError(c, {
//             status: 500,
//             message: 'Failed to delete ally',
//             code: 'DATABASE_ERROR',
//         });
//     }
// });

export default allies;
