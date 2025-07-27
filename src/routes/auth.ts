import { Hono } from 'hono';
import {generateJWT, verifyJWT} from "../utils/jwt";
import jsonError from "../utils/jsonError";
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {eq} from "drizzle-orm";
import {user} from "../db/schema";
import bcrypt from "bcryptjs";

export type Env = {
    NEON_DB: string;
    JWT_SECRET: string;
}

const auth = new Hono<{ Bindings: Env }>();

auth.post('/sign-in', async (c) => {
    const { email, password } = await c.req.json();

    if (!email || !password) {
        return jsonError(c, {
            status: 400,
            message: 'Email and password are required',
            code: 'VALIDATION_ERROR',
        });
    }

    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const userFound: any[] = await db.select().from(user).where(eq(user.email, email)).limit(1);

    if (userFound.length === 0) {
        return jsonError(c, {
            status: 404,
            message: 'User not found',
            code: 'NOT_FOUND',
        });
    }

    const isValid = bcrypt.compareSync(password, userFound[0].password)

    if (!isValid) {
        return jsonError(c, {
            status: 401,
            message: 'Invalid credentials',
            code: 'UNAUTHORIZED',
        });
    }

    const payload = {
        email,
        id: userFound[0].id
    }

    const token = await generateJWT(payload);

    const { password: _password, ...userResult } = userFound[0];

    return c.json({
        access_token: token,
        user: userResult
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

    if (!token) {
        return jsonError(c, {
            status: 401,
            message: 'Token not provided',
            code: 'UNAUTHORIZED',
        });
    }

    try {
        // Verify the JWT token here and extract user information
        const { id, email } = await verifyJWT(token);
        console.log('verifiedToken', {id, email});

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        let userResult: any;

        if (id) {
            const userFounded = await db.select().from(user).where(eq(user.id, Number(id))).limit(1);
            if (userFounded.length === 0) {
                return jsonError(c, {
                    status: 404,
                    message: 'User not found',
                    code: 'NOT_FOUND',
                });
            }
            userResult = userFounded[0]; // Fixed: was using 'user[0]' instead of 'userFounded[0]'
        } else if (email) {
            const userFounded = await db.select().from(user).where(eq(user.email, String(email))).limit(1);
            if (userFounded.length === 0) {
                return jsonError(c, {
                    status: 404,
                    message: 'User not found',
                    code: 'NOT_FOUND',
                });
            }
            userResult = userFounded[0];
        } else {
            // Handle case where neither id nor email is provided
            return jsonError(c, {
                status: 400,
                message: 'Invalid token payload',
                code: 'INVALID_TOKEN',
            });
        }


        const { password: _password, ...userResultWithoutPass } = userResult;
        return c.json({
            user: userResultWithoutPass
        });

    } catch (error) {
        // Handle JWT verification errors
        return jsonError(c, {
            status: 401,
            message: 'Invalid token',
            code: 'INVALID_TOKEN',
        });
    }
});
export default auth;
