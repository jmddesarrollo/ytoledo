# Requirements Document

## Introduction

Esta funcionalidad permite vincular archivos subidos a rutas específicas en el sistema de gestión de rutas existente. Los usuarios podrán asociar archivos de ruta (como archivos GPX) a rutas específicas, gestionar estas vinculaciones, y permitir la descarga de archivos vinculados por parte de cualquier usuario.

## Glossary

- **Sistema**: El sistema de gestión de rutas con funcionalidad de vinculación de archivos
- **Usuario_Con_Permisos**: Usuario autenticado con permisos de administración para gestionar rutas y archivos
- **Usuario_Cualquiera**: Cualquier usuario del sistema, autenticado o no
- **Archivo_Vinculado**: Archivo que está asociado a una ruta específica mediante el campo file_track
- **Ruta_Sin_Archivo**: Ruta que no tiene ningún archivo vinculado (file_track vacío)
- **Identificador_Archivo**: Identificador único generado por el sistema de archivos existente
- **Página_Detalle_Ruta**: Página que muestra información detallada de una ruta específica

## Requirements

### Requirement 1: Modificación de Base de Datos

**User Story:** Como desarrollador, quiero agregar un campo file_track a la tabla routes, para poder vincular archivos a rutas específicas.

#### Acceptance Criteria

1. THE Sistema SHALL agregar el campo file_track de tipo VARCHAR a la tabla routes
2. THE Sistema SHALL permitir que el campo file_track sea nullable
3. THE Sistema SHALL usar el identificador único del archivo como valor del campo file_track

### Requirement 2: Vinculación de Archivos Durante Subida

**User Story:** Como usuario con permisos, quiero vincular archivos a rutas durante la subida, para asociar archivos de ruta con rutas específicas que no tienen archivo adjunto.

#### Acceptance Criteria

1. WHEN un Usuario_Con_Permisos sube un archivo, THE Sistema SHALL mostrar un listado de rutas disponibles para vinculación
2. THE Sistema SHALL mostrar únicamente rutas que no tienen archivo vinculado (file_track vacío)
3. WHEN el Usuario_Con_Permisos selecciona una ruta del listado, THE Sistema SHALL vincular el archivo únicamente a esa ruta
4. WHEN se completa la vinculación, THE Sistema SHALL actualizar el campo file_track con el Identificador_Archivo
5. THE Sistema SHALL permitir subir archivos sin vincular a ninguna ruta

### Requirement 3: Desvinculación de Archivos

**User Story:** Como usuario con permisos, quiero desvincular archivos de rutas durante la edición, para remover la asociación entre archivo y ruta.

#### Acceptance Criteria

1. WHEN un Usuario_Con_Permisos edita una ruta con archivo vinculado, THE Sistema SHALL mostrar opción de desvinculación
2. WHEN el Usuario_Con_Permisos confirma la desvinculación, THE Sistema SHALL establecer el campo file_track como vacío
3. WHEN se completa la desvinculación, THE Sistema SHALL mantener el archivo en el sistema sin vinculación

### Requirement 4: Descarga de Archivos Vinculados

**User Story:** Como usuario cualquiera, quiero descargar archivos vinculados a rutas, para obtener el archivo de ruta asociado desde la página de detalle.

#### Acceptance Criteria

1. WHEN un Usuario_Cualquiera visita la Página_Detalle_Ruta con Archivo_Vinculado, THE Sistema SHALL mostrar botón de descarga
2. THE Sistema SHALL posicionar el botón de descarga junto al botón 'Ver en Wikiloc'
3. WHEN existe botón de descarga, THE Sistema SHALL mostrar el mensaje: 'El archivo de descarga es el que se usará en la ruta. La ruta que aparece en wikiloc es solo de referencia'
4. WHEN el Usuario_Cualquiera hace clic en descargar, THE Sistema SHALL servir el Archivo_Vinculado para descarga
5. WHEN la ruta no tiene Archivo_Vinculado, THE Sistema SHALL ocultar el botón de descarga y el mensaje

### Requirement 5: Gestión de Archivos No Vinculados

**User Story:** Como usuario con permisos, quiero gestionar archivos no vinculados, para eliminar archivos que no están asociados a ninguna ruta.

#### Acceptance Criteria

1. THE Sistema SHALL proporcionar una página de gestión de archivos no vinculados
2. WHEN un Usuario_Con_Permisos accede a la página de gestión, THE Sistema SHALL mostrar listado de archivos sin vinculación
3. THE Sistema SHALL mostrar únicamente archivos que no están referenciados en ningún campo file_track
4. WHEN el Usuario_Con_Permisos selecciona eliminar un archivo, THE Sistema SHALL remover el archivo del sistema de archivos
5. WHEN se elimina un archivo, THE Sistema SHALL actualizar el listado automáticamente

### Requirement 6: Integración con Sistema Existente

**User Story:** Como desarrollador, quiero integrar la funcionalidad con la arquitectura existente, para mantener consistencia con el sistema actual.

#### Acceptance Criteria

1. THE Sistema SHALL seguir la arquitectura Controller/Service/Model existente
2. THE Sistema SHALL implementar la funcionalidad usando TypeScript y Angular
3. THE Sistema SHALL usar WebSockets para actualizaciones en tiempo real cuando sea apropiado
4. THE Sistema SHALL integrar con el sistema de archivos existente que genera identificadores únicos
5. THE Sistema SHALL mantener compatibilidad con la base de datos MySQL existente