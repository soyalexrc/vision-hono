import { Hono } from 'hono';

const externalAdvisers = new Hono();

externalAdvisers.get('', async (c) => {
    return c.json({ externalAdvisers: [] })
})

export default externalAdvisers;
