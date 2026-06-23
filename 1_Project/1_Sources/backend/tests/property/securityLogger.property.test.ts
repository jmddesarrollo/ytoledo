/**
 * Tests de propiedad para SecurityLogger
 * Feature: security-hardening
 *
 * Propiedad 12: Cada entrada del SecurityLogger contiene todos los campos requeridos
 * Valida: Requisitos 8.1, 8.8
 */
import * as fc from 'fast-check';

// Mock declarado una sola vez a nivel de módulo — evita el doble-wrapping con spyOn
const mockAppendFileSync = jest.fn();
const mockExistsSync = jest.fn(() => true);
const mockMkdirSync = jest.fn();

jest.mock('fs', () => ({
    existsSync: (...args: unknown[]) => mockExistsSync(...args),
    mkdirSync: (...args: unknown[]) => mockMkdirSync(...args),
    appendFileSync: (...args: unknown[]) => mockAppendFileSync(...args),
}));

import SecurityLogger, { SecurityEventType, SecurityLogEntry } from '../../utils/securityLogger';

const ALL_EVENT_TYPES = Object.values(SecurityEventType);

/** Extrae y parsea el JSON escrito en la última llamada a appendFileSync */
function getLastLogEntry(): Record<string, unknown> {
    const calls = mockAppendFileSync.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    return JSON.parse(calls[calls.length - 1][1]);
}

/** Verifica que una entrada tiene todos los campos obligatorios válidos */
function assertValidEntry(entry: Record<string, unknown>): void {
    // timestamp ISO 8601 válido y parseable como fecha real
    expect(typeof entry.timestamp).toBe('string');
    const date = new Date(entry.timestamp as string);
    expect(isNaN(date.getTime())).toBe(false);
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    // event debe ser un SecurityEventType válido
    expect(ALL_EVENT_TYPES).toContain(entry.event);

    // result debe ser SUCCESS o FAILURE
    expect(['SUCCESS', 'FAILURE']).toContain(entry.result);
}

