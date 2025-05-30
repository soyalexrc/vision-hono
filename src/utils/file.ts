// File validation helper
const validateFile = (file: File) => {
    const allowedTypes = [
        // Images
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        // Documents
        'application/pdf',
        // Excel
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // Word
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type.toLowerCase())) {
        return {
            valid: false,
            error: 'Invalid file type. Only images, PDF, Excel, and Word documents are allowed.'
        };
    }

    if (file.size > maxSize) {
        return { valid: false, error: 'File too large. Maximum size is 10MB.' };
    }

    return { valid: true };
};

export default validateFile;
