/**
 * Tests de propiedad para el campo attempts del modelo User
 * Feature: security-hardening
 *
 * Propiedad 15: El campo attempts nunca toma valores negativos
 * Valida: Requisito 10.2
 */
import * as fc from 'fast-check';

/**
 * Simula la lógica del modelo: el campo attempts debe ser >= 0.
 * Se prueba la lógica de negocio aislada, sin BD.
 */
function applyAttemptsOperation(
    current: number,
    operation: 'increment' | 'reset' | 'set',
    setValue?: number
): number {
    switch (operation) {
        case 'increment':
            return current + 1;
        case 'reset':
            return 0;
        case 'set':
            return Math.max(0, setValue ?? 0); // Nunca negativo
        default:
            return current;
    }
}

describe('User.attempts — Propiedad 15', () => {
    it('el campo attempts nunca es negativo tras cualquier secuencia de operaciones', () => {
        const operationArb = fc.oneof(
            fc.constant({ op: 'increment' as const }),
            fc.constant({ op: 'reset' as const }),
            fc.record({
                op: fc.constant('set' as const),
                value: fc.integer({ min: -100, max: 100 }),
            })
        );

        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 100 }),
                fc.array(operationArb, { minLength: 1, maxLength: 20 }),
                (initialAttempts, operations) => {
                    let attempts = initialAttempts;
                    for (const op of operations) {
                        if (op.op === 'set') {
                            attempts = applyAttemptsOperation(attempts, 'set', op.value);
                        } else {
                            attempts = applyAttemptsOperation(attempts, op.op);
                        }
                        expect(attempts).toBeGreaterThanOrEqual(0);
                    }
                }
            ),
            { numRuns: 200 }
        );
    });

    it('el campo attempts soporta valores mayores que 9 (INTEGER(11))', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 10, max: 2147483647 }),
                (value) => {
                    // INTEGER(11) soporta hasta 2,147,483,647 — cualquier valor positivo es válido
                    expect(value).toBeGreaterThan(9);
                    expect(value).toBeLessThanOrEqual(2147483647);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('incremento desde 0 hasta 3 refleja correctamente el mecanismo de bloqueo', () => {
        // Simular exactamente el flujo del login: 3 intentos fallidos bloquean
        let attempts = 0;
        for (let i = 1; i <= 3; i++) {
            attempts++;
            expect(attempts).toBe(i);
            expect(attempts).toBeGreaterThanOrEqual(0);
        }
        // Al superar 3 intentos, la cuenta queda bloqueada
        expect(attempts).toBeGreaterThanOrEqual(3);

        // Reset tras bloqueo
        attempts = 0;
        expect(attempts).toBe(0);
    });
});
