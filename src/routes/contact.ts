import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { contactForm } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import {ContactFormDto} from "../dto/contact-form.dto";

export type Env = {
    NEON_DB: string;
}

const contactForms = new Hono<{ Bindings: Env }>();

// GET route
contactForms.get('/', authMiddleware, async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const data = await db.select().from(contactForm);
    return c.json({ data });
});

// POST route
contactForms.post('/', async (c) => {
    const payload = await c.req.json();

    // Validate payload using ContactFormDto
    const validationResult = ContactFormDto.safeParse(payload);
    if (!validationResult.success) {
        return c.json({ error: validationResult.error.errors }, 400);
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const newContactForm = await db.insert(contactForm).values(payload).returning();
    return c.json({ data: newContactForm[0] });
});

// PATCH route
contactForms.patch('/:contactFormId', async (c) => {
    const params: any = c.req.param();
    const payload = await c.req.json();

    // Validate payload using ContactFormDto
    const validationResult = ContactFormDto.safeParse(payload);
    if (!validationResult.success) {
        return c.json({ error: validationResult.error.errors }, 400);
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    const updatedContactForm = await db.update(contactForm)
        .set(payload)
        .where(eq(contactForm.id, params.contactFormId))
        .returning();
    return c.json({ data: updatedContactForm[0] });
});

// DELETE route
contactForms.delete('/:id', async (c) => {
    const params: any = c.req.param();
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);
    await db.delete(contactForm).where(eq(contactForm.id, params.id));
    return c.json({ message: 'Contact form deleted successfully' });
});

export default contactForms;
