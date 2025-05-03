import { Hono } from 'hono';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {ally, categories} from "../db/schema";
import {eq} from "drizzle-orm";

export type Env = {
    NEON_DB: string;
}

const categoriesRoute = new Hono< {Bindings: Env }>();

categoriesRoute.get('/', async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(categories);
    return c.json({ data });
})

categoriesRoute.get('/featured', async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(categories).where(eq(categories.isFeatured, true));
    return c.json({ data });
})
export default categoriesRoute;
