// middleware/auth.ts
import { MiddlewareHandler } from 'hono'
import { jwtVerify } from 'jose'
import {config} from "dotenv";

config({
    path: '.dev.vars',
})

export const authMiddleware: MiddlewareHandler = async (c, next) => {
    // Try multiple ways to get the authorization header
    const authHeader = c.req.header('Authorization') ||
        c.req.header('authorization') ||
        c.req.raw.headers.get('Authorization') ||
        c.req.raw.headers.get('authorization')

    console.log('authHeader:', authHeader)
    console.log('All headers:', Object.fromEntries(c.req.raw.headers.entries()))
    console.log('Request method:', c.req.method)
    console.log('Request URL:', c.req.url)

    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
        console.error('JWT_SECRET is not defined in environment variables')
        return c.json({ error: 'Server configuration error' }, 500)
    }

    const secret = new TextEncoder().encode(JWT_SECRET!)

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No valid authorization header found')
        return c.json({ error: 'Unauthorized - Missing or invalid authorization header' }, 401)
    }

    // TODO buscar por id de usuario y revisar si es isactive o status es active

    const token = authHeader.split(' ')[1]

    try {
        const { payload } = await jwtVerify(token, secret)
        c.set('user', payload)
        await next()
    } catch (err) {
        return c.json({ error: 'Invalid token' }, 401)
    }
}
