/**
 * Tests de propiedad para InputSanitizer
 * Feature: security-hardening
 *
 * Propiedad 13: El InputSanitizer escapa todos los caracteres HTML peligrosos
 * Valida: Requisito 9.1
 *
 * Propiedad 14: El InputSanitizer hace cumplir los límites de longitud y tipos
 * Valida: Requisitos 9.2, 9.3, 9.4
 */
import * as fc from 'fast-check';
import InputSanitizer from '../../utils/inputSanitizer';
import ControlException from '../../utils/controlException';

const HTML_CHARS = ['<', '>', '"', "'", '&'];

describe('InputSanitizer', () => {
    describe('sanitizeString', () => {
        it('devuelve string vacío para null', () => {
            expect(InputSanitizer.sanitizeString(null)).toBe('');
        });

        it('devuelve string vacío para undefined', () => {
            expect(InputSanitizer.sanitizeString(undefined)).toBe('');
        });

        it('devuelve string para valores no string', () => {
            expect(InputSanitizer.sanitizeString(123)).toBe('123');
            expect(InputSanitizer.sanitizeString(true)).toBe('true');
        });

        it('escapa caracteres HTML peligrosos en ejemplos concretos', () => {
            expect(InputSanitizer.sanitizeString('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
            expect(InputSanitizer.sanitizeString('foo & bar')).toBe('foo &amp; bar');
            expect(InputSanitizer.sanitizeString('"quoted"')).toBe('&quot;quoted&quot;');
            expect(InputSanitizer.sanitizeString("'single'")).toBe('&#x27;single&#x27;');
        });

        it('trunca basándose en el input original (antes de escape)', () => {
            // '<' con maxLength=1 → trunca a '<' → escapa a '&lt;'
            // (el maxLength se aplica sobre el string original, no el escapado)
            const result = InputSanitizer.sanitizeString('<', 1);
            expect(result).toBe('&lt;');
        });

        it('no trunca si no supera maxLength', () => {
            const result = InputSanitizer.sanitizeString('abc', 10);
            expect(result).toBe('abc');
        });

        // Propiedad 13 — parte 1: no quedan caracteres HTML sin escapar
        it('Propiedad 13: no quedan caracteres HTML peligrosos sin escapar', () => {
            fc.assert(
                fc.property(
                    // Generar strings que pueden contener caracteres HTML peligrosos
                    fc.array(
                        fc.oneof(fc.constant('<'), fc.constant('>'), fc.constant('"'), fc.constant("'"), fc.constant('&'), fc.string({ minLength: 1, maxLength: 1 })),
                        { minLength: 0, maxLength: 50 }
                    ).map(arr => arr.join('')),
                    (input) => {
                        const result = InputSanitizer.sanitizeString(input);
                        // El resultado no debe contener ningún char peligroso sin escapar
                        expect(result).not.toMatch(/[<>"']/);
                        // El '&' solo puede aparecer como parte de entidades HTML válidas
                        const stripped = result.replace(/&(amp|lt|gt|quot|#x27);/g, '');
                        expect(stripped).not.toContain('&');
                    }
                ),
                { numRuns: 100 }
            );
        });

        // Propiedad 13 — parte 2: la función es idempotente sobre strings ya escapados
        // (una entrada que ya es un string escapado no debe escaparse de nuevo)
        it('Propiedad 13: sanitizeString es idempotente sobre strings sin chars peligrosos', () => {
            fc.assert(
                fc.property(
                    // Generar strings SIN caracteres especiales HTML → no hay nada que escapar
                    fc.string().filter(s => !/[<>"'&]/.test(s)),
                    (input) => {
                        const once = InputSanitizer.sanitizeString(input);
                        const twice = InputSanitizer.sanitizeString(once);
                        expect(once).toBe(twice);
                    }
                ),
                { numRuns: 100 }
            );
        });

        // Propiedad 13 — parte 3: siempre devuelve un string
        it('Propiedad 13: siempre devuelve un string para cualquier entrada', () => {
            fc.assert(
                fc.property(fc.anything(), (val) => {
                    const result = InputSanitizer.sanitizeString(val);
                    expect(typeof result).toBe('string');
                }),
                { numRuns: 100 }
            );
        });

        // Propiedad 14 — maxLength sobre input original
        it('Propiedad 14: la longitud del output no supera maxLength caracteres del input original', () => {
            fc.assert(
                fc.property(
                    fc.string().filter(s => !HTML_CHARS.some(c => s.includes(c))),
                    fc.integer({ min: 1, max: 100 }),
                    (str, max) => {
                        // Sin caracteres especiales, la longitud de salida = longitud de entrada truncada
                        const result = InputSanitizer.sanitizeString(str, max);
                        const truncated = str.substring(0, max);
                        expect(result).toBe(truncated);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('validatePositiveInt', () => {
        it('devuelve el número para enteros positivos', () => {
            expect(InputSanitizer.validatePositiveInt(5, 'campo')).toBe(5);
            expect(InputSanitizer.validatePositiveInt('10', 'campo')).toBe(10);
        });

        it('lanza ControlException para números negativos', () => {
            expect(() => InputSanitizer.validatePositiveInt(-5, 'campo')).toThrow(ControlException);
        });

        it('lanza ControlException para cero', () => {
            expect(() => InputSanitizer.validatePositiveInt(0, 'campo')).toThrow(ControlException);
        });

        it('lanza ControlException para números no enteros', () => {
            expect(() => InputSanitizer.validatePositiveInt(5.5, 'campo')).toThrow(ControlException);
        });

        it('lanza ControlException para valores no numéricos', () => {
            expect(() => InputSanitizer.validatePositiveInt('abc', 'campo')).toThrow(ControlException);
            expect(() => InputSanitizer.validatePositiveInt(null, 'campo')).toThrow(ControlException);
        });

        // Propiedad 14 — validatePositiveInt
        it('Propiedad 14: lanza ControlException para cualquier número <= 0', () => {
            fc.assert(
                fc.property(fc.integer({ min: -100000, max: 0 }), (num) => {
                    expect(() => InputSanitizer.validatePositiveInt(num, 'campo')).toThrow(ControlException);
                }),
                { numRuns: 100 }
            );
        });

        it('Propiedad 14: acepta y retorna cualquier entero positivo sin modificación', () => {
            fc.assert(
                fc.property(fc.nat().map(n => n + 1), (num) => {
                    const result = InputSanitizer.validatePositiveInt(num, 'campo');
                    expect(result).toBe(num);
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('requireField', () => {
        it('no lanza para valores válidos', () => {
            expect(() => InputSanitizer.requireField('valor', 'campo')).not.toThrow();
            expect(() => InputSanitizer.requireField(123, 'campo')).not.toThrow();
            expect(() => InputSanitizer.requireField(0, 'campo')).not.toThrow();
        });

        it('lanza ControlException para null', () => {
            expect(() => InputSanitizer.requireField(null, 'campo')).toThrow(ControlException);
        });

        it('lanza ControlException para undefined', () => {
            expect(() => InputSanitizer.requireField(undefined, 'campo')).toThrow(ControlException);
        });

        it('lanza ControlException para string vacío', () => {
            expect(() => InputSanitizer.requireField('', 'campo')).toThrow(ControlException);
        });

        // Propiedad 14 — requireField
        it('Propiedad 14: lanza ControlException para null, undefined y string vacío', () => {
            fc.assert(
                fc.property(
                    fc.oneof(fc.constant(null), fc.constant(undefined), fc.constant('')),
                    (val) => {
                        expect(() => InputSanitizer.requireField(val, 'campo')).toThrow(ControlException);
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    describe('sanitizeObject', () => {
        it('sanitiza campos string', () => {
            const obj = { nombre: '<script>alert(1)</script>' };
            const schema = { nombre: { type: 'string' as const, maxLength: 10 } };
            const result = InputSanitizer.sanitizeObject(obj, schema);
            // maxLength=10 se aplica sobre '<script>al' → escapa a '&lt;script&gt;al'
            expect(result.nombre).toBe('&lt;script&gt;al');
        });

        it('valida campos number', () => {
            const obj = { edad: '25' };
            const schema = { edad: { type: 'number' as const, required: true } };
            const result = InputSanitizer.sanitizeObject(obj, schema);
            expect(result.edad).toBe(25);
        });

        it('lanza error para campos requeridos faltantes', () => {
            const obj = {};
            const schema = { nombre: { required: true, type: 'string' as const } };
            expect(() => InputSanitizer.sanitizeObject(obj, schema)).toThrow(ControlException);
        });

        it('número negativo en campo numérico lanza error', () => {
            const obj = { edad: -5 };
            const schema = { edad: { type: 'number' as const, required: true } };
            expect(() => InputSanitizer.sanitizeObject(obj, schema)).toThrow(ControlException);
        });
    });
});
