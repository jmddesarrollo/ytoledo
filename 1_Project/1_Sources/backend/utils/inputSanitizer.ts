import ControlException from './controlException';

export default class InputSanitizer {
    static sanitizeString(value: unknown, maxLength?: number): string {
        if (value === null || value === undefined) {
            return '';
        }
        let str: string;
        try {
            str = String(value);
        } catch {
            // Si String falla (por ejemplo, toString inválido), intentar JSON.stringify
            try {
                str = JSON.stringify(value);
            } catch {
                str = '';
            }
        }
        if (typeof str !== 'string') {
            str = '';
        }
        // Truncar ANTES de escapar para que maxLength se refiera al input original,
        // evitando que entidades HTML queden partidas a mitad (ej. "&lt" en lugar de "&lt;")
        if (maxLength && str.length > maxLength) {
            str = str.substring(0, maxLength);
        }
        str = str.replace(/&/g, '&amp;');
        str = str.replace(/</g, '&lt;');
        str = str.replace(/>/g, '&gt;');
        str = str.replace(/"/g, '&quot;');
        str = str.replace(/'/g, '&#x27;');
        return str;
    }

    static validatePositiveInt(value: unknown, fieldName: string): number {
        const num = Number(value);
        if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
            throw new ControlException(`El campo ${fieldName} debe ser un número entero positivo`, 400);
        }
        return num;
    }

    static requireField(value: unknown, fieldName: string): void {
        if (value === null || value === undefined || value === '') {
            throw new ControlException(`El campo ${fieldName} es requerido`, 400);
        }
    }

    static sanitizeObject(obj: Record<string, unknown>, schema: Record<string, { maxLength?: number; required?: boolean; type?: 'string' | 'number' }>): Record<string, unknown> {
        const sanitized: Record<string, unknown> = {};
        for (const key in schema) {
            const field = schema[key];
            const value = obj[key];
            if (field.required) {
                this.requireField(value, key);
            }
            if (value !== null && value !== undefined) {
                if (field.type === 'number') {
                    sanitized[key] = this.validatePositiveInt(value, key);
                } else {
                    sanitized[key] = this.sanitizeString(value, field.maxLength);
                }
            }
        }
        return sanitized;
    }
}