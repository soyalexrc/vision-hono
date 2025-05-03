// middleware/auth.ts
import { MiddlewareHandler } from 'hono'
import { jwtVerify } from 'jose'
import {config} from "dotenv";

config({
    path: '.dev.vars',
})

export const authMiddleware: MiddlewareHandler = async (c, next) => {
    const authHeader = c.req.header('Authorization')
    const JWT_SECRET = process.env.JWT_SECRET;
    const secret = new TextEncoder().encode(JWT_SECRET!)


    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401)
    }

    const token = authHeader.split(' ')[1]

    try {
        const { payload } = await jwtVerify(token, secret)
        c.set('user', payload)
        await next()
    } catch (err) {
        return c.json({ error: 'Invalid token' }, 401)
    }
}
