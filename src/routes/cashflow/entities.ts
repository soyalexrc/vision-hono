import { Hono } from 'hono';
import jsonError from '../../utils/jsonError';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {cashFlowSourceEntity} from "../../db/schema";
import {verifyJWT} from "../../utils/jwt";

export type Env = {
    NEON_DB: string;
};

const entities = new Hono<{ Bindings: Env }>();

// GET /entities
entities.get('/', async (c) => {
    try {
        // obtain the headers bearer token
        const authHeader = c.req.header('Authorization');
        // decode the token with jose
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return jsonError(c, {
                status: 401,
                message: 'Unauthorized',
                code: 'UNAUTHORIZED',
            });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = await verifyJWT(token);

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        let result = [];

        const data = await db.select().from(cashFlowSourceEntity)

        if (decodedToken.id !== 13) {
            result = data.filter(entity => entity.id !== 2 && entity.id !== 6);
        } else {
            result = data;
        }

        return c.json({
            data: result,
        });
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch entities',
            code: 'DATABASE_ERROR',
        });
    }
});


export default entities;
