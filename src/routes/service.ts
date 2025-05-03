import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { service, subService } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { ServiceDto, SubServiceDto, SubServicePatchDto } from '../dto/service.dto';
import jsonError from "../utils/jsonError";

export type Env = {
    NEON_DB: string;
};

const serviceRoutes = new Hono<{ Bindings: Env }>();

serviceRoutes.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const data = await db.select().from(service);
    const count = await db.$count(service);

    return c.json({ data, count });
});

serviceRoutes.post('/', async (c) => {
    const payload = await c.req.json();
    const parsed = ServiceDto.safeParse(payload);

    if (!parsed.success) {
        return jsonError(c, {
            message: 'Validation failed',
            status: 400,
            code: 'VALIDATION_ERROR',
        });
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const newService = await db.insert(service).values(parsed.data).returning();
    return c.json({ data: newService[0] });
});

serviceRoutes.patch('/:serviceId', async (c) => {
    const { serviceId } = c.req.param();
    const payload = await c.req.json();
    const parsed = ServiceDto.partial().safeParse(payload);

    if (!parsed.success) {
        return jsonError(c, {
            message: 'Validation failed',
            status: 400,
            code: 'VALIDATION_ERROR',
        });
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const updated = await db.update(service).set(parsed.data).where(eq(service.id, Number(serviceId))).returning();
    return c.json({ data: updated[0] });
});

serviceRoutes.delete('/:id', async (c) => {
    const { id } = c.req.param();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    await db.delete(service).where(eq(service.id, Number(id)));
    return c.json({ message: 'Service deleted successfully' });
});

// SubServices
serviceRoutes.get('/subservice', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const data = await db.select().from(subService);
    const count = await db.$count(subService);

    return c.json({ data, count });
});

serviceRoutes.post('/subservice', async (c) => {
    const payload = await c.req.json();
    const parsed = SubServiceDto.safeParse(payload);

    if (!parsed.success) {
        return jsonError(c, {
            message: 'Validation failed',
            status: 400,
            code: 'VALIDATION_ERROR',
        });
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const newSub = await db.insert(subService).values(parsed.data).returning();
    return c.json({ data: newSub[0] });
});

serviceRoutes.patch('/subservice/:serviceId', async (c) => {
    const { serviceId } = c.req.param();
    const payload = await c.req.json();
    const parsed = SubServicePatchDto.safeParse(payload);

    if (!parsed.success) {
        return jsonError(c, {
            message: 'Validation failed',
            status: 400,
            code: 'VALIDATION_ERROR',
        });
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const updated = await db.update(subService).set(parsed.data).where(eq(subService.id, Number(serviceId))).returning();
    return c.json({ data: updated[0] });
});

serviceRoutes.delete('/subservice/:id', async (c) => {
    const { id } = c.req.param();

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    await db.delete(subService).where(eq(subService.id, Number(id)));
    return c.json({ message: 'SubService deleted successfully' });
});

export default serviceRoutes;
