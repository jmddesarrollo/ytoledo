# Documento de Requisitos: Security Hardening

## Introducción

Este documento define los requisitos de seguridad para el endurecimiento (hardening) de la aplicación **App Base**. El objetivo es corregir las vulnerabilidades identificadas y elevar el nivel de seguridad de la plataforma sin romper la arquitectura existente basada en WebSockets (Socket.IO), el patrón Controller → BLL → DAL, y el stack Node.js + TypeScript + Angular 17.

Los requisitos cubren: autenticación robusta, gestión segura de sesiones JWT, autorización RBAC, seguridad de contraseñas, protección de la comunicación WebSocket, logging de auditoría y validación/sanitización de inputs.

---

## Glosario

- **Sistema**: La aplicación App Base (backend Node.js + frontend Angular 17).
- **Backend**: El servidor Node.js/Express con Socket.IO.
- **Frontend**: La aplicación Angular 17.
- **AuthService**: Servicio BLL responsable de la autenticación (`auth.bll.ts`).
- **AuthorizedMiddleware**: Middleware de verificación de tokens JWT y permisos.
- **SecurityLogger**: Nuevo servicio de logging de eventos de seguridad.
- **InputSanitizer**: Nueva utilidad de sanitización de inputs en controladores WebSocket.
- **RateLimiter**: Nuevo mecanismo de limitación de tasa de eventos WebSocket.
- **JWT**: JSON Web Token usado para autenticación de sesiones.
- **RBAC**: Control de acceso basado en roles (Role-Based Access Control).
- **APP_SEED**: Variable de entorno con el secreto para firmar JWT.
- **ControlException**: Clase de error controlado del sistema.
- **WebSocket**: Canal de comunicación bidireccional entre cliente y servidor vía Socket.IO.

---

## Requisitos

### Requisito 1: Restricción de CORS

**Historia de usuario:** Como administrador del sistema, quiero que el servidor solo acepte conexiones desde orígenes autorizados, para que no se permitan peticiones desde dominios no confiables.

#### Criterios de Aceptación

1. WHEN el servidor arranca, THE Sistema SHALL leer la lista de orígenes permitidos desde la variable de entorno `APP_CORS_ORIGINS`.
2. WHEN una conexión WebSocket llega desde un origen no incluido en `APP_CORS_ORIGINS`, THE Backend SHALL rechazar la conexión con un error de CORS.
3. WHEN el entorno es `development`, THE Sistema SHALL permitir `localhost` como origen válido por defecto.
4. IF `APP_CORS_ORIGINS` no está definida al arrancar en entorno `production`, THEN THE Backend SHALL lanzar un error de configuración y detener el arranque.

---

### Requisito 2: Rate Limiting en WebSocket

**Historia de usuario:** Como administrador del sistema, quiero limitar la tasa de eventos WebSocket por conexión, para prevenir ataques de fuerza bruta y abuso del servidor.

#### Criterios de Aceptación

1. THE RateLimiter SHALL rastrear el número de eventos recibidos por socket en una ventana de tiempo configurable.
2. WHEN un socket supera el límite de eventos configurado en la ventana de tiempo, THE Backend SHALL emitir `error_message` con código 429 y desconectar el socket.
3. THE Sistema SHALL aplicar un límite más estricto al evento `auth/login`: máximo 10 intentos por IP en 5 minutos.
4. WHERE el entorno es `production`, THE RateLimiter SHALL activarse automáticamente al iniciar el servidor.
5. IF un socket es desconectado por rate limiting, THEN THE SecurityLogger SHALL registrar el evento con la IP y el timestamp.

---

### Requisito 3: Payload JWT Mínimo

**Historia de usuario:** Como arquitecto de seguridad, quiero que el token JWT contenga solo los datos estrictamente necesarios, para reducir la superficie de ataque en caso de compromiso del token.

#### Criterios de Aceptación

