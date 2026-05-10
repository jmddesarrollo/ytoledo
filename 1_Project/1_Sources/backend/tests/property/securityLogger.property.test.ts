import * as fc from 'fast-check';

jest.mock('fs', () => ({
    existsSync: jest.fn(() => true),
    mkdirSync: jest.fn(),
    appendFileSync: jest.fn(),
}));

import SecurityLogger, { SecurityEventType, SecurityLogEntry } from '../../utils/securityLogger';

describe('SecurityLogger', () => {
    let appendFileSyncSpy: jest.SpyInstance;
    let existsSyncSpy: jest.SpyInstance;
    let mkdirSyncSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        appendFileSyncSpy = jest.spyOn(require('fs'), 'appendFileSync').mockImplementation(() => {});
        existsSyncSpy = jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
        mkdirSyncSpy = jest.spyOn(require('fs'), 'mkdirSync').mockImplementation(() => {});
    });

    afterEach(() => {
        appendFileSyncSpy.mockRestore();
        existsSyncSpy.mockRestore();
        mkdirSyncSpy.mockRestore();
    });

    describe('log', () => {
        it('Llama a fs.appendFileSync con formato JSON y todos los campos requeridos', () => {
            const entry: SecurityLogEntry = {
                timestamp: new Date().toISOString(),
                event: SecurityEventType.FAILED_LOGIN,
                username: 'user123',
                ip: '127.0.0.1',
                result: 'FAILURE',
                details: { reason: 'test' }
            };
            SecurityLogger.log(entry);
            expect(appendFileSyncSpy).toHaveBeenCalled();
            const call = appendFileSyncSpy.mock.calls[0];
            const logEntry = JSON.parse(call[1]);
            // Validar campos requeridos
            expect(typeof logEntry.timestamp).toBe('string');
            expect(Object.values(SecurityEventType)).toContain(logEntry.event);
            expect(['SUCCESS', 'FAILURE']).toContain(logEntry.result);
            expect(logEntry).toHaveProperty('details');
            expect(logEntry).toHaveProperty('ip');
        });

        it('Propiedad: genera entradas de log válidas con todos los campos', () => {
            return fc.assert(
                fc.property(
                    fc.constantFrom(
                        SecurityEventType.FAILED_LOGIN,
                        SecurityEventType.SUCCESSFUL_LOGIN,
                        SecurityEventType.SQL_INJECTION_ATTEMPT,
                        SecurityEventType.XSS_ATTEMPT,
                        SecurityEventType.INVALID_INPUT,
                        SecurityEventType.UNAUTHORIZED_ACCESS,
                        SecurityEventType.RATE_LIMIT_EXCEEDED,
                        SecurityEventType.SUSPICIOUS_ACTIVITY
                    ),
                    fc.constantFrom('SUCCESS', 'FAILURE'),
                    fc.string(),
                    fc.string(),
                    fc.string(),
                    (event, result, username, ip, reason) => {
                        const entry: SecurityLogEntry = {
                            timestamp: new Date().toISOString(),
                            event,
                            username,
                            ip,
                            result,
                            details: { reason }
                        };
                        SecurityLogger.log(entry);
                        expect(appendFileSyncSpy).toHaveBeenCalled();
                        const call = appendFileSyncSpy.mock.calls[0];
                        const logEntry = JSON.parse(call[1]);
                        // Validar campos requeridos
                        expect(typeof logEntry.timestamp).toBe('string');
                        // ISO 8601
                        expect(() => new Date(logEntry.timestamp)).not.toThrow();
                        expect(Object.values(SecurityEventType)).toContain(logEntry.event);
                        expect(['SUCCESS', 'FAILURE']).toContain(logEntry.result);
                        expect(logEntry).toHaveProperty('details');
                        expect(logEntry).toHaveProperty('ip');
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    describe('logFailedLogin', () => {
        it('Registra intento de login fallido', () => {
            SecurityLogger.logFailedLogin('192.168.1.1', 'admin', 'invalid password');
            const fs = require('fs');
            expect(fs.appendFileSync).toHaveBeenCalled();
        });

        it('Propiedad: acepta IPs válidas', () => {
            return fc.assert(
                fc.property(fc.ipV4(), fc.string(), (ip, username) => {
                    expect(() => {
                        SecurityLogger.logFailedLogin(ip, username);
                    }).not.toThrow();
                }),
                { numRuns: 30 }
            );
        });
    });

    describe('logSuccessfulLogin', () => {
        it('Registra login exitoso', () => {
            SecurityLogger.logSuccessfulLogin('192.168.1.1', 'user123');
            const fs = require('fs');
            expect(fs.appendFileSync).toHaveBeenCalled();
        });
    });

    describe('logSqlInjectionAttempt', () => {
        it('Registra intento de SQL injection', () => {
            SecurityLogger.logSqlInjectionAttempt('192.168.1.1', "' OR '1'='1");
            const fs = require('fs');
            expect(fs.appendFileSync).toHaveBeenCalled();
        });

        it('Propiedad: acepta cualquier payload', () => {
            return fc.assert(
                fc.property(fc.string(), fc.string(), (ip, payload) => {
                    expect(() => {
                        SecurityLogger.logSqlInjectionAttempt(ip, payload);
                    }).not.toThrow();
                }),
                { numRuns: 30 }
            );
        });
    });

    describe('logXssAttempt', () => {
        it('Registra intento de XSS', () => {
            SecurityLogger.logXssAttempt('192.168.1.1', '<script>alert(1)</script>');
            const fs = require('fs');
            expect(fs.appendFileSync).toHaveBeenCalled();
        });

        it('Propiedad: acepta cualquier payload', () => {
            return fc.assert(
                fc.property(fc.string(), fc.string(), (ip, payload) => {
                    expect(() => {
                        SecurityLogger.logXssAttempt(ip, payload);
                    }).not.toThrow();
                }),
                { numRuns: 30 }
            );
        });
    });

    describe('logInvalidInput', () => {
        it('Registra entrada inválida', () => {
            SecurityLogger.logInvalidInput('192.168.1.1', 'email', 'invalid-email');
            const fs = require('fs');
            expect(fs.appendFileSync).toHaveBeenCalled();
        });
    });

    describe('logUnauthorizedAccess', () => {
        it('Registra acceso no autorizado', () => {
            SecurityLogger.logUnauthorizedAccess('192.168.1.1', 'user123', '/admin');
            const fs = require('fs');
            expect(fs.appendFileSync).toHaveBeenCalled();
        });
    });

    describe('logRateLimitExceeded', () => {
        it('Registra rate limit excedido', () => {
            SecurityLogger.logRateLimitExceeded('192.168.1.1', '/api/users');
            const fs = require('fs');
            expect(fs.appendFileSync).toHaveBeenCalled();
        });
    });

    describe('logSuspiciousActivity', () => {
        it('Registra actividad sospechosa', () => {
            SecurityLogger.logSuspiciousActivity('192.168.1.1', 'Multiple failed attempts', { count: 5 });
            const fs = require('fs');
            expect(fs.appendFileSync).toHaveBeenCalled();
        });

        it('Propiedad: acepta detalles opcionales', () => {
            return fc.assert(
                fc.property(fc.string(), fc.string(), (ip, desc) => {
                    expect(() => {
                        SecurityLogger.logSuspiciousActivity(ip, desc);
                    }).not.toThrow();
                    expect(() => {
                        SecurityLogger.logSuspiciousActivity(ip, desc, { extra: 'data' });
                    }).not.toThrow();
                }),
                { numRuns: 30 }
            );
        });
    });
});