# Requirements Document

## Introduction

Esta funcionalidad permite adjuntar archivos directamente a las rutas durante su creación o edición, proporcionando una integración simple y directa con el sistema de gestión de archivos existente. Los usuarios podrán subir, quitar y descargar archivos asociados a rutas, así como gestionar todos los archivos adjuntos desde una página dedicada.

## Glossary

- **Route_System**: Sistema de gestión de rutas existente
- **File_Manager**: Sistema robusto de gestión de archivos (file.bll.ts) existente
- **File_Track**: Identificador único del archivo adjunto a una ruta
- **Filename_Track**: Nombre original del archivo con extensión
- **Attachment_Form**: Formulario integrado para adjuntar archivos en crear/editar ruta
- **Management_Page**: Página dedicada para gestionar archivos adjuntos
- **Authorized_User**: Usuario con permisos para crear/editar rutas
- **Any_User**: Cualquier usuario del sistema

## Requirements

### Requirement 1

**User Story:** Como usuario autorizado, quiero adjuntar archivos al crear o editar una ruta, para que los usuarios puedan descargar el archivo de la ruta real.

#### Acceptance Criteria

1. WHEN un usuario autorizado crea o edita una ruta, THE Attachment_Form SHALL permitir subir un archivo con su track
2. WHEN se sube un archivo, THE File_Manager SHALL generar un identificador único usando generateIdentifier()
3. WHEN se guarda la ruta con archivo, THE Route_System SHALL almacenar file_track y filename_track en la base de datos
4. WHEN se completa la subida, THE File_Manager SHALL usar uploadFile() para almacenar el archivo en el servidor

### Requirement 2

**User Story:** Como usuario autorizado, quiero quitar archivos adjuntos de una ruta, para que el archivo sea eliminado del servidor y la ruta quede sin archivo adjunto.

#### Acceptance Criteria

1. WHEN un usuario autorizado edita una ruta con archivo adjunto, THE Attachment_Form SHALL mostrar opción para quitar el archivo
2. WHEN se quita un archivo adjunto, THE Route_System SHALL vaciar los campos file_track y filename_track
3. WHEN se guarda la ruta sin archivo, THE File_Manager SHALL usar delFiles() para eliminar el archivo del servidor
4. WHEN se elimina el archivo, THE Route_System SHALL mantener todos los demás datos de la ruta intactos

### Requirement 3

**User Story:** Como cualquier usuario, quiero descargar archivos adjuntos de rutas, para que pueda usar el archivo real de la ruta en lugar de solo la referencia de Wikiloc.

#### Acceptance Criteria

1. WHEN un usuario consulta el detalle de una ruta con archivo adjunto, THE Route_System SHALL mostrar botón de descarga junto al botón 'Ver en Wikiloc'
2. WHEN existe botón de descarga, THE Route_System SHALL mostrar mensaje: 'El archivo de descarga es el que se usará en la ruta. La ruta que aparece en wikiloc es solo de referencia'
3. WHEN un usuario hace clic en descargar, THE File_Manager SHALL usar downloadFile() para servir el archivo
4. WHEN se descarga el archivo, THE File_Manager SHALL usar filename_track como nombre de descarga

### Requirement 4

**User Story:** Como usuario autorizado, quiero gestionar todos los archivos adjuntos desde una página dedicada, para que pueda ver y eliminar archivos de manera centralizada.

#### Acceptance Criteria

1. WHEN un usuario autorizado accede a la página de gestión, THE Management_Page SHALL mostrar listado de archivos con nombre y fecha de ruta
2. WHEN se muestra el listado, THE Management_Page SHALL incluir información de la ruta asociada a cada archivo
3. WHEN un usuario solicita eliminar un archivo, THE Management_Page SHALL mostrar confirmación antes de proceder
4. WHEN se confirma la eliminación, THE File_Manager SHALL usar delFiles() y THE Route_System SHALL actualizar los campos correspondientes

### Requirement 5

**User Story:** Como desarrollador del sistema, quiero aprovechar la infraestructura existente de file.bll.ts, para que la integración sea consistente y mantenga la arquitectura actual.

#### Acceptance Criteria

1. THE File_Manager SHALL usar generateIdentifier() para crear identificadores únicos de archivos
2. THE File_Manager SHALL usar uploadFile() para almacenar archivos en el servidor
3. THE File_Manager SHALL usar delFiles() para eliminar archivos del servidor
4. THE File_Manager SHALL usar downloadFile() para servir archivos a los usuarios
5. THE Route_System SHALL seguir la arquitectura Controller/Service/Model con BLL/DAL existente

### Requirement 6

**User Story:** Como administrador de base de datos, quiero que se agreguen los campos necesarios para el tracking de archivos, para que el sistema pueda asociar archivos con rutas de manera eficiente.

#### Acceptance Criteria

1. THE Route_System SHALL agregar campo file_track (VARCHAR) para identificador único del archivo
2. THE Route_System SHALL agregar campo filename_track (VARCHAR) para nombre original con extensión
3. WHEN no hay archivo adjunto, THE Route_System SHALL mantener file_track como cadena vacía
4. WHEN no hay archivo adjunto, THE Route_System SHALL mantener filename_track como cadena vacía