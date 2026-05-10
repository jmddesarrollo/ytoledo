import * as fs from 'fs';
import * as path from 'path';


export enum SecurityEventType {
    FAILED_LOGIN = 'FAILED_LOGIN',
    SUCCESSFUL_LOGIN = 'SUCCESSFUL_LOGIN',
    SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
    XSS_ATTEMPT = 'XSS_ATTEMPT',
    INVALID_INPUT = 'INVALID_INPUT',
    UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}


export interface SecurityLogEntry {
    timestamp: string;
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

    static logFailedLogin(ip: string, username: string, reason?: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.FAILED_LOGIN,
            username,
            ip,
            result: 'FAILURE',
            details: { reason }
        });
    }

    static logSuccessfulLogin(ip: string, username: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.SUCCESSFUL_LOGIN,
            username,
            ip,
            result: 'SUCCESS',
            details: {}
        });
    }

    static logSqlInjectionAttempt(ip: string, payload: string, username?: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.SQL_INJECTION_ATTEMPT,
            username,
            ip,
            result: 'FAILURE',
            details: { payload }
        });
    }

    static logXssAttempt(ip: string, payload: string, username?: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.XSS_ATTEMPT,
            username,
            ip,
            result: 'FAILURE',
            details: { payload }
        });
    }

    static logInvalidInput(ip: string, field: string, value: string, username?: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.INVALID_INPUT,
            username,
            ip,
            result: 'FAILURE',
            details: { field, value: value.substring(0, 100) }
        });
    }

    static logUnauthorizedAccess(ip: string, username: string, resource: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.UNAUTHORIZED_ACCESS,
            username,
            ip,
            result: 'FAILURE',
            details: { resource }
        });
    }

    static logRateLimitExceeded(ip: string, endpoint: string, username?: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.RATE_LIMIT_EXCEEDED,
            username,
            ip,
            result: 'FAILURE',
            details: { endpoint }
        });
    }

    static logSuspiciousActivity(ip: string, description: string, details?: Record<string, unknown>, username?: string, result: 'SUCCESS' | 'FAILURE' = 'FAILURE'): void {
        this.log({
            timestamp: new Date().toISOString(),
            event: SecurityEventType.SUSPICIOUS_ACTIVITY,
            username,
            ip,
            result,
            details: { description, ...details }
        });
    }
}