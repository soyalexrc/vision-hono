import { Hono } from 'hono';
import {generateJWT, verifyJWT} from "../utils/jwt";
import jsonError from "../utils/jsonError";

export type Env = {
    NEON_DB: string;
    JWT_SECRET: string;
}

const auth = new Hono<{ Bindings: Env }>();

auth.post('/sign-in', async (c) => {
    const { email, password } = await c.req.json();

    const payload = {
        email: 'sample@sample.com',
        id: 123123
    }

    const token = await generateJWT(payload);

    return c.json({
        access_token: token,
        user: {}
    })
})

auth.get('/me', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
        return jsonError(c, {
            status: 401,
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
        });
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT token here and extract user information
    const verifiedToken = verifyJWT(token);
    // For example, using jsonwebtoken library:
    // const decoded = jwt.verify(token, c.env.JWT_SECRET);

    return c.json({
        user: {
            name: 'sample'
        }
    })
})

export default auth;
