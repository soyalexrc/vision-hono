import { Hono } from 'hono';
import jsonError from '../utils/jsonError';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {ally, appConfig, categories} from "../db/schema";
import {count, eq, inArray} from "drizzle-orm";
import {AllyDto} from "../dto/ally.dto";

export type Env = {
    NEON_DB: string;
};

const config = new Hono<{ Bindings: Env }>();

// GET /allies
config.get('/', async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const [data] = await db.select().from(appConfig);

        return c.json({data});
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch allies',
            code: 'DATABASE_ERROR',
        });
    }
});

// GET BY ID /allies/:id
config.get('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        if (!id) {
            return jsonError(c, {
                status: 400,
                message: 'ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const [data] = await db.select().from(appConfig).where(eq(appConfig.id, id));

        if (!data) {
            return jsonError(c, {
                status: 400,
                message: 'not found',
                code: 'NOT_FOUND',
            });
        }

        return c.json({ data });
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch ally',
            code: 'DATABASE_ERROR',
        });
    }
});

export default config;
