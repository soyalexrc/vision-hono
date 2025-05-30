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

// Multiple files upload
r2.post('/upload/multiple', authMiddleware, async (c) => {
    try {
        // Get form data
        const formData = await c.req.formData();
        const files = formData.getAll('files') as File[];

        // Validate files exist
        if (!files || files.length === 0) {
            return jsonError(c, {
                status: 400,
                message: 'No files provided',
                code: 'NO_FILES',
            });
        }

        // Limit number of files
        if (files.length > 10) {
            return jsonError(c, {
                status: 400,
                message: 'Too many files. Maximum 10 files allowed.',
                code: 'TOO_MANY_FILES',
            });
        }

        const r2Service = new R2Service(c.env.VISION_BUCKET);
        const results = [];
        const errors = [];

        // Process each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Validate each file
            const validation = validateFile(file);
            if (!validation.valid) {
                errors.push({
                    index: i,
                    filename: file.name,
                    error: validation.error
                });
                continue;
            }

            // Upload file
            const uploadResult = await r2Service.uploadFile(file);

            if (uploadResult.success) {
                results.push({
                    index: i,
                    filename: file.name,
                    url: uploadResult.url,
                    key: uploadResult.key,
                    size: uploadResult.size,
                    type: uploadResult.type
                });
            } else {
                errors.push({
                    index: i,
                    filename: file.name,
                    error: uploadResult.error
                });
            }
        }

        return c.json({
            success: true,
            data: {
                uploaded: results.length,
                failed: errors.length,
                total: files.length,
                results,
                errors,
                urls: results.map(r => r.url) // Array of URLs for easy access
            }
        });

    } catch (error: any) {
        console.log('Multiple upload error:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to upload files to R2',
            code: 'BUCKET_ERROR',
        });
    }
});

r2.delete('/upload/:key', authMiddleware, async (c) => {
    try {
        const key = c.req.param('key');

        if (!key) {
            return jsonError(c, {
                status: 400,
                message: 'No key provided',
                code: 'NO_KEY',
            });
        }

        // Decode the key if it's URL encoded
        const decodedKey = decodeURIComponent(key);

        const r2Service = new R2Service(c.env.VISION_BUCKET);
        const deleted = await r2Service.deleteFile(decodedKey);

        if (deleted) {
            return c.json({
                success: true,
                message: 'File deleted successfully'
            });
        } else {
            return jsonError(c, {
                status: 500,
                message: 'Failed to delete file',
                code: 'DELETE_FAILED',
            });
        }

    } catch (error: any) {
        console.log('Delete error:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to delete file from R2',
            code: 'BUCKET_ERROR',
        });
    }
});

// Get file info (optional)
r2.get('/upload/info/:key', authMiddleware, async (c) => {
    try {
        const key = c.req.param('key');

        if (!key) {
            return jsonError(c, {
                status: 400,
                message: 'No key provided',
                code: 'NO_KEY',
            });
        }

        const decodedKey = decodeURIComponent(key);
        const object = await c.env.VISION_BUCKET.head(decodedKey);

        if (!object) {
            return jsonError(c, {
                status: 404,
                message: 'File not found',
                code: 'FILE_NOT_FOUND',
            });
        }

        return c.json({
            success: true,
            data: {
                key: decodedKey,
                size: object.size,
                lastModified: object.uploaded,
                contentType: object.httpMetadata?.contentType,
                etag: object.etag
            }
        });

    } catch (error: any) {
        console.log('Get file info error:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to get file info',
            code: 'BUCKET_ERROR',
        });
    }
});

export default r2;
