# Plan de Implementación: Security Hardening

## Visión General

Implementación incremental del endurecimiento de seguridad de App Base. Las tareas están ordenadas por prioridad y dependencias: primero las utilidades base (sanitizador, logger), luego los cambios de backend (CORS, rate limiting, JWT, autenticación), después la BD y finalmente el frontend.

## Tareas

- [x] 1. Crear utilidades base de seguridad
  - [x] 1.1 Implementar `utils/inputSanitizer.ts`
    - Crear clase `InputSanitizer` con métodos: `sanitizeString(value, maxLength?)`, `validatePositiveInt(value, fieldName)`, `requireField(value, fieldName)`, `sanitizeObject(obj, schema)`
    - `sanitizeString` debe escapar `<`, `>`, `"`, `'`, `&` y truncar si supera `maxLength`
    - `requireField` y `validatePositiveInt` deben lanzar `ControlException` con código 400
    - _Requisitos: 9.1, 9.2, 9.3, 9.4_

  - [x] 1.2 Escribir tests de propiedad para InputSanitizer
    - **Propiedad 13: El InputSanitizer escapa todos los caracteres HTML peligrosos**
    - **Valida: Requisitos 9.1**
    - **Propiedad 14: El InputSanitizer hace cumplir los límites de longitud y tipos**
    - **Valida: Requisitos 9.2, 9.3, 9.4**
    - Instalar `fast-check` y `jest` + `ts-jest` si no están presentes
    - Mínimo 100 iteraciones por propiedad

  - [x] 1.3 Implementar `utils/securityLogger.ts`
    - Crear enum `SecurityEventType` con todos los tipos de evento definidos en el diseño
    - Crear interfaz `SecurityLogEntry` con campos: `timestamp`, `event`, `username?`, `ip?`, `result`, `details?`
    - Implementar método `log(entry)` que escribe en `data/logs/security.log` en formato JSON por línea
    - Reutilizar el `Logger` existente para la escritura de archivos
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [x] 1.4 Escribir tests de propiedad para SecurityLogger
    - **Propiedad 12: Cada entrada del SecurityLogger contiene todos los campos requeridos**
    - **Valida: Requisitos 8.1, 8.8**
    - Verificar que timestamp es ISO 8601 válido, event es SecurityEventType válido, result es SUCCESS o FAILURE

- [x] 2. Configuración y arranque seguro del servidor
  - [x] 2.1 Añadir validación de `APP_SEED` en `server/server.ts`
    - Crear método privado `validateConfiguration()` llamado en el constructor antes de inicializar Socket.IO
    - En producción: verificar longitud >= 32 y presencia de letras + números + caracteres especiales
    - En desarrollo: emitir `console.warn` si no cumple requisitos sin detener el arranque
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 2.2 Escribir tests de propiedad para validación de APP_SEED
    - **Propiedad 10: La validación de APP_SEED rechaza cualquier secreto débil en producción**
    - **Valida: Requisitos 6.1, 6.2, 6.3**
    - Generar strings aleatorios y verificar que la función acepta/rechaza correctamente

  - [x] 2.3 Implementar restricción de CORS en `server/server.ts`
    - Leer `APP_CORS_ORIGINS` del entorno y parsear como lista separada por comas
    - Reemplazar `origin: '*'` en la configuración de Express CORS y Socket.IO CORS
    - En desarrollo sin `APP_CORS_ORIGINS`: usar `['http://localhost:4200']` por defecto
    - En producción sin `APP_CORS_ORIGINS`: lanzar error de configuración y detener arranque
    - Añadir `APP_CORS_ORIGINS` a `.env.template` con valor de ejemplo
    - _Requisitos: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.4 Escribir tests de propiedad para validación de CORS
    - **Propiedad 1: Validación de CORS es exhaustiva y correcta**
    - **Valida: Requisitos 1.1, 1.2**
    - Generar listas de orígenes y orígenes de prueba, verificar aceptación/rechazo

- [x] 3. Implementar Rate Limiting en WebSocket
  - [x] 3.1 Crear `server/rateLimiter.ts`
    - Implementar `RateLimiter` con `Map<socketId, { count, windowStart }>` en memoria
    - Método `checkLimit(socketId, eventName)`: retorna `true` si dentro del límite, `false` si lo supera
    - Límite general configurable via `APP_RATE_LIMIT_MAX_EVENTS` y `APP_RATE_LIMIT_WINDOW_MS`
    - Límite específico para `auth/login` via `APP_RATE_LIMIT_LOGIN_MAX` y `APP_RATE_LIMIT_LOGIN_WINDOW_MS`
    - Al superar el límite: emitir `error_message` con código 429, llamar a `SecurityLogger`, desconectar socket
    - Añadir las 4 variables de entorno a `.env.template`
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Escribir tests de propiedad para RateLimiter
    - **Propiedad 2: El contador de rate limiting refleja fielmente los eventos recibidos**
    - **Valida: Requisitos 2.1, 2.2**
    - **Propiedad 3: El límite de login es siempre más restrictivo que el límite general**
    - **Valida: Requisito 2.3**

  - [x] 3.3 Registrar RateLimiter como middleware en `server/server.ts`
    - Añadir `this.io.use(rateLimiter.middleware)` en el método `listenSockets()`
    - Solo activar en producción o si `APP_RATE_LIMIT_ENABLED=true`
    - _Requisitos: 2.4_