describe('SecurityLogger', () => {
    beforeEach(() => {
        mockAppendFileSync.mockClear();
        mockExistsSync.mockClear();
        mockMkdirSync.mockClear();
    });

    // Propiedad 12 — campos requeridos en todas las entradas
    describe('Propiedad 12: cada entrada contiene todos los campos requeridos', () => {
        it('log() escribe una entrada JSON con campos obligatorios válidos', () => {
            const entry: SecurityLogEntry = {
                timestamp: new Date().toISOString(),
                event: SecurityEventType.LOGIN_FAILED,
                username: 'user123',
                ip: '127.0.0.1',
                result: 'FAILURE',
            };
            SecurityLogger.log(entry);
            assertValidEntry(getLastLogEntry());
        });

        it('Propiedad 12: para cualquier tipo de evento y resultado, la entrada es válida', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...ALL_EVENT_TYPES),
                    fc.constantFrom<'SUCCESS' | 'FAILURE'>('SUCCESS', 'FAILURE'),
                    fc.string({ minLength: 1, maxLength: 30 }),
                    fc.ipV4(),
                    (event, result, username, ip) => {
                        mockAppendFileSync.mockClear();
                        SecurityLogger.log({
                            timestamp: new Date().toISOString(),
                            event,
                            username,
                            ip,
                            result,
                        });
                        assertValidEntry(getLastLogEntry());
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('logFailedLogin', () => {
        it('registra un intento de login fallido con LOGIN_FAILED', () => {
            SecurityLogger.logFailedLogin('192.168.1.1', 'admin', 'contraseña incorrecta');
            const entry = getLastLogEntry();
            expect(entry.event).toBe(SecurityEventType.LOGIN_FAILED);
            expect(entry.result).toBe('FAILURE');
            expect(entry.username).toBe('admin');
            expect(entry.ip).toBe('192.168.1.1');
            assertValidEntry(entry);
        });

        it('Propiedad: acepta cualquier IP y username sin lanzar', () => {
            fc.assert(
                fc.property(fc.ipV4(), fc.string(), (ip, username) => {
                    expect(() => SecurityLogger.logFailedLogin(ip, username)).not.toThrow();
                }),
                { numRuns: 50 }
            );
        });
    });

    describe('logSuccessfulLogin', () => {
        it('registra un login exitoso con LOGIN_SUCCESS', () => {
            SecurityLogger.logSuccessfulLogin('10.0.0.1', 'user123');
            const entry = getLastLogEntry();
            expect(entry.event).toBe(SecurityEventType.LOGIN_SUCCESS);
            expect(entry.result).toBe('SUCCESS');
            assertValidEntry(entry);
        });
    });

    describe('logAccountLocked', () => {
        it('registra el bloqueo de cuenta con ACCOUNT_LOCKED', () => {
            SecurityLogger.logAccountLocked('10.0.0.1', 'user123');
            const entry = getLastLogEntry();
            expect(entry.event).toBe(SecurityEventType.ACCOUNT_LOCKED);
            expect(entry.result).toBe('FAILURE');
            assertValidEntry(entry);
        });
    });

    describe('logTokenInvalid', () => {
        it('registra token inválido con TOKEN_INVALID', () => {
            SecurityLogger.logTokenInvalid('192.168.1.1');
            const entry = getLastLogEntry();
            expect(entry.event).toBe(SecurityEventType.TOKEN_INVALID);
            expect(entry.result).toBe('FAILURE');
            assertValidEntry(entry);
        });
    });

    describe('logTokenExpired', () => {
        it('registra token expirado con TOKEN_EXPIRED', () => {
            SecurityLogger.logTokenExpired('192.168.1.1', 'user');
            const entry = getLastLogEntry();
            expect(entry.event).toBe(SecurityEventType.TOKEN_EXPIRED);
            expect(entry.result).toBe('FAILURE');
            assertValidEntry(entry);
        });
    });

    describe('logAccessDenied', () => {
        it('registra acceso denegado con ACCESS_DENIED', () => {
            SecurityLogger.logAccessDenied('192.168.1.1', 'user123', 'admin/users');
            const entry = getLastLogEntry();
            expect(entry.event).toBe(SecurityEventType.ACCESS_DENIED);
            expect(entry.result).toBe('FAILURE');
            assertValidEntry(entry);
        });
    });

    describe('logPasswordChanged', () => {
        it('registra cambio de contraseña con PASSWORD_CHANGED', () => {
            SecurityLogger.logPasswordChanged('192.168.1.1', 'user123');
            const entry = getLastLogEntry();
            expect(entry.event).toBe(SecurityEventType.PASSWORD_CHANGED);
            expect(entry.result).toBe('SUCCESS');
            assertValidEntry(entry);
        });
    });

    describe('logPasswordRecoveryRequested / logPasswordRecoveryCompleted', () => {
        it('registra solicitud de recuperación con PASSWORD_RECOVERY_REQUESTED', () => {
            SecurityLogger.logPasswordRecoveryRequested('192.168.1.1', 'user');
            const entry = getLastLogEntry();
            expect(entry.event).toBe(SecurityEventType.PASSWORD_RECOVERY_REQUESTED);
            expect(entry.result).toBe('SUCCESS');
            assertValidEntry(entry);
        });

        it('registra completado de recuperación con PASSWORD_RECOVERY_COMPLETED', () => {
            SecurityLogger.logPasswordRecoveryCompleted('192.168.1.1', 'user');
            const entry = getLastLogEntry();
            expect(entry.event).toBe(SecurityEventType.PASSWORD_RECOVERY_COMPLETED);
            expect(entry.result).toBe('SUCCESS');
            assertValidEntry(entry);
        });
    });

    describe('logRateLimitExceeded', () => {
        it('registra rate limit excedido con RATE_LIMIT_EXCEEDED', () => {
            SecurityLogger.logRateLimitExceeded('192.168.1.1', 'auth/login');
            const entry = getLastLogEntry();
            expect(entry.event).toBe(SecurityEventType.RATE_LIMIT_EXCEEDED);
            expect(entry.result).toBe('FAILURE');
            assertValidEntry(entry);
        });
    });
});
