import ControlException from './controlException';

/**
 * File validation utilities for secure file handling
 * Requirements: Error Handling section
 */

export interface FileValidationConfig {
    maxFileSize: number;
    allowedExtensions: string[];
    allowedMimeTypes: string[];
    blockedExtensions: string[];
    blockedMimeTypes: string[];
}

export const DEFAULT_FILE_VALIDATION: FileValidationConfig = {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedExtensions: ['pdf', 'gpx', 'kml', 'kmz', 'txt', 'doc', 'docx', 'zip', 'rar', '7z', 'jpg', 'jpeg', 'png', 'gif', 'bmp'],
    allowedMimeTypes: [
        'application/pdf',
        'application/gpx+xml',
        'application/vnd.google-earth.kml+xml',
        'application/vnd.google-earth.kmz',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/bmp',
        'application/octet-stream'
    ],
    blockedExtensions: ['exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar', 'msi', 'dll', 'php', 'asp', 'jsp'],
    blockedMimeTypes: [
        'application/x-msdownload',
        'application/x-executable',
        'application/x-dosexec',
        'application/x-winexe',
        'application/x-msdos-program',
        'application/javascript',
        'text/javascript',
        'application/x-php',
        'text/x-php'
    ]
};

export class FileValidator {
    private config: FileValidationConfig;

    constructor(config?: Partial<FileValidationConfig>) {
        this.config = {
            ...DEFAULT_FILE_VALIDATION,
            ...config
        };
    }

    /**
     * Validate file for security and compliance
     */
    public validateFile(file: any): void {
        this.validateFileExists(file);
        this.validateFileName(file.name);
        this.validateFileSize(file);
        this.validateFileExtension(file.name);
        this.validateMimeType(file.mimetype || file.type);
    }

    /**
     * Validate file exists and has basic properties
     */
    private validateFileExists(file: any): void {
        if (!file) {
            throw new ControlException('No se ha proporcionado ningún archivo', 400);
        }

        if (!file.name || typeof file.name !== 'string') {
            throw new ControlException('El archivo debe tener un nombre válido', 400);
        }

        if (!file.data && !file.buffer && file.size === undefined) {
            throw new ControlException('El archivo no contiene datos válidos', 400);
        }
    }

    /**
     * Validate filename for security
     */
    private validateFileName(filename: string): void {
        if (!filename || filename.trim() === '') {
            throw new ControlException('El archivo debe tener un nombre válido', 400);
        }

        // Check filename length
        if (filename.length > 255) {
            throw new ControlException('El nombre del archivo es demasiado largo (máximo 255 caracteres)', 400);
        }

        // Check for path traversal attempts
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            throw new ControlException('El nombre del archivo contiene caracteres no permitidos', 400);
        }

        // Check for null bytes and other dangerous characters
        if (filename.includes('\0') || filename.includes('\r') || filename.includes('\n')) {
            throw new ControlException('El nombre del archivo contiene caracteres peligrosos', 400);
        }

        // Check for reserved names (Windows)
        const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
        const baseName = filename.split('.')[0].toUpperCase();
        if (reservedNames.includes(baseName)) {
            throw new ControlException('El nombre del archivo está reservado por el sistema', 400);
        }
    }

    /**
     * Validate file size
     */
    private validateFileSize(file: any): void {
        const fileSize = file.size || (file.data ? file.data.length : 0);
        
        if (fileSize === 0) {
            throw new ControlException('El archivo está vacío', 400);
        }

        if (fileSize > this.config.maxFileSize) {
            const maxSizeMB = Math.round(this.config.maxFileSize / (1024 * 1024));
            throw new ControlException(`El archivo es demasiado grande. Tamaño máximo permitido: ${maxSizeMB}MB`, 400);
        }
    }

    /**
     * Validate file extension
     */
    private validateFileExtension(filename: string): void {
        const fileExtension = filename.toLowerCase().split('.').pop();
        
        if (!fileExtension) {
            throw new ControlException('El archivo debe tener una extensión válida', 400);
        }

        // Check blocked extensions
        if (this.config.blockedExtensions.includes(fileExtension)) {
            throw new ControlException(`El tipo de archivo .${fileExtension} no está permitido por razones de seguridad`, 400);
        }

        // Check allowed extensions
        if (!this.config.allowedExtensions.includes(fileExtension)) {
            throw new ControlException(
                `El tipo de archivo .${fileExtension} no está permitido. Tipos permitidos: ${this.config.allowedExtensions.join(', ')}`, 
                400
            );
        }
    }

    /**
     * Validate MIME type
     */
    private validateMimeType(mimeType?: string): void {
        if (!mimeType) {
            return; // MIME type is optional
        }

        const normalizedMimeType = mimeType.toLowerCase();

        // Check blocked MIME types
        if (this.config.blockedMimeTypes.includes(normalizedMimeType)) {
            throw new ControlException(`El tipo de contenido ${mimeType} no está permitido por razones de seguridad`, 400);
        }

        // Check allowed MIME types
        const isAllowedMime = this.config.allowedMimeTypes.some(allowed => 
            normalizedMimeType === allowed || normalizedMimeType.startsWith(allowed.split('/')[0] + '/')
        );
        
        if (!isAllowedMime) {
            throw new ControlException(`El tipo de contenido ${mimeType} no está permitido`, 400);
        }
    }

    /**
     * Sanitize filename for safe storage
     */
    public static sanitizeFilename(filename: string): string {
        if (!filename) return '';
        
        // Remove or replace dangerous characters
        let sanitized = filename
            .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Replace dangerous characters with underscore
            .replace(/\.+/g, '.') // Replace multiple dots with single dot
            .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
            .trim();

        // Ensure filename is not empty after sanitization
        if (!sanitized) {
            sanitized = 'file';
        }

        // Limit length
        if (sanitized.length > 255) {
            const extension = sanitized.split('.').pop();
            const baseName = sanitized.substring(0, 255 - (extension ? extension.length + 1 : 0));
            sanitized = extension ? `${baseName}.${extension}` : baseName;
        }

        return sanitized;
    }

    /**
     * Get MIME type from file extension
     */
    public static getMimeTypeFromExtension(filename: string): string {
        const extension = filename.toLowerCase().split('.').pop();
        
        const mimeTypes: { [key: string]: string } = {
            'pdf': 'application/pdf',
            'gpx': 'application/gpx+xml',
            'kml': 'application/vnd.google-earth.kml+xml',
            'kmz': 'application/vnd.google-earth.kmz',
            'txt': 'text/plain',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
            '7z': 'application/x-7z-compressed',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'bmp': 'image/bmp'
        };

        return mimeTypes[extension || ''] || 'application/octet-stream';
    }

    /**
     * Validate file track identifier
     */
    public static validateFileTrack(fileTrack: string): string {
        if (!fileTrack || typeof fileTrack !== 'string') {
            throw new ControlException('El identificador del archivo es obligatorio', 400);
        }

        const trimmed = fileTrack.trim();
        if (trimmed === '') {
            throw new ControlException('El identificador del archivo no puede estar vacío', 400);
        }

        // Sanitize to prevent path traversal
        const sanitized = trimmed.replace(/[^a-zA-Z0-9\-_]/g, '');
        if (sanitized !== trimmed) {
            throw new ControlException('El identificador del archivo contiene caracteres no válidos', 400);
        }

        // Check reasonable length
        if (sanitized.length < 10 || sanitized.length > 50) {
            throw new ControlException('El identificador del archivo tiene una longitud no válida', 400);
        }

        return sanitized;
    }
}

export default FileValidator;