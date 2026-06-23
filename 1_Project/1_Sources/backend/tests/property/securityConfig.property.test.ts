/**
 * Tests de propiedad para securityConfig.ts
 * Feature: security-hardening
 *
 * Propiedad 10: La validación de APP_SEED rechaza cualquier secreto débil en producción
 * Valida: Requisitos 6.1, 6.2, 6.3
 *
 * Propiedad 1: Validación de CORS es exhaustiva y correcta
 * Valida: Requisitos 1.1, 1.2
 */
import * as fc from 'fast-check';
import { validateAppSeed, getAllowedCorsOrigins } from '../../server/securityConfig';

// Helpers de generadores (fc.stringOf no existe en fast-check v4, se usa fc.array + join)
const letterChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const digitChars = '0123456789'.split('');
const specialChars = '!@#$%^*()_+-={}|;.<>?'.split('');
const alphanumChars = [...letterChars, ...digitChars];

function strOf(chars: string[], min: number, max: number) {
    return fc.array(fc.constantFrom(...chars), { minLength: min, maxLength: max })
        .map(arr => arr.join(''));
}

// ---------------------------------------------------------------------------
// Propiedad 10: La validación de APP_SEED rechaza cualquier secreto débil en producción
// ---------------------------------------------------------------------------
describe('validateAppSeed — Propiedad 10', () => {
    it('acepta en producción seeds que cumplen los tres criterios (longitud, letras, números, especiales)', () => {
        // Generar seeds fuertes garantizando todos los requisitos
        const strongSeed = fc.tuple(
            strOf(letterChars, 10, 15),
            strOf(digitChars, 5, 8),
            strOf(specialChars, 5, 8),
        ).map(([letters, digits, specials]) => {
            const combined = letters + digits + specials;
            // Garantizar longitud mínima de 32
            return combined.length >= 32 ? combined : (combined + combined).substring(0, 35);
        });

        fc.assert(
            fc.property(strongSeed, (seed) => {
                // Solo probar seeds que realmente cumplen todos los criterios
                if (
                    seed.length >= 32 &&
                    /[a-zA-Z]/.test(seed) &&
                    /[0-9]/.test(seed) &&
                    /[^a-zA-Z0-9]/.test(seed)
                ) {
                    expect(() => validateAppSeed(seed, 'production')).not.toThrow();
                }
            }),
            { numRuns: 100 }
        );
    });

    it('rechaza en producción seeds con longitud < 32', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 31 }),
                (seed) => {
                    expect(() => validateAppSeed(seed, 'production')).toThrow();
                }
            ),
            { numRuns: 100 }
        );
    });

    it('rechaza en producción seeds sin letras (solo alfanumérico-numérico y especiales)', () => {
        const noLettersSeed = fc.tuple(
            strOf(digitChars, 20, 25),
            strOf(specialChars, 12, 15),
        ).map(([d, s]) => d + s)
         .filter(seed => seed.length >= 32 && !/[a-zA-Z]/.test(seed));

        fc.assert(
            fc.property(noLettersSeed, (seed) => {
                expect(() => validateAppSeed(seed, 'production')).toThrow();
            }),
            { numRuns: 50 }
        );
    });

    it('rechaza en producción seeds sin dígitos', () => {
        const noDigitsSeed = fc.tuple(
            strOf(letterChars, 20, 25),
            strOf(specialChars, 12, 15),
        ).map(([l, s]) => l + s)
         .filter(seed => seed.length >= 32 && !/[0-9]/.test(seed));

        fc.assert(
            fc.property(noDigitsSeed, (seed) => {
                expect(() => validateAppSeed(seed, 'production')).toThrow();
            }),
            { numRuns: 50 }
        );
    });

    it('rechaza en producción seeds sin caracteres especiales', () => {
        const noSpecialsSeed = fc.tuple(
            strOf(letterChars, 20, 25),
            strOf(digitChars, 12, 15),
        ).map(([l, d]) => l + d)
         .filter(seed => seed.length >= 32 && !/[^a-zA-Z0-9]/.test(seed));

        fc.assert(
            fc.property(noSpecialsSeed, (seed) => {
                expect(() => validateAppSeed(seed, 'production')).toThrow();
            }),
            { numRuns: 50 }
        );
    });

    it('solo emite warn (no lanza) en desarrollo cuando la seed es débil', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        fc.assert(
            fc.property(fc.string({ minLength: 1, maxLength: 10 }), (seed) => {
                expect(() => validateAppSeed(seed, 'development')).not.toThrow();
            }),
            { numRuns: 50 }
        );
        warnSpy.mockRestore();
    });

    it('lanza en producción cuando la seed está vacía o undefined', () => {
        expect(() => validateAppSeed(undefined, 'production')).toThrow();
        expect(() => validateAppSeed('', 'production')).toThrow();
    });
});

// ---------------------------------------------------------------------------
// Propiedad 1: Validación de CORS es exhaustiva y correcta
// ---------------------------------------------------------------------------

/** Genera URLs simples de origen sin comas (que es el separador del formato) */
const safeOriginArb = fc.tuple(
    fc.constantFrom('http', 'https'),
    fc.domain(),
).map(([scheme, domain]) => `${scheme}://${domain}`);

describe('getAllowedCorsOrigins — Propiedad 1', () => {
    it('acepta exactamente los orígenes definidos (sin duplicar ni omitir)', () => {
        fc.assert(
            fc.property(
                fc.array(safeOriginArb, { minLength: 1, maxLength: 5 }),
                (origins) => {
                    const rawOrigins = origins.join(',');
                    const result = getAllowedCorsOrigins(rawOrigins, 'production');
                    origins.forEach(origin => {
                        expect(result).toContain(origin.trim());
                    });
                    expect(result.length).toBe(origins.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('parsea correctamente orígenes con espacios alrededor de comas', () => {
        fc.assert(
            fc.property(
                fc.array(safeOriginArb, { minLength: 1, maxLength: 4 }),
                (origins) => {
                    const rawOrigins = origins.map(o => ` ${o} `).join(',');
                    const result = getAllowedCorsOrigins(rawOrigins, 'development');
                    origins.forEach(origin => {
                        expect(result).toContain(origin.trim());
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    it('lanza en producción cuando no hay orígenes configurados', () => {
        expect(() => getAllowedCorsOrigins(undefined, 'production')).toThrow();
        expect(() => getAllowedCorsOrigins('', 'production')).toThrow();
    });

    it('devuelve localhost por defecto en desarrollo sin configuración', () => {
        const result = getAllowedCorsOrigins(undefined, 'development');
        expect(result).toContain('http://localhost:4200');
    });

    it('un origen en la lista no autoriza a otros', () => {
        fc.assert(
            fc.property(
                safeOriginArb,
                safeOriginArb,
                (allowed, notAllowed) => {
                    fc.pre(allowed !== notAllowed);
                    const result = getAllowedCorsOrigins(allowed, 'production');
                    // El origen no autorizado no debe aparecer en la lista
                    expect(result).not.toContain(notAllowed);
                }
            ),
            { numRuns: 100 }
        );
    });
});
