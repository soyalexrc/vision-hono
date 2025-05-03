import { SignJWT } from 'jose'
import {config} from "dotenv";

config({
    path: '.dev.vars',
})

export async function generateJWT(user: any) {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

    return await new SignJWT({ email: user.email, id: user.id })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2 days')
        .sign(secret)
}
