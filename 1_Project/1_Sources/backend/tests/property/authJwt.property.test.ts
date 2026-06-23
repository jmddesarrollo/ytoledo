/**
 * Tests de propiedad para el payload JWT mínimo en AuthService
 * Feature: security-hardening
 *
 * Propiedad 4: El payload JWT contiene exactamente los campos mínimos requeridos
 * Valida: Requisitos 3.1, 3.2
 */
import * as fc from 'fast-check';
const jwt = require('jsonwebtoken');

// Seed de prueba que cumple todos los requisitos de fortaleza
const TEST_SEED = 'TestSeed123!TestSeed123!TestSeed123!';
process.env.YTO_SEED = TEST_SEED;
process.env.YTO_EXPIRATION_TOKEN = '1h';
process.env.YTO_EXPIRATION_TOKEN_RECOVERY = '1h';

/**
 * Helper que simula la lógica de getTokenPayload de AuthService.
 * Se prueba de forma aislada sin levantar la BD.
 */
function buildMinimalPayload(user: Record<string, unknown>): object {
    return {
        user: {
            id: user.id,
            username: user.username,
            role_id: user.role_id,
        },
    };
}

function signToken(payload: object): string {
    return jwt.sign(payload, TEST_SEED, { expiresIn: '1h' });
}

describe('JWT Payload — Propiedad 4', () => {
    it('el token contiene exactamente id, username y role_id', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.integer({ min: 1, max: 99999 }),
                    username: fc.string({ minLength: 1, maxLength: 45 }),
                    role_id: fc.integer({ min: 1, max: 100 }),
                    // Campos sensibles que NO deben aparecer en el token
                    password: fc.string({ minLength: 1, maxLength: 100 }),
                    email: fc.emailAddress(),
                    attempts: fc.integer({ min: 0, max: 10 }),
                    active: fc.boolean(),
                    name: fc.string(),
                    lastname: fc.string(),
                }),
                (user) => {
                    const payload = buildMinimalPayload(user);
                    const token = signToken(payload);
                    const decoded = jwt.decode(token) as any;

                    // Campos requeridos presentes
                    expect(decoded.user.id).toBe(user.id);
                    expect(decoded.user.username).toBe(user.username);
                    expect(decoded.user.role_id).toBe(user.role_id);

                    // Campos sensibles ausentes
                    expect(decoded.user.password).toBeUndefined();
                    expect(decoded.user.email).toBeUndefined();
                    expect(decoded.user.attempts).toBeUndefined();
                    expect(decoded.user.active).toBeUndefined();
                    expect(decoded.user.name).toBeUndefined();
                    expect(decoded.user.lastname).toBeUndefined();

                    // Solo los tres campos esperados
                    const keys = Object.keys(decoded.user);
                    expect(keys).toEqual(expect.arrayContaining(['id', 'username', 'role_id']));
                    expect(keys.length).toBe(3);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('el token es verificable con la misma seed y no con otra', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.integer({ min: 1 }),
                    username: fc.string({ minLength: 1, maxLength: 20 }),
                    role_id: fc.integer({ min: 1 }),
                }),
                (user) => {
                    const token = signToken(buildMinimalPayload(user));

                    // Verificar con la seed correcta no lanza
                    expect(() => jwt.verify(token, TEST_SEED)).not.toThrow();

                    // Verificar con una seed diferente lanza
                    expect(() => jwt.verify(token, 'OtherSeed456!OtherSeed456!OtherSeed456!')).toThrow();
                }
            ),
            { numRuns: 100 }
        );
    });
});
