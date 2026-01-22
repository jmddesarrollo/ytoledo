# Adjuntar Archivos a Rutas - Requerimientos

## 1. Visión General

Extender el sistema existente de gestión de rutas para permitir adjuntar archivos de track (GPX, KML, etc.) a las rutas, proporcionando funcionalidad de carga, vinculación, descarga y gestión de archivos para mejorar la experiencia de los usuarios del club de senderismo.

## 2. Objetivos

- Permitir adjuntar archivos de track a rutas existentes
- Proporcionar descarga pública de archivos vinculados a rutas
- Implementar gestión de archivos no vinculados para administradores
- Mantener compatibilidad total con el sistema de rutas existente
- Seguir la arquitectura y patrones establecidos en el proyecto

## 3. Usuarios del Sistema

### 3.1 Usuario con Permisos (Administrador/Editor)
- **Descripción**: Usuario autenticado con permisos de gestión de rutas
- **Responsabilidades**: Subir archivos, vincular/desvincular archivos a rutas, gestionar archivos huérfanos

### 3.2 Usuario Público
- **Descripción**: Cualquier visitante del sitio web
- **Responsabilidades**: Descargar archivos vinculados a rutas desde páginas de detalle

### 3.3 Administrador de Archivos
- **Descripción**: Usuario con permisos administrativos
- **Responsabilidades**: Gestionar archivos no vinculados, eliminar archivos huérfanos

## 4. Glosario

- **Archivo de Track**: Archivo digital (GPX, KML, etc.) que contiene información de coordenadas GPS de una ruta
- **Archivo Vinculado**: Archivo que está asociado a una ruta específica mediante el campo file_track
- **Archivo Huérfano**: Archivo subido al sistema pero no vinculado a ninguna ruta
- **Sistema_Rutas**: El sistema existente de gestión de rutas
- **Sistema_Archivos**: El nuevo subsistema de gestión de archivos de track

## 5. Requerimientos

### Requerimiento 1: Subida y Vinculación de Archivos

**Historia de Usuario:** Como usuario con permisos, quiero subir un archivo de track y vincularlo a una ruta específica, para que los usuarios puedan descargar el track real de la ruta.

#### Criterios de Aceptación

1. CUANDO un usuario con permisos sube un archivo, ENTONCES EL Sistema_Archivos DEBERÁ mostrar un listado de rutas que no tienen archivo adjunto
2. CUANDO se muestra el listado de rutas disponibles, ENTONCES EL Sistema_Archivos DEBERÁ permitir seleccionar exactamente una ruta para vincular
3. CUANDO se vincula un archivo a una ruta, ENTONCES EL Sistema_Rutas DEBERÁ actualizar el campo file_track con el identificador del archivo
4. CUANDO se completa la vinculación, ENTONCES EL Sistema_Archivos DEBERÁ confirmar la operación exitosa

### Requerimiento 2: Desvinculación de Archivos

**Historia de Usuario:** Como usuario con permisos, quiero desvincular un archivo de una ruta durante la edición, para poder corregir vinculaciones incorrectas o actualizar archivos.

#### Criterios de Aceptación

1. CUANDO un usuario edita una ruta que tiene archivo vinculado, ENTONCES EL Sistema_Rutas DEBERÁ mostrar la opción de desvincular el archivo
2. CUANDO se desvincula un archivo de una ruta, ENTONCES EL Sistema_Rutas DEBERÁ establecer el campo file_track como vacío
3. CUANDO se desvincula un archivo, ENTONCES EL Sistema_Archivos DEBERÁ marcar el archivo como huérfano
4. CUANDO se completa la desvinculación, ENTONCES EL Sistema_Rutas DEBERÁ actualizar la interfaz para reflejar el cambio

### Requerimiento 3: Descarga Pública de Archivos

**Historia de Usuario:** Como usuario público, quiero descargar el archivo de track de una ruta desde su página de detalle, para poder usar el track en mi dispositivo GPS o aplicación de senderismo.

#### Criterios de Aceptación

1. CUANDO un usuario consulta el detalle de una ruta con archivo vinculado, ENTONCES EL Sistema_Rutas DEBERÁ mostrar un botón de descarga junto al botón de Wikiloc
2. CUANDO un usuario hace clic en el botón de descarga, ENTONCES EL Sistema_Archivos DEBERÁ servir el archivo para descarga directa
3. CUANDO existe botón de descarga, ENTONCES EL Sistema_Rutas DEBERÁ mostrar el mensaje explicativo sobre el uso del archivo
4. CUANDO una ruta no tiene archivo vinculado, ENTONCES EL Sistema_Rutas NO DEBERÁ mostrar el botón de descarga ni el mensaje explicativo

### Requerimiento 4: Gestión de Archivos Huérfanos

**Historia de Usuario:** Como administrador, quiero gestionar archivos que no están vinculados a ninguna ruta, para mantener limpio el sistema de archivos y liberar espacio de almacenamiento.

#### Criterios de Aceptación

1. CUANDO un administrador accede a la página de gestión de archivos, ENTONCES EL Sistema_Archivos DEBERÁ mostrar todos los archivos no vinculados
2. CUANDO se muestra la lista de archivos huérfanos, ENTONCES EL Sistema_Archivos DEBERÁ incluir información del archivo (nombre, fecha, tamaño)
3. CUANDO un administrador selecciona eliminar un archivo huérfano, ENTONCES EL Sistema_Archivos DEBERÁ solicitar confirmación
4. CUANDO se confirma la eliminación, ENTONCES EL Sistema_Archivos DEBERÁ eliminar físicamente el archivo del sistema

