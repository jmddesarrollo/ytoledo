import * as fc from 'fast-check';
import InputSanitizer from '../../utils/inputSanitizer';
import ControlException from '../../utils/controlException';

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

        it('escapa caracteres HTML', () => {
            expect(InputSanitizer.sanitizeString('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
            expect(InputSanitizer.sanitizeString('foo & bar')).toBe('foo &amp; bar');
            expect(InputSanitizer.sanitizeString('"quoted"')).toBe('&quot;quoted&quot;');
            expect(InputSanitizer.sanitizeString("'single'")).toBe('&#x27;single&#x27;');
        });

        it('trunca si supera maxLength', () => {
            const result = InputSanitizer.sanitizeString('abcdefghij', 5);
            expect(result).toBe('abcde');
            expect(result.length).toBe(5);
        });

        it('no trunca si no supera maxLength', () => {
            const result = InputSanitizer.sanitizeString('abc', 10);
            expect(result).toBe('abc');
        });

        it('propiedad: siempre devuelve un string', (): Property => {
            return fc.assert(
                fc.property(fc.anything(), (val) => {
                    const result = InputSanitizer.sanitizeString(val);
                    expect(typeof result).toBe('string');
                }),
                { numRuns: 100 }
            );
        });

        it('propiedad: maxLength siempre se respeta', (): Property => {
            return fc.assert(
                fc.property(fc.string(), fc.integer({ min: 1, max: 100 }), (str, max) => {
                    const result = InputSanitizer.sanitizeString(str, max);
                    expect(result.length).toBeLessThanOrEqual(max);
                }),
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

        it('propiedad: lanza error para números <= 0', (): Property => {
            return fc.assert(
                fc.property(fc.integer(), (num) => {
                    if (num <= 0) {
                        expect(() => InputSanitizer.validatePositiveInt(num, 'campo')).toThrow(ControlException);
                    }
                }),
                { numRuns: 100 }
            );
        });

        it('propiedad: acepta números positivos', (): Property => {
            return fc.assert(
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

        it('propiedad: lanza error para valores vacíos', (): Property => {
            return fc.assert(
                fc.property(fc.oneof(fc.constant(null), fc.constant(undefined), fc.constant('')), (val) => {
                    expect(() => InputSanitizer.requireField(val, 'campo')).toThrow(ControlException);
                }),
                { numRuns: 50 }
            );
        });
    });

    describe('sanitizeObject', () => {
        it('sanitiza campos string', () => {
            const obj = { nombre: '<script>alert(1)</script>' };
            const schema = { nombre: { type: 'string' as const, maxLength: 10 } };
            const result = InputSanitizer.sanitizeObject(obj, schema);
            expect(result.nombre).toBe('&lt;script');
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

        it('sanitiza número negativo lanza error', () => {
            const obj = { edad: -5 };
            const schema = { edad: { type: 'number' as const, required: true } };
            expect(() => InputSanitizer.sanitizeObject(obj, schema)).toThrow(ControlException);
        });
    });
});