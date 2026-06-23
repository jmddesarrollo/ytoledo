/**
 * Tests de propiedad para rateLimiter.ts
 * Feature: security-hardening
 */
import * as fc from 'fast-check';
import RateLimiter from '../../server/rateLimiter';

// ---------------------------------------------------------------------------
// Propiedad 2: El contador de rate limiting refleja fielmente los eventos recibidos
// Valida: Requisitos 2.1, 2.2
// ---------------------------------------------------------------------------
describe('RateLimiter — Propiedad 2', () => {
    beforeEach(() => {
        // Configurar límites altos para aislar la lógica del contador
        process.env.APP_RATE_LIMIT_MAX_EVENTS = '1000';
        process.env.APP_RATE_LIMIT_WINDOW_MS = '60000';
        process.env.APP_RATE_LIMIT_LOGIN_MAX = '500';
        process.env.APP_RATE_LIMIT_LOGIN_WINDOW_MS = '60000';
    });

    it('checkLimit retorna true para los primeros maxEvents eventos dentro de la ventana', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 20 }),
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.string({ minLength: 1, maxLength: 20 }),
                (n, socketId, eventName) => {
                    const limiter = new RateLimiter();
                    let allWithinLimit = true;
                    for (let i = 0; i < n; i++) {
                        const result = limiter.checkLimit(socketId, eventName);
                        if (!result) {
                            allWithinLimit = false;
                        }
                    }
                    // Con límite de 1000, n eventos (n <= 20) deben estar todos dentro
                    expect(allWithinLimit).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('checkLimit retorna false exactamente cuando se supera el límite configurado', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10 }),
                (maxEvents) => {
                    process.env.APP_RATE_LIMIT_MAX_EVENTS = String(maxEvents);
                    const limiter = new RateLimiter();
                    const socketId = 'test-socket-' + maxEvents;
                    const eventName = 'test/event';

                    // Los primeros maxEvents deben pasar
                    for (let i = 0; i < maxEvents; i++) {
                        expect(limiter.checkLimit(socketId, eventName)).toBe(true);
                    }
                    // El siguiente debe fallar
                    expect(limiter.checkLimit(socketId, eventName)).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('el contador se reinicia al expirar la ventana de tiempo', () => {
        // Ventana de 1ms para que expire inmediatamente
        process.env.APP_RATE_LIMIT_MAX_EVENTS = '1';
        process.env.APP_RATE_LIMIT_WINDOW_MS = '1';
        const limiter = new RateLimiter();
        const socketId = 'reset-socket';
        const eventName = 'any/event';

        // Primer evento: dentro del límite
        expect(limiter.checkLimit(socketId, eventName)).toBe(true);
        // Segundo evento: supera el límite
        expect(limiter.checkLimit(socketId, eventName)).toBe(false);

        // Esperar a que expire la ventana
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                // Después de que expire, debe permitir de nuevo
                expect(limiter.checkLimit(socketId, eventName)).toBe(true);
                resolve();
            }, 10);
        });
    });

    it('clearSocket elimina las entradas del socket desconectado', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
                (socketId, eventNames) => {
                    process.env.APP_RATE_LIMIT_MAX_EVENTS = '1000';
                    const limiter = new RateLimiter();

                    // Registrar varios eventos
                    eventNames.forEach(ev => limiter.checkLimit(socketId, ev));

                    // Limpiar el socket
                    limiter.clearSocket(socketId);

                    // Después de limpiar, el contador debe reiniciarse
                    // (el primer evento vuelve a estar dentro del límite)
                    eventNames.forEach(ev => {
                        expect(limiter.checkLimit(socketId, ev)).toBe(true);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ---------------------------------------------------------------------------
// Propiedad 3: El límite de login es siempre más restrictivo que el límite general
// Valida: Requisito 2.3
// ---------------------------------------------------------------------------
describe('RateLimiter — Propiedad 3', () => {
    it('el límite de auth/login es siempre <= límite general para cualquier configuración válida', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 1000 }),  // general max
                fc.integer({ min: 1, max: 1000 }),  // login max
                (generalMax, loginMax) => {
                    // La propiedad que se debe cumplir en el sistema:
                    // el límite de login debe ser configurado <= límite general.
                    // Verificamos que dado un general max >= login max, el sistema
                    // bloquea login antes que los eventos generales.
                    const effectiveLoginMax = Math.min(loginMax, generalMax);

                    process.env.APP_RATE_LIMIT_MAX_EVENTS = String(generalMax);
                    process.env.APP_RATE_LIMIT_WINDOW_MS = '60000';
                    process.env.APP_RATE_LIMIT_LOGIN_MAX = String(effectiveLoginMax);
                    process.env.APP_RATE_LIMIT_LOGIN_WINDOW_MS = '60000';

                    const limiter = new RateLimiter();
                    const socketId = 'prop3-socket';

                    // Consumir hasta el límite de login
                    for (let i = 0; i < effectiveLoginMax; i++) {
                        limiter.checkLimit(socketId, 'auth/login');
                    }

                    // El siguiente intento de login debe fallar
                    const loginBlocked = !limiter.checkLimit(socketId, 'auth/login');

                    // Los eventos generales aún deben estar dentro del límite (si generalMax > effectiveLoginMax)
                    const generalAllowed = limiter.checkLimit(socketId, 'other/event');

                    expect(loginBlocked).toBe(true);
                    expect(generalAllowed).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });
});