- [ ] 4. Checkpoint — Verificar que el servidor arranca correctamente
  - Asegurarse de que todos los tests pasan, el servidor arranca sin errores con la nueva configuración y los logs de seguridad se escriben correctamente. Consultar al usuario si surgen dudas.

- [x] 5. Hardening de autenticación y JWT
  - [x] 5.1 Reducir payload JWT en `services/user/auth.bll.ts`
    - Modificar el método `login()` para generar el token con payload mínimo: `{ id, username, role_id }`
    - Modificar el método `renewToken()` para usar el mismo payload mínimo
    - Modificar el método `recoveryToken()` para usar payload mínimo
    - _Requisitos: 3.1, 3.2_

  - [x] 5.2 Escribir tests de propiedad para payload JWT mínimo
    - **Propiedad 4: El payload JWT contiene exactamente los campos mínimos requeridos**
    - **Valida: Requisitos 3.1, 3.2**
    - Generar usuarios aleatorios y verificar que el token generado no contiene campos sensibles

  - [x] 5.3 Añadir logging de seguridad en `auth.bll.ts` y `authorized.middleware.ts`
    - En `auth.bll.ts`: llamar a `SecurityLogger` en login fallido (contraseña incorrecta), bloqueo de cuenta, login exitoso
    - En `authorized.middleware.ts`: llamar a `SecurityLogger` en token inválido, token expirado, acceso denegado
    - Extraer la IP del socket desde `socket.handshake.address`
    - _Requisitos: 8.1, 8.2, 8.3, 8.4_

  - [x] 5.4 Actualizar `authorized.middleware.ts` para consultar BD en verificación de token
    - En `checkToken()` y `isAllowed()`: después de verificar el JWT, consultar `UsersDAL.getUser(decoded.user.id)` para obtener datos actualizados
    - Verificar que el usuario sigue activo en BD antes de proceder
    - _Requisitos: 3.3_

- [ ] 6. Migración de base de datos y modelo de usuario
  - [x] 6.1 Actualizar `models/user.model.ts`
    - Cambiar `attempts` de `DataTypes.INTEGER(1)` a `DataTypes.INTEGER(11)`
    - Añadir campo `recovery_token_hash: DataTypes.STRING(64), allowNull: true`
    - Añadir campo `recovery_token_created_at: DataTypes.DATE, allowNull: true`
    - _Requisitos: 10.1, 5.2_

  - [x] 6.2 Escribir test de ejemplo para el campo attempts
    - Verificar que el modelo acepta valores > 9 sin error de validación
    - **Propiedad 15: El campo attempts nunca toma valores negativos**
    - **Valida: Requisito 10.2**

  - [x] 6.3 Crear script de migración SQL
    - Crear archivo `1_Project/4_Database/migrations/001_security_hardening.sql` con los ALTER TABLE del diseño
    - Incluir comentarios explicativos y verificación de que las columnas no existen antes de añadirlas
    - _Requisitos: 10.1, 5.2_

- [-] 7. Invalidación de tokens de recuperación de contraseña
  - [x] 7.1 Actualizar `services/user/users.dal.ts` para gestionar tokens de recuperación
    - Añadir método `saveRecoveryToken(userId, tokenHash, createdAt)`: guarda el hash en BD
    - Añadir método `clearRecoveryToken(userId)`: limpia `recovery_token_hash` y `recovery_token_created_at`
    - Añadir método `getRecoveryTokenData(userId)`: retorna `{ hash, createdAt }` del token activo
    - _Requisitos: 5.2, 5.3, 5.4, 5.5_

  - [x] 7.2 Actualizar `services/user/auth.bll.ts` para invalidar tokens anteriores
    - En `recoveryToken()`: generar token, calcular `SHA-256(token)`, llamar a `saveRecoveryToken()` (invalida el anterior automáticamente)
    - Crear nuevo método `validateRecoveryToken(userId, token)`: obtiene hash de BD, compara con `SHA-256(token)`, verifica que no ha expirado
    - Crear nuevo método `consumeRecoveryToken(userId)`: llama a `clearRecoveryToken()` tras cambio de contraseña exitoso
    - Añadir logging de seguridad para solicitud y completado de recuperación
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 8.5, 8.6_

  - [x] 7.3 Escribir tests de propiedad para invalidación de tokens de recuperación
    - **Propiedad 7: Los tokens de recuperación son únicos entre solicitudes consecutivas**
    - **Valida: Requisitos 5.1, 5.5**
    - **Propiedad 8: Verificación de token de recuperación es un round-trip de hash**
    - **Valida: Requisito 5.3**
    - **Propiedad 9: Un token de recuperación usado no puede usarse de nuevo**
    - **Valida: Requisito 5.4**

  - [x] 7.4 Actualizar `controllers/ws/auth.controller.ts` para usar los nuevos métodos
    - En `validateTokenRecovery()`: usar `authService.validateRecoveryToken()` en lugar de solo verificar el JWT
    - En el flujo de cambio de contraseña: llamar a `authService.consumeRecoveryToken()` tras el cambio exitoso
    - _Requisitos: 5.3, 5.4_

