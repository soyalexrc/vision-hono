import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {desc, eq} from 'drizzle-orm';
import { equipment } from '../../db/schema';
import {EquipmentDto, EquipmentPatchDto} from "../../dto/property/equipment.dto";

export type Env = {
    NEON_DB: string;
};

const equipments = new Hono<{ Bindings: Env }>();

// GET all equipment
equipments.get('/', async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(equipment).orderBy(desc(equipment.id));
    return c.json(data);
});

// POST a new equipment entry
equipments.post('/', async (c) => {
    const payload = await c.req.json();
    const parsed = EquipmentDto.safeParse(payload);

    if (!parsed.success) {
        return c.json({ error: parsed.error.format() }, 400);
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newEquipment = await db.insert(equipment).values(parsed.data).returning();
    return c.json({ data: newEquipment[0] });
});

// PATCH an existing equipment entry
equipments.patch('/:equipmentId', async (c) => {
    const { equipmentId } = c.req.param();
    const payload = await c.req.json();
    const parsed = EquipmentPatchDto.safeParse(payload);

    if (!parsed.success) {
        return c.json({ error: parsed.error.format() }, 400);
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedEquipment = await db
        .update(equipment)
        .set(parsed.data)
        .where(eq(equipment.id, Number(equipmentId)))
        .returning();

    return c.json({ data: updatedEquipment[0] });
});

// DELETE an equipment entry
equipments.delete('/:id', async (c) => {
    const { id } = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(equipment).where(eq(equipment.id, Number(id)));
    return c.json({ message: 'Equipment deleted successfully' });
});

export default equipments;
