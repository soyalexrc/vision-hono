import { Context } from 'hono';

type JsonErrorOptions = {
    message: string;
    status?: number;
    code?: string; // e.g. 'VALIDATION_ERROR', 'UNAUTHORIZED'
    details?: unknown; // Zod errors, etc.
    meta?: Record<string, any>; // Any additional info
};

export default function jsonError(
    c: Context,
    {
        message,
        status = 500,
        code,
        details,
        meta,
    }: JsonErrorOptions
) {
    const responseBody = {
        success: false,
        error: {
            message,
            code,
            details,
            meta,
        },
    };

    // Remove undefined keys
    Object.keys(responseBody.error).forEach(
        key => responseBody.error[key as keyof typeof responseBody.error] === undefined && delete responseBody.error[key as keyof typeof responseBody.error]
    );

    // @ts-ignore
    return c.json(responseBody, status);
}
