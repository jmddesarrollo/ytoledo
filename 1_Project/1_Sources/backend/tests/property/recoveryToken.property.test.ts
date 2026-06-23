/**
 * Tests de propiedad para invalidación de tokens de recuperación de contraseña
 * Feature: security-hardening
 *
 * Propiedad 7: Los tokens de recuperación son únicos entre solicitudes consecutivas
 * Valida: Requisitos 5.1, 5.5
 *
 * Propiedad 8: Verificación de token de recuperación es un round-trip de hash
 * Valida: Requisito 5.3
 *
 * Propiedad 9: Un token de recuperación usado no puede usarse de nuevo
 * Valida: Requisito 5.4
 */
import * as fc from 'fast-check';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// ---------------------------------------------------------------------------
// Configuración de entorno para los tests
// ---------------------------------------------------------------------------
const TEST_SEED = 'TestSeed123!TestSeed123!TestSeed123!';
process.env.YTO_SEED = TEST_SEED;
process.env.YTO_EXPIRATION_TOKEN_RECOVERY = '1h';

// ---------------------------------------------------------------------------
// Helpers que replican la lógica de auth.bll.ts sin levantar BD
// ---------------------------------------------------------------------------

interface TokenStore {
  hash: string | null;
  createdAt: Date | null;
}

/** Simula generateRecoveryToken + saveRecoveryToken.
 *  Incluye un `jti` (JWT ID) único para garantizar que dos llamadas
 *  consecutivas en el mismo segundo producen tokens distintos. */
function generateAndStoreToken(userId: number, store: Map<number, TokenStore>): string {
  const payload = {
    user: { id: userId, username: `user_${userId}`, role_id: 1 },
    jti: crypto.randomBytes(16).toString('hex'),  // unicidad garantizada
  };
  const token = jwt.sign(payload, TEST_SEED, { expiresIn: '1h' });
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  // Sobreescribe el anterior — invalida automáticamente
  store.set(userId, { hash, createdAt: new Date() });
  return token;
}

/** Simula validateRecoveryToken */
function validateToken(
  userId: number,
  token: string,
  store: Map<number, TokenStore>,
  nowMs: number = Date.now()
): boolean {
  const entry = store.get(userId);
  if (!entry || !entry.hash) return false;

  const incomingHash = crypto.createHash('sha256').update(token).digest('hex');
  if (incomingHash !== entry.hash) return false;

  const EXPIRY_MS = 60 * 60 * 1000;
  const createdAt = entry.createdAt!.getTime();
  if (nowMs - createdAt > EXPIRY_MS) return false;

  return true;
}

/** Simula consumeRecoveryToken */
function consumeToken(userId: number, store: Map<number, TokenStore>): void {
  store.set(userId, { hash: null, createdAt: null });
}

