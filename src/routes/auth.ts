import { Hono } from 'hono';
import {generateJWT} from "../utils/jwt";

export type Env = {
    NEON_DB: string;
    JWT_SECRET: string;
}

const auth = new Hono<{ Bindings: Env }>();

auth.post('/login', async (c) => {
    const { username, password } = await c.req.json();

    const payload = {
        email: 'sample@sample.com',
        id: 123123
    }

    const token = await generateJWT(payload);;

    return c.json({
        user: {
            access_token: token,
        }
    })
})

export default auth;