1. WHEN el AuthService genera un token JWT, THE AuthService SHALL incluir únicamente `id`, `username` y `role_id` del usuario en el payload.
2. THE AuthService SHALL excluir del payload JWT campos como `password`, `email`, `attempts`, `active` y cualquier otro dato sensible.
3. WHEN el AuthorizedMiddleware verifica un token, THE AuthorizedMiddleware SHALL consultar la base de datos para obtener los datos actualizados del usuario en lugar de confiar exclusivamente en el payload del token.
4. THE Sistema SHALL mantener compatibilidad con el flujo existente de renovación de token (`auth/renewToken`).

---

### Requisito 4: Expiración de Sesión por Inactividad en el Frontend

**Historia de usuario:** Como usuario, quiero que mi sesión expire automáticamente tras un período de inactividad, para proteger mi cuenta si olvido cerrar sesión.

#### Criterios de Aceptación

1. THE Frontend SHALL detectar inactividad del usuario midiendo el tiempo desde la última interacción (clic, teclado, movimiento de ratón).
2. WHEN el usuario permanece inactivo durante el tiempo configurado en `APP_INACTIVITY_TIMEOUT_MINUTES`, THE Frontend SHALL emitir el evento `auth/logout` y limpiar el token almacenado.
3. WHEN quedan 2 minutos para la expiración por inactividad, THE Frontend SHALL mostrar una advertencia al usuario con opción de extender la sesión.
4. WHEN el usuario extiende la sesión, THE Frontend SHALL emitir `auth/renewToken` para obtener un nuevo token.
5. THE Frontend SHALL reiniciar el contador de inactividad ante cualquier interacción del usuario.

---

### Requisito 5: Invalidación de Tokens de Recuperación de Contraseña

**Historia de usuario:** Como usuario, quiero que al solicitar una nueva recuperación de contraseña se invaliden los tokens anteriores, para evitar que enlaces de recuperación antiguos puedan ser usados.

#### Criterios de Aceptación

1. WHEN un usuario solicita recuperación de contraseña, THE AuthService SHALL generar un nuevo token de recuperación único.
2. WHEN se genera un nuevo token de recuperación, THE Backend SHALL almacenar un hash del token activo en la base de datos junto con su timestamp de creación.
3. WHEN se valida un token de recuperación, THE AuthService SHALL verificar que el hash del token coincide con el almacenado en base de datos.
4. WHEN un usuario completa el cambio de contraseña con un token de recuperación, THE AuthService SHALL invalidar el token eliminando su hash de la base de datos.
5. WHEN se solicita una nueva recuperación de contraseña y ya existe un token activo, THE AuthService SHALL invalidar el token anterior antes de generar el nuevo.
6. IF un token de recuperación ha expirado según su timestamp, THEN THE AuthService SHALL rechazarlo con un error descriptivo aunque el JWT no haya expirado.

---

### Requisito 6: Validación del APP_SEED al Arranque

**Historia de usuario:** Como administrador del sistema, quiero que el servidor valide la fortaleza del secreto JWT al arrancar, para evitar que se use un secreto débil en producción.

#### Criterios de Aceptación

1. WHEN el servidor arranca, THE Backend SHALL verificar que `APP_SEED` está definida y no está vacía.
2. WHEN el servidor arranca en entorno `production`, THE Backend SHALL verificar que `APP_SEED` tiene una longitud mínima de 32 caracteres.
3. WHEN el servidor arranca en entorno `production`, THE Backend SHALL verificar que `APP_SEED` contiene al menos una combinación de letras, números y caracteres especiales.
4. IF `APP_SEED` no cumple los requisitos de fortaleza en entorno `production`, THEN THE Backend SHALL lanzar un error de configuración y detener el arranque.
5. IF `APP_SEED` no cumple los requisitos en entorno `development`, THEN THE Backend SHALL emitir una advertencia en consola sin detener el arranque.

---

### Requisito 7: Validación de Contraseña en el Frontend

**Historia de usuario:** Como usuario, quiero recibir retroalimentación inmediata sobre la fortaleza de mi contraseña al cambiarla, para asegurarme de que cumple los requisitos antes de enviarla al servidor.

#### Criterios de Aceptación

