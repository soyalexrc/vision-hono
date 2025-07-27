import { Hono } from 'hono';
import jsonError from '../../utils/jsonError';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {cashFlowTransactionType} from "../../db/schema";

export type Env = {
    NEON_DB: string;
};

const transactionTypes = new Hono<{ Bindings: Env }>();

// GET /transactionTypes
transactionTypes.get('/', async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        const data = await db.select().from(cashFlowTransactionType)

        return c.json({
            data,
        });
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch transactionTypes',
            code: 'DATABASE_ERROR',
        });
    }
});


export default transactionTypes;