### Requerimiento 5: Extensión del Modelo de Rutas

**Historia de Usuario:** Como desarrollador del sistema, quiero extender el modelo de rutas para soportar archivos adjuntos, manteniendo la compatibilidad con el sistema existente.

#### Criterios de Aceptación

1. CUANDO se extiende la tabla de rutas, ENTONCES EL Sistema_Rutas DEBERÁ incluir el campo file_track como VARCHAR opcional
2. CUANDO una ruta no tiene archivo vinculado, ENTONCES EL campo file_track DEBERÁ ser NULL o cadena vacía
3. CUANDO una ruta tiene archivo vinculado, ENTONCES EL campo file_track DEBERÁ contener el identificador único del archivo
4. CUANDO se consultan rutas existentes, ENTONCES EL Sistema_Rutas DEBERÁ mantener compatibilidad total con funcionalidades previas

### Requerimiento 6: Integración con Sistema de Archivos Existente

**Historia de Usuario:** Como desarrollador del sistema, quiero aprovechar la funcionalidad de subida de archivos existente, para mantener consistencia y evitar duplicación de código.

#### Criterios de Aceptación

1. CUANDO se sube un archivo de track, ENTONCES EL Sistema_Archivos DEBERÁ usar el sistema de subida existente que genera identificadores únicos
2. CUANDO se almacena un archivo, ENTONCES EL Sistema_Archivos DEBERÁ seguir la estructura de carpetas existente con identificador único
3. CUANDO se sirve un archivo para descarga, ENTONCES EL Sistema_Archivos DEBERÁ usar las rutas y controladores de archivos existentes
4. CUANDO se elimina un archivo, ENTONCES EL Sistema_Archivos DEBERÁ usar los métodos de eliminación física existentes

### Requerimiento 7: Validación y Seguridad de Archivos

**Historia de Usuario:** Como administrador del sistema, quiero asegurar que solo se suban archivos válidos de track, para mantener la seguridad y calidad del sistema.

#### Criterios de Aceptación

1. CUANDO se sube un archivo, ENTONCES EL Sistema_Archivos DEBERÁ validar que sea un tipo de archivo permitido (GPX, KML, etc.)
2. CUANDO se valida un archivo, ENTONCES EL Sistema_Archivos DEBERÁ verificar el tamaño máximo permitido
3. CUANDO se detecta un archivo inválido, ENTONCES EL Sistema_Archivos DEBERÁ rechazar la subida con mensaje descriptivo
4. CUANDO se sirve un archivo para descarga, ENTONCES EL Sistema_Archivos DEBERÁ verificar que el archivo existe y es accesible

### Requerimiento 8: Interfaz de Usuario Integrada

**Historia de Usuario:** Como usuario del sistema, quiero que la funcionalidad de archivos se integre naturalmente con la interfaz existente de rutas, para una experiencia de usuario consistente.

#### Criterios de Aceptación

1. CUANDO se accede a la funcionalidad de archivos, ENTONCES EL Sistema_Rutas DEBERÁ mantener el diseño y estilo visual existente
2. CUANDO se muestran controles de archivos, ENTONCES EL Sistema_Rutas DEBERÁ seguir los patrones de UI establecidos
3. CUANDO se muestran mensajes de estado, ENTONCES EL Sistema_Rutas DEBERÁ usar el sistema de notificaciones existente
4. CUANDO se navega entre funcionalidades, ENTONCES EL Sistema_Rutas DEBERÁ mantener la estructura de navegación actual

## 6. Restricciones Técnicas

### 6.1 Tecnológicas
- Debe extender el modelo Route existente sin romper compatibilidad
- Debe utilizar el sistema de subida de archivos existente
- Debe seguir la arquitectura WebSocket establecida
- Debe mantener compatibilidad con la base de datos MySQL existente
- Debe seguir los patrones TypeScript del proyecto

### 6.2 De Rendimiento
- La descarga de archivos debe ser eficiente para archivos de hasta 10MB
- La lista de archivos huérfanos debe cargar en menos de 2 segundos
- Las operaciones de vinculación/desvinculación deben completarse en menos de 1 segundo

### 6.3 De Seguridad
- Solo usuarios autenticados pueden subir y gestionar archivos
- Los archivos deben validarse antes de almacenarse
- Las descargas públicas deben ser seguras y no exponer rutas del sistema
- Debe mantener logs de auditoría para operaciones de archivos

### 6.4 De Almacenamiento
- Tipos de archivo permitidos: GPX, KML, TCX, FIT
- Tamaño máximo por archivo: 10MB
- Los archivos deben almacenarse en la estructura existente de carpetas

## 7. Criterios de Éxito

- **Funcionalidad**: Todas las operaciones de archivos funcionan correctamente
- **Integración**: Se integra seamlessly con el sistema de rutas existente
- **Usabilidad**: Los usuarios pueden gestionar archivos de forma intuitiva
- **Rendimiento**: El sistema mantiene el rendimiento con archivos adjuntos
- **Compatibilidad**: No rompe funcionalidades existentes del sistema de rutas

## 8. Fuera del Alcance

- Visualización o parsing del contenido de archivos GPX/KML
- Conversión entre formatos de archivos
- Validación de la calidad o precisión de los datos GPS
- Integración con servicios externos de mapas para mostrar tracks
- Versionado de archivos o historial de cambios
- Compresión automática de archivos
- Sincronización con dispositivos GPS externos