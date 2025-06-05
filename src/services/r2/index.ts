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

    async uploadFile(file: File, folder = 'images') {
        try {
            const key = this.generateKey(file.name, folder);
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
}