1. THE Frontend SHALL validar la contraseña con la misma expresión regular que el backend: `/^(?=.*[0-9])(?=.*[A-ZÑ])(?=.*[a-zñ])(?=.*[$€#%&_-])\S{6,15}$/`.
2. WHEN el usuario escribe una contraseña que no cumple el formato, THE Frontend SHALL mostrar un mensaje de error descriptivo indicando qué requisito falta.
3. WHEN el usuario escribe una contraseña que cumple todos los requisitos, THE Frontend SHALL mostrar una indicación visual de contraseña válida.
4. THE Frontend SHALL realizar la validación en tiempo real mientras el usuario escribe, sin necesidad de enviar datos al servidor.

---

### Requisito 8: Logging y Auditoría de Seguridad

**Historia de usuario:** Como administrador del sistema, quiero que los eventos de seguridad relevantes queden registrados, para poder detectar y analizar intentos de ataque o comportamientos anómalos.

#### Criterios de Aceptación

1. WHEN un intento de login falla por contraseña incorrecta, THE SecurityLogger SHALL registrar el evento con username, IP del socket y timestamp.
2. WHEN una cuenta queda bloqueada por superar el número máximo de intentos, THE SecurityLogger SHALL registrar el bloqueo con username, IP y timestamp.
3. WHEN se detecta un token JWT inválido o expirado, THE SecurityLogger SHALL registrar el evento con el tipo de error y la IP del socket.
4. WHEN un usuario intenta acceder a un recurso sin los permisos necesarios, THE SecurityLogger SHALL registrar el intento con el usuario, el permiso requerido y la IP.
5. WHEN se completa un cambio de contraseña, THE SecurityLogger SHALL registrar el evento con el username y timestamp.
6. WHEN se solicita o completa una recuperación de contraseña, THE SecurityLogger SHALL registrar el evento con el username y timestamp.
7. THE SecurityLogger SHALL escribir los logs en archivos rotativos en `data/logs/security.log`.
8. THE SecurityLogger SHALL incluir en cada entrada: timestamp ISO 8601, tipo de evento, username (si aplica), IP del socket y resultado (éxito/fallo).

---

### Requisito 9: Sanitización de Inputs en Controladores WebSocket

**Historia de usuario:** Como arquitecto de seguridad, quiero que todos los inputs recibidos por los controladores WebSocket sean sanitizados antes de procesarse, para prevenir inyecciones y ataques XSS.

#### Criterios de Aceptación

1. THE InputSanitizer SHALL eliminar o escapar caracteres HTML especiales (`<`, `>`, `"`, `'`, `&`) de todos los campos de tipo string recibidos en eventos WebSocket.
2. WHEN un campo de tipo string supera la longitud máxima permitida para ese campo, THE InputSanitizer SHALL truncarlo o lanzar un `ControlException` con código 400.
3. THE InputSanitizer SHALL validar que los campos numéricos recibidos son efectivamente números antes de procesarlos.
4. IF un campo requerido llega como `null`, `undefined` o cadena vacía, THEN THE InputSanitizer SHALL lanzar un `ControlException` con código 400 y un mensaje descriptivo.
5. THE Sistema SHALL aplicar la sanitización en la capa Controller antes de llamar al BLL, respetando el patrón de capas.
6. THE InputSanitizer SHALL ser una utilidad reutilizable en `utils/inputSanitizer.ts` que pueda ser importada por cualquier controlador.

---

### Requisito 10: Protección del Campo `attempts` en Base de Datos

**Historia de usuario:** Como arquitecto de seguridad, quiero que el campo `attempts` del modelo de usuario soporte correctamente el rango de valores necesario, para garantizar que el mecanismo de bloqueo funcione de forma robusta.

#### Criterios de Aceptación

1. THE Sistema SHALL cambiar el tipo del campo `attempts` en el modelo `users` de `INTEGER(1)` a `INTEGER(11)` para soportar valores mayores que 9.
2. WHEN el campo `attempts` se actualiza en base de datos, THE Sistema SHALL garantizar que el valor nunca sea negativo.
3. THE Sistema SHALL mantener la lógica de bloqueo existente: bloqueo tras 3 intentos fallidos durante 1 minuto.
4. WHEN se genera la migración de base de datos para este cambio, THE Sistema SHALL incluir un script SQL compatible con MySQL.