- [ ] 8. Sanitización de inputs en controladores WebSocket
  - [x] 8.1 Aplicar `InputSanitizer` en `controllers/ws/auth.controller.ts`
    - Sanitizar `userName` y `password` en `login()`
    - Sanitizar `userName` en `recoveryPassword()`
    - Sanitizar `tokenRecovery` en `validateTokenRecovery()`
    - _Requisitos: 9.1, 9.2, 9.4, 9.5_

  - [x] 8.2 Aplicar `InputSanitizer` en `controllers/ws/user.controller.ts`
    - Sanitizar todos los campos de string del objeto `user` en `addUser()` y `editUser()`
    - Validar que `id` es un entero positivo en `getUser()`, `editUser()`, `delUser()`
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 8.3 Aplicar `InputSanitizer` en los demás controladores (`permission.controller.ts`, `role.controller.ts`, `email.controller.ts`)
    - Sanitizar campos string y validar campos numéricos en todos los eventos WebSocket
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 9. Checkpoint — Verificar que todos los tests de backend pasan
  - Ejecutar la suite completa de tests. Verificar que los tests de propiedad pasan con 100+ iteraciones. Consultar al usuario si surgen dudas.

- [ ] 10. Cambios en el Frontend (Angular 17)
  - [ ] 10.1 Crear `utils/password-validator.ts` en el frontend
    - Exportar `PASSWORD_REGEX` con la misma expresión regular que el backend
    - Exportar función `validatePassword(password): { valid: boolean; errors: string[] }`
    - Los mensajes de error deben indicar qué requisito específico falta (mayúscula, número, carácter especial, longitud)
    - _Requisitos: 7.1, 7.2, 7.3, 7.4_

  - [ ] 10.2 Escribir tests de propiedad para validación de contraseña frontend
    - **Propiedad 11: La validación de contraseña frontend es equivalente a la del backend**
    - **Valida: Requisitos 7.1, 7.2**
    - Usar `fast-check` en el proyecto Angular (instalar si no está presente)
    - Generar strings aleatorios y verificar que frontend y backend producen el mismo resultado

  - [ ] 10.3 Integrar validación de contraseña en los componentes de cambio de contraseña
    - Usar `validatePassword()` en los formularios reactivos de Angular donde se introduce contraseña
    - Mostrar mensajes de error en tiempo real mientras el usuario escribe
    - _Requisitos: 7.2, 7.3, 7.4_

  - [ ] 10.4 Crear `services/share/inactivity.service.ts` en el frontend
    - Implementar `startWatching()`: registrar listeners para `click`, `keydown`, `mousemove` en `document`
    - Implementar `resetTimer()`: reiniciar el `setTimeout` de logout y el `setTimeout` de advertencia
    - Implementar `stopWatching()`: limpiar listeners y timers
    - Leer el timeout desde la variable de entorno Angular (`environment.inactivityTimeoutMinutes`)
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 10.5 Escribir tests de propiedad para InactivityService
    - **Propiedad 5: El servicio de inactividad reinicia el timer ante cualquier interacción**
    - **Valida: Requisitos 4.1, 4.5**
    - **Propiedad 6: El timeout de inactividad siempre dispara el logout**
    - **Valida: Requisito 4.2**
    - Usar `fakeAsync` y `tick` de Angular para simular el paso del tiempo

  - [ ] 10.6 Integrar `InactivityService` en el componente raíz o en el guard de autenticación
    - Llamar a `startWatching()` cuando el usuario inicia sesión
    - Llamar a `stopWatching()` cuando el usuario cierra sesión
    - Mostrar modal de advertencia cuando quedan 2 minutos para el logout
    - Emitir `auth/renewToken` si el usuario elige extender la sesión
    - _Requisitos: 4.2, 4.3, 4.4_

- [ ] 11. Checkpoint final — Verificar integración completa
  - Ejecutar todos los tests (backend y frontend). Verificar que el servidor arranca con la nueva configuración. Verificar que el flujo completo de login, logout por inactividad y recuperación de contraseña funciona correctamente. Consultar al usuario si surgen dudas.

## Notas

- Los tests de backend van en `backend/tests/unit/` y `backend/tests/property/`
- Los tests de frontend van junto a sus archivos como `.spec.ts` (convención Angular)
- Cada tarea de propiedad referencia explícitamente la propiedad del documento de diseño
- Los checkpoints garantizan validación incremental antes de continuar
- La migración SQL (tarea 6.3) debe ejecutarse manualmente en la base de datos antes de arrancar el servidor con los cambios del modelo
