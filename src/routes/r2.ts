import { Hono } from 'hono';
import jsonError from '../utils/jsonError';
import validateFile from "../utils/file";
import {R2Service} from "../services/r2";

export type Env = {
    NEON_DB: string;
    VISION_BUCKET: R2Bucket
};

const r2 = new Hono<{ Bindings: Env }>();

// Single file upload
r2.post('/upload/single', async (c) => {
    try {
        // Get form data
        const formData = await c.req.formData();
        const file = formData.get('file') as File;
        const shouldGenerateKey = formData.get('shouldGenerateKey') as string || 'true';
        const folder = formData.get('folder') as string || 'otros'; // Default folder

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
        const result = await r2Service.uploadFile(file, folder, Boolean(shouldGenerateKey));

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
r2.post('/upload/multiple', async (c) => {
    try {
        // Get form data
        const formData = await c.req.formData();
        const files = formData.getAll('files') as File[];
        const folder = formData.get('folder') as string || 'otros'; // Default folder
        const shouldGenerateKey = formData.get('shouldGenerateKey') as string || 'true'; // Default folder

        // Validate files exist
        if (!files || files.length === 0) {
            return jsonError(c, {
                status: 400,
                message: 'No files provided',
                code: 'NO_FILES',
            });
        }

        // // Limit number of files
        // if (files.length > 10) {
        //     return jsonError(c, {
        //         status: 400,
        //         message: 'Too many files. Maximum 10 files allowed.',
        //         code: 'TOO_MANY_FILES',
        //     });
        // }

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
            const uploadResult = await r2Service.uploadFile(file, folder, Boolean(shouldGenerateKey));

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

r2.delete('/upload/:key', async (c) => {
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
r2.get('/upload/info/:key', async (c) => {
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

r2.get('/list', async (c) => {
    try {
        const path = c.req.query('path') || '';
        const bucket = c.env.VISION_BUCKET;

        const fileService = new R2Service(bucket);

        const files = await fileService.listFiles(path);

        return c.json({data: files})
    } catch (error: any) {
        console.log('List files error:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to list files',
            code: 'BUCKET_ERROR',
        });
    }
})

// Download a file
r2.get('/download', async (c) => {
    try {
        const path = c.req.query('path')
        if (!path) {
            return c.json({ error: 'Path is required' }, 400)
        }

        const bucket = c.env.VISION_BUCKET
        const object = await bucket.get(path)

        if (!object) {
            return c.json({ error: 'File not found' }, 404)
        }

        // Set appropriate headers
        const headers = new Headers()
        headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
        headers.set('Content-Disposition', `attachment; filename="${path.split('/').pop()}"`)
        headers.set('Content-Length', object.size.toString())

        return new Response(object.body, { headers })
    } catch (error) {
        console.error('Error downloading file:', error)
        return c.json({ error: 'Failed to download file' }, 500)
    }
})

// Delete a file or folder
r2.delete('/delete', async (c) => {
    try {
        const path = c.req.query('path') || '';
        if (!path) {
            return c.json({ error: 'Path is required' }, 400)
        }

        const bucket = c.env.VISION_BUCKET

        // Check if it's a folder by listing objects with this prefix
        const objects = await bucket.list({ prefix: `${path}/` })

        if (objects.objects.length > 0) {
            // It's a folder, delete all objects in it
            const deletePromises = objects.objects.map(obj => bucket.delete(obj.key))
            await Promise.all(deletePromises)
        } else {
            // It's a file, delete directly
            await bucket.delete(path)
        }

        return c.json({ success: true, message: 'Deleted successfully' })
    } catch (error) {
        console.error('Error deleting:', error)
        return c.json({ error: 'Failed to delete' }, 500)
    }
})

// Rename/move a file or folder
r2.put('/rename', async (c) => {
    try {
        const { oldPath, newName } = await c.req.json()
        if (!oldPath || !newName) {
            return c.json({ error: 'Old path and new name are required' }, 400)
        }

        const bucket = c.env.VISION_BUCKET

        // Helper function to preserve file extension
        const preserveExtension = (originalFileName: string, newName: string): string => {
            // Get the original file extension
            const lastDotIndex = originalFileName.lastIndexOf('.')

            // If original file has no extension, use newName as is
            if (lastDotIndex === -1 || lastDotIndex === originalFileName.length - 1) {
                return newName
            }

            const originalExtension = originalFileName.substring(lastDotIndex)

            // Check if newName already has the correct extension
            if (newName.endsWith(originalExtension)) {
                return newName
            }

            // Remove any extension from newName and add the original extension
            const newNameWithoutExt = newName.replace(/\.[^/.]+$/, '')
            return `${newNameWithoutExt}${originalExtension}`
        }

        // Determine new path
        const pathParts = oldPath.split('/')
        const originalFileName = pathParts[pathParts.length - 1]

        // For files, preserve the extension
        const finalNewName = preserveExtension(originalFileName, newName)
        pathParts[pathParts.length - 1] = finalNewName
        const newPath = pathParts.join('/')

        // Check if it's a file
        const object = await bucket.get(oldPath)
        if (object) {
            // Validate that we're not overwriting an existing file
            if (newPath !== oldPath) {
                const existingObject = await bucket.get(newPath)
                if (existingObject) {
                    return c.json({ error: 'A file with this name already exists' }, 409)
                }
            }

            // It's a file, copy and delete
            await bucket.put(newPath, object.body, {
                httpMetadata: object.httpMetadata
            })
            await bucket.delete(oldPath)
        } else {
            // It's a folder, rename all objects with this prefix
            const objects = await bucket.list({ prefix: `${oldPath}/` })

            if (objects.objects.length === 0) {
                return c.json({ error: 'Folder not found' }, 404)
            }

            // Check if destination folder already exists
            if (newPath !== oldPath) {
                const existingObjects = await bucket.list({ prefix: `${newPath}/` })
                if (existingObjects.objects.length > 0) {
                    return c.json({ error: 'A folder with this name already exists' }, 409)
                }
            }

            const movePromises = []
            for (const obj of objects.objects) {
                const newKey = obj.key.replace(oldPath, newPath)
                const sourceObject = await bucket.get(obj.key)
                if (sourceObject) {
                    movePromises.push(
                        bucket.put(newKey, sourceObject.body, {
                            httpMetadata: sourceObject.httpMetadata
                        }).then(() => bucket.delete(obj.key))
                    )
                }
            }

            await Promise.all(movePromises)
        }

        return c.json({
            success: true,
            message: 'Renamed successfully',
            newName: finalNewName
        })
    } catch (error) {
        console.error('Error renaming:', error)
        return c.json({ error: 'Failed to rename' }, 500)
    }
})

r2.post('/upload/folder', async (c) => {
    try {
        const formData = await c.req.formData()
        const baseFolder = formData.get('baseFolder') as string || ''
        const files = formData.getAll('files') as File[]
        const paths = formData.getAll('paths') as string[]

        if (files.length !== paths.length) {
            return c.json({ error: 'Files and paths count mismatch' }, 400)
        }

        const bucket = c.env.VISION_BUCKET
        const uploadPromises = []
        const foldersCreated = new Set<string>()

        // Process each file with its relative path
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const relativePath = paths[i]

            // Construct the full path in R2
            const fullPath = baseFolder ? `${baseFolder}/${relativePath}` : relativePath

            // Track folders that will be created
            const pathParts = fullPath.split('/')
            for (let j = 1; j < pathParts.length; j++) {
                const folderPath = pathParts.slice(0, j).join('/')
                if (folderPath) {
                    foldersCreated.add(folderPath)
                }
            }

            uploadPromises.push(
                bucket.put(fullPath, file.stream(), {
                    httpMetadata: {
                        contentType: file.type || 'application/octet-stream'
                    }
                })
            )
        }

        // Create folder placeholder files for empty directories
        const folderPromises = Array.from(foldersCreated).map(folderPath => {
            const placeholderPath = `${folderPath}/.folder`
            return bucket.put(placeholderPath, new ArrayBuffer(0), {
                httpMetadata: {
                    contentType: 'application/octet-stream'
                }
            })
        })

        // Upload all files and create folder placeholders
        await Promise.all([...uploadPromises, ...folderPromises])

        return c.json({
            success: true,
            message: `Uploaded folder structure successfully`,
            totalFiles: files.length,
            foldersCreated: foldersCreated.size
        })
    } catch (error) {
        console.error('Error uploading folder:', error)
        return c.json({ error: 'Failed to upload folder' }, 500)
    }
})

// Create a new folder
r2.post('/create-folder', async (c) => {
    try {
        const { path, name } = await c.req.json()
        if (!name) {
            return c.json({ error: 'Folder name is required' }, 400)
        }

        // Create a placeholder file to represent the folder
        // R2 doesn't have true folders, so we create an empty file with .folder suffix
        const folderPath = path ? `${path}/${name}/.folder` : `${name}/.folder`

        const bucket = c.env.VISION_BUCKET
        await bucket.put(folderPath, new ArrayBuffer(0))

        return c.json({ success: true, message: 'Folder created successfully' })
    } catch (error) {
        console.error('Error creating folder:', error)
        return c.json({ error: 'Failed to create folder' }, 500)
    }
})

// Move files/folders (for drag & drop functionality)
r2.put('/move', async (c) => {
    try {
        const { sourcePath, destinationPath } = await c.req.json()
        if (!sourcePath || !destinationPath) {
            return c.json({ error: 'Source and destination paths are required' }, 400)
        }

        const bucket = c.env.VISION_BUCKET

        // Get the item name from source path
        const itemName = sourcePath.split('/').pop()
        const newPath = `${destinationPath}/${itemName}`

        // Check if it's a file
        const object = await bucket.get(sourcePath)
        if (object) {
            // It's a file, copy and delete
            await bucket.put(newPath, object.body, {
                httpMetadata: object.httpMetadata
            })
            await bucket.delete(sourcePath)
        } else {
            // It's a folder, move all objects with this prefix
            const objects = await bucket.list({ prefix: `${sourcePath}/` })

            const movePromises = []
            for (const obj of objects.objects) {
                const relativePath = obj.key.replace(`${sourcePath}/`, '')
                const newKey = `${newPath}/${relativePath}`
                const sourceObject = await bucket.get(obj.key)
                if (sourceObject) {
                    movePromises.push(
                        bucket.put(newKey, sourceObject.body, {
                            httpMetadata: sourceObject.httpMetadata
                        }).then(() => bucket.delete(obj.key))
                    )
                }
            }

            await Promise.all(movePromises)
        }

        return c.json({ success: true, message: 'Moved successfully' })
    } catch (error) {
        console.error('Error moving:', error)
        return c.json({ error: 'Failed to move' }, 500)
    }
})

export default r2;
