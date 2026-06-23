import * as fs from 'fs';
import * as path from 'path';

// Tipos de evento alineados con el documento de diseño (design.md).
// Se mantienen también eventos adicionales útiles para auditoría ampliada.
export enum SecurityEventType {
    // Autenticación
    LOGIN_FAILED = 'LOGIN_FAILED',
    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
    ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
    // Token JWT
    TOKEN_INVALID = 'TOKEN_INVALID',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    // Autorización
    ACCESS_DENIED = 'ACCESS_DENIED',
    // Contraseña
    PASSWORD_CHANGED = 'PASSWORD_CHANGED',
    PASSWORD_RECOVERY_REQUESTED = 'PASSWORD_RECOVERY_REQUESTED',
    PASSWORD_RECOVERY_COMPLETED = 'PASSWORD_RECOVERY_COMPLETED',
    // Rate limiting
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export interface SecurityLogEntry {
    timestamp: string;       // ISO 8601
    event: SecurityEventType;
    username?: string;
    ip?: string;
    result: 'SUCCESS' | 'FAILURE';
    details?: Record<string, unknown>;
}

export default class SecurityLogger {
    private static logFilePath: string = path.join(process.cwd(), 'data', 'logs', 'security.log');

    private static ensureLogDirectory(): void {
        const dir = path.dirname(this.logFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private static formatEntry(entry: SecurityLogEntry): string {
        return JSON.stringify(entry) + '\n';
    }

    static log(entry: SecurityLogEntry): void {
        this.ensureLogDirectory();
        fs.appendFileSync(this.logFilePath, this.formatEntry(entry));
    }

    // --- Autenticación ---

    static logFailedLogin(ip: string, username: string, reason?: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.LOGIN_FAILED,
            username,
            ip,
            result: 'FAILURE',
            details: { reason },
        });
    }

    static logSuccessfulLogin(ip: string, username: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.LOGIN_SUCCESS,
            username,
            ip,
            result: 'SUCCESS',
        });
    }

    static logAccountLocked(ip: string, username: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.ACCOUNT_LOCKED,
            username,
            ip,
            result: 'FAILURE',
        });
    }

    // --- Token JWT ---

    static logTokenInvalid(ip: string, username?: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.TOKEN_INVALID,
            username,
            ip,
            result: 'FAILURE',
        });
    }

    static logTokenExpired(ip: string, username?: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.TOKEN_EXPIRED,
            username,
            ip,
            result: 'FAILURE',
        });
    }

    // --- Autorización ---

    static logAccessDenied(ip: string, username: string, resource: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.ACCESS_DENIED,
            username,
            ip,
            result: 'FAILURE',
            details: { resource },
        });
    }

    // --- Contraseña ---

    static logPasswordChanged(ip: string, username: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.PASSWORD_CHANGED,
            username,
            ip,
            result: 'SUCCESS',
        });
    }

    static logPasswordRecoveryRequested(ip: string, username: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.PASSWORD_RECOVERY_REQUESTED,
            username,
            ip,
            result: 'SUCCESS',
        });
    }

    static logPasswordRecoveryCompleted(ip: string, username: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.PASSWORD_RECOVERY_COMPLETED,
            username,
            ip,
            result: 'SUCCESS',
        });
    }

    // --- Rate Limiting ---

    static logRateLimitExceeded(ip: string, endpoint: string, username?: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.RATE_LIMIT_EXCEEDED,
            username,
            ip,
            result: 'FAILURE',
            details: { endpoint },
        });
    }
}
