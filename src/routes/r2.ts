import { Hono } from 'hono';
import jsonError from '../utils/jsonError';
import {neon} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {ally, categories} from "../db/schema";
import {count, eq, inArray} from "drizzle-orm";
import {AllyDto} from "../dto/ally.dto";
import {authMiddleware} from "../middleware/auth";
import validateFile from "../utils/file";
import {R2Service} from "../services/r2";

export type Env = {
    NEON_DB: string;
    VISION_BUCKET: R2Bucket
};

const r2 = new Hono<{ Bindings: Env }>();

// Single file upload
r2.post('/upload/single', authMiddleware, async (c) => {
    try {
        // Get form data
        const formData = await c.req.formData();
        const file = formData.get('file') as File;

        // Validate file exists
        if (!file) {
            return jsonError(c, {
                status: 400,
                message: 'No file provided',
                code: 'NO_FILE',
            });
        }

        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
            return jsonError(c, {
                status: 400,
                message: validation.error!,
                code: 'INVALID_FILE',
            });
        }

        // Upload to R2
        const r2Service = new R2Service(c.env.VISION_BUCKET);
        const result = await r2Service.uploadFile(file);

        if (result.success) {
            return c.json({
                success: true,
                data: {
                    url: result.url,
                    key: result.key,
                    originalName: result.originalName,
                    size: result.size,
                    type: result.type
                }
            });
        } else {
            return jsonError(c, {
                status: 500,
                message: result.error || 'Failed to upload file',
                code: 'UPLOAD_FAILED',
            });
        }

    } catch (error: any) {
        console.log('Upload error:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to upload to R2',
            code: 'BUCKET_ERROR',
        });
    }
});

export default r2;
