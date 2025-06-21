// R2 Service helper class
export class R2Service {
    private bucket: R2Bucket;

    constructor(bucket: R2Bucket) {
        this.bucket = bucket;
    }

    private generateKey(originalName: string, folder = 'images'): string {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = originalName.split('.').pop() || '';
        return `${folder}/${timestamp}-${randomString}-${originalName}.${extension}`;
    }

    // Alternative approach - more explicit about handling extensions
    private generateKeyAlternative(originalName: string, folder = 'images'): string {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);

        // Split the filename and extension
        const lastDotIndex = originalName.lastIndexOf('.');

        if (lastDotIndex > 0 && lastDotIndex < originalName.length - 1) {
            // File has extension
            const nameWithoutExt = originalName.substring(0, lastDotIndex);
            const extension = originalName.substring(lastDotIndex); // includes the dot
            return `${folder}/${timestamp}-${randomString}-${nameWithoutExt}${extension}`;
        } else {
            // File has no extension
            return `${folder}/${timestamp}-${randomString}-${originalName}`;
        }
    }

    formatNameWithoutKey(originalName: string, folder: string): string {
        const lastDotIndex = originalName.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < originalName.length - 1) {
            // File has extension
            const nameWithoutExt = originalName.substring(0, lastDotIndex);
            const extension = originalName.substring(lastDotIndex); // includes the dot
            return `${folder}/${nameWithoutExt}${extension}`;
        } else {
            // File has no extension
            return `${folder}/${originalName}`;
        }
    }

    async uploadFile(file: File, folder = 'images', shouldGenerateKey = true) {
        console.log('shouldGenerateKey',  shouldGenerateKey)
        try {
            const key = shouldGenerateKey ? this.generateKeyAlternative(file.name, folder): this.formatNameWithoutKey(file.name, folder) ;
            const fileData = await file.arrayBuffer();

            await this.bucket.put(key, fileData, {
                httpMetadata: {
                    contentType: file.type || 'application/octet-stream',
                },
            });

            // Generate public URL - replace with your R2 custom domain
            const url = `https://bucket.visioninmobiliaria.com.ve/${key}`;

            return {
                success: true,
                url,
                key,
                originalName: file.name,
                size: file.size,
                type: file.type
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Upload failed',
            };
        }
    }

    async deleteFile(key: string): Promise<boolean> {
        try {
            await this.bucket.delete(key);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    async listFiles(path: string): Promise<any[]> {
        // List objects with the given prefix
        const objects = await this.bucket.list({
            prefix: path ? `${path}/` : '',
            delimiter: '/'
        })
        const items: any[] = []

        // Add folders (common prefixes)
        if (objects.delimitedPrefixes) {
            for (const prefix of objects.delimitedPrefixes) {
                const folderName = prefix.replace(path ? `${path}/` : '', '').replace('/', '')
                if (folderName) {
                    items.push({
                        name: folderName,
                        path: prefix.replace(/\/$/, ''), // Remove trailing slash
                        type: 'folder',
                        size: 0,
                        lastModified: new Date().toISOString()
                    })
                }
            }
        }

        // Add files
        for (const object of objects.objects) {
            if (object.key !== path && object.key !== `${path}/`) {
                const fileName = object.key.replace(path ? `${path}/` : '', '')
                // Skip if it's a nested file (contains /)
                if (!fileName.includes('/')) {
                    items.push({
                        name: fileName,
                        path: object.key,
                        type: 'file',
                        size: object.size,
                        lastModified: object.uploaded.toISOString()
                    })
                }
            }
        }

        return items;
    }

}
