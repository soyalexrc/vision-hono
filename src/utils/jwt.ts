import {jwtVerify, SignJWT} from 'jose'
import {config} from "dotenv";

config({
    path: '.dev.vars',
})

export async function generateJWT(user: any) {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

    return await new SignJWT({ email: user.email, id: user.id })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1 week')
        .sign(secret)
}

export async function verifyJWT(token: string) {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (error) {
        console.error('JWT verification failed:', error);
        throw new Error('Invalid token');
    }
}