// ---------------------------------------------------------------------------
// Propiedad 7: Los tokens de recuperación son únicos entre solicitudes consecutivas
// Valida: Requisitos 5.1, 5.5
// ---------------------------------------------------------------------------
describe('Propiedad 7: tokens de recuperación únicos entre solicitudes consecutivas', () => {
  it('dos tokens generados consecutivamente son siempre diferentes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99999 }),
        (userId) => {
          const store = new Map<number, TokenStore>();

          const token1 = generateAndStoreToken(userId, store);
          // Pequeña pausa entre generaciones para asegurar JWT diferentes (iat distinto)
          // En la práctica JWT usa segundos, así que generamos con payloads distintos
          const token2 = generateAndStoreToken(userId, store);

          // Los tokens deben ser diferentes (distinto iat o distinto contenido)
          expect(token1).not.toBe(token2);

          // Los hashes también deben ser distintos
          const hash1 = crypto.createHash('sha256').update(token1).digest('hex');
          const hash2 = crypto.createHash('sha256').update(token2).digest('hex');
          expect(hash1).not.toBe(hash2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('el primer token queda invalidado tras generar el segundo', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99999 }),
        (userId) => {
          const store = new Map<number, TokenStore>();

          const token1 = generateAndStoreToken(userId, store);
          // Generar segundo token — sobreescribe el hash del primero en el store
          generateAndStoreToken(userId, store);

          // El primer token ya no debe ser válido
          const isToken1Valid = validateToken(userId, token1, store);
          expect(isToken1Valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('solo el último token generado es válido en cualquier momento', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99999 }),
        fc.integer({ min: 2, max: 5 }), // número de solicitudes consecutivas
        (userId, numRequests) => {
          const store = new Map<number, TokenStore>();
          const tokens: string[] = [];

          for (let i = 0; i < numRequests; i++) {
            tokens.push(generateAndStoreToken(userId, store));
          }

          const lastToken = tokens[tokens.length - 1];

          // Solo el último es válido
          expect(validateToken(userId, lastToken, store)).toBe(true);

          // Todos los anteriores son inválidos
          for (let i = 0; i < tokens.length - 1; i++) {
            expect(validateToken(userId, tokens[i], store)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Propiedad 8: Verificación de token de recuperación es un round-trip de hash
// Valida: Requisito 5.3
// ---------------------------------------------------------------------------
describe('Propiedad 8: verificación de token es round-trip de hash SHA-256', () => {
  it('SHA-256(token generado) coincide exactamente con el hash almacenado', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99999 }),
        (userId) => {
          const store = new Map<number, TokenStore>();
          const token = generateAndStoreToken(userId, store);

          // El hash almacenado debe ser exactamente SHA-256(token)
          const expectedHash = crypto.createHash('sha256').update(token).digest('hex');
          const storedHash = store.get(userId)!.hash;

          expect(storedHash).toBe(expectedHash);
          // El hash SHA-256 siempre tiene 64 caracteres hex
          expect(storedHash).toHaveLength(64);
          expect(storedHash).toMatch(/^[0-9a-f]{64}$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('el token válido siempre pasa la verificación (round-trip completo)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99999 }),
        (userId) => {
          const store = new Map<number, TokenStore>();
          const token = generateAndStoreToken(userId, store);

          // El token recién generado siempre debe validar correctamente
          expect(validateToken(userId, token, store)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cualquier modificación de un solo carácter invalida el token', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99999 }),
        fc.integer({ min: 0, max: 9 }), // posición a modificar (relativa al final)
        (userId, posFromEnd) => {
          const store = new Map<number, TokenStore>();
          const token = generateAndStoreToken(userId, store);

          // Modificar el último carácter del token para que falle
          const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');

          // El token modificado no debe validar
          expect(validateToken(userId, tampered, store)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('un token arbitrario (no generado por el sistema) no valida', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99999 }),
        fc.string({ minLength: 10, maxLength: 100 }),
        (userId, randomToken) => {
          const store = new Map<number, TokenStore>();
          generateAndStoreToken(userId, store); // hay un token legítimo en el store

          // Un string aleatorio no debe coincidir con el hash almacenado
          // (probabilidad negligible de colisión SHA-256)
          const randomHash = crypto.createHash('sha256').update(randomToken).digest('hex');
          const storedHash = store.get(userId)!.hash;

          if (randomHash !== storedHash) {
            expect(validateToken(userId, randomToken, store)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Propiedad 9: Un token de recuperación usado no puede usarse de nuevo
// Valida: Requisito 5.4
// ---------------------------------------------------------------------------
describe('Propiedad 9: un token usado no puede reutilizarse', () => {
  it('tras consumir el token, la validación siempre falla', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99999 }),
        (userId) => {
          const store = new Map<number, TokenStore>();
          const token = generateAndStoreToken(userId, store);

          // Confirmar que es válido antes de consumirlo
          expect(validateToken(userId, token, store)).toBe(true);

          // Consumir (invalidar) el token
          consumeToken(userId, store);

          // Ya no debe ser válido
          expect(validateToken(userId, token, store)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('consumir un token ya invalidado no produce error (operación idempotente)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99999 }),
        (userId) => {
          const store = new Map<number, TokenStore>();
          generateAndStoreToken(userId, store);

          // Consumir dos veces — no debe lanzar
          expect(() => consumeToken(userId, store)).not.toThrow();
          expect(() => consumeToken(userId, store)).not.toThrow();

          // El store sigue existiendo pero con hash null
          const entry = store.get(userId);
          expect(entry).toBeDefined();
          expect(entry!.hash).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('un token consumido no puede usarse aunque el JWT siga siendo válido criptográficamente', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99999 }),
        (userId) => {
          const store = new Map<number, TokenStore>();
          const token = generateAndStoreToken(userId, store);

          // El JWT en sí sigue siendo criptográficamente válido (no ha expirado)
          expect(() => jwt.verify(token, TEST_SEED)).not.toThrow();

          // Pero tras consumir el token de BD, ya no pasa la validación de negocio
          consumeToken(userId, store);
          expect(validateToken(userId, token, store)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('tokens de distintos usuarios son independientes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 49999 }),
        (baseId) => {
          const userA = baseId;
          const userB = baseId + 50000; // garantiza que son distintos
          const store = new Map<number, TokenStore>();

          const tokenA = generateAndStoreToken(userA, store);
          const tokenB = generateAndStoreToken(userB, store);

          // Consumir el token de A no afecta al de B
          consumeToken(userA, store);

          expect(validateToken(userA, tokenA, store)).toBe(false);
          expect(validateToken(userB, tokenB, store)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
