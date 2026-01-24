# Implementation Plan: File Attachment Routes

## Overview

Este plan implementa la funcionalidad de adjuntar archivos a rutas de manera integrada, aprovechando completamente la infraestructura existente de `file.bll.ts` y siguiendo la arquitectura Controller/Service/Model establecida. La implementación se enfoca en la integración directa en los formularios existentes y la creación de una página de gestión centralizada.

## Tasks

- [x] 1. Extender base de datos y modelos de datos
  - Agregar campos file_track y filename_track a la tabla routes
  - Crear interfaces TypeScript para AttachedFile, RouteWithFile, AttachedFileWithRoute
  - Actualizar modelo Route existente para incluir campos de archivo
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 2. Implementar FileAttachmentService
  - [x] 2.1 Crear servicio para gestión de archivos adjuntos
    - Implementar attachFileToRoute() usando File_Manager.generateIdentifier() y uploadFile()
    - Implementar removeFileFromRoute() usando File_Manager.delFiles()
    - Implementar getAttachedFile() y getAllAttachedFiles()
    - _Requirements: 1.2, 1.4, 2.3, 5.1, 5.2, 5.3_
  
  - [x] 2.2 Implementar deleteAttachedFiles() para gestión masiva
    - Crear método para eliminar múltiples archivos
    - Integrar con File_Manager.delFiles() y actualización de base de datos
    - _Requirements: 4.4, 5.3_

- [x] 3. Extender RouteService existente
  - Modificar createRoute() para manejar FileData opcional
  - Modificar updateRoute() para manejar adjuntar/quitar archivos
  - Implementar removeFileFromRoute() para limpiar campos de base de datos
  - Implementar getRoutesWithFiles() para página de gestión
  - _Requirements: 1.3, 2.2, 2.4, 4.1, 4.2_

- [ ] 4. Crear FileAttachmentComponent
  - [x] 4.1 Implementar componente de upload de archivos
    - Crear interfaz de selección de archivos con drag & drop
    - Implementar indicadores de progreso y estados de carga
    - Manejar validación de archivos (tamaño, tipo si es necesario)
    - _Requirements: 1.1, 2.1_
  
  - [x] 4.2 Implementar funcionalidad de quitar archivo
    - Mostrar archivo actual cuando existe
    - Proporcionar opción para quitar archivo adjunto
    - Manejar confirmación de eliminación
    - _Requirements: 2.1, 2.2_

- [x] 5. Extender RouteFormComponent
  - Integrar FileAttachmentComponent en formulario de crear/editar ruta
  - Manejar onFileAttached() y onFileRemoved() events
  - Extender handleFormSubmit() para procesar FileData
  - Manejar estados de carga durante operaciones de archivo
  - _Requirements: 1.1, 1.3, 2.1, 2.2_

- [x] 6. Checkpoint - Verificar funcionalidad básica de adjuntar/quitar archivos
  - Verificar que se pueden adjuntar archivos al crear rutas
  - Verificar que se pueden quitar archivos al editar rutas
  - Verificar que los campos de base de datos se actualizan correctamente

- [ ] 7. Extender páginas de detalle y próxima ruta
  - [-] 7.1 Mostrar botón de descarga cuando existe archivo adjunto
    - Agregar botón "Descargar" junto a "Ver en Wikiloc" en página de detalle
    - Agregar botón "Descargar" junto a "Ver en Wikiloc" en página de próxima ruta
    - Mostrar mensaje explicativo sobre archivo vs referencia Wikiloc
    - _Requirements: 3.1, 3.2_
  
  - [ ] 7.2 Implementar funcionalidad de descarga
    - Crear endpoint para descarga usando File_Manager.downloadFile()
    - Usar filename_track como nombre de descarga
    - Manejar errores de archivo no encontrado
    - _Requirements: 3.3, 3.4, 5.4_

- [ ] 8. Crear FileManagementComponent y página
  - [ ] 8.1 Implementar listado de archivos adjuntos
    - Mostrar tabla con archivo, ruta asociada, fecha
    - Implementar carga de datos con AttachedFileWithRoute
    - Agregar funcionalidad de selección múltiple
    - _Requirements: 4.1, 4.2_
  
  - [ ] 8.2 Implementar eliminación de archivos
    - Crear confirmación antes de eliminar archivos
    - Implementar eliminación masiva de archivos seleccionados
    - Actualizar lista después de eliminación
    - _Requirements: 4.3, 4.4_

- [ ] 9. Implementar controladores backend
  - [ ] 9.1 Extender RouteController
    - Modificar endpoints de crear/actualizar ruta para manejar archivos
    - Agregar endpoint para descarga de archivos adjuntos
    - Manejar validación y errores de archivos
    - _Requirements: 1.3, 1.4, 2.2, 2.3, 3.3, 3.4_
  
  - [ ] 9.2 Crear FileManagementController
    - Implementar endpoint para listar archivos adjuntos
    - Implementar endpoint para eliminar archivos múltiples
    - Manejar autorización para usuarios con permisos
    - _Requirements: 4.1, 4.2, 4.4_

- [ ] 10. Implementar manejo de errores y validaciones
  - Agregar validación de tipos de archivo si es necesario
  - Implementar manejo de errores de subida/descarga
  - Agregar cleanup de archivos huérfanos
  - Implementar mensajes de error en español
  - _Requirements: Error Handling section_

- [ ] 11. Agregar navegación y routing
  - Agregar ruta para página de gestión de archivos
  - Actualizar menú de navegación para usuarios autorizados
  - Configurar guards de autorización para página de gestión
  - _Requirements: 4.1_

- [ ] 12. Checkpoint final - Verificar integración completa
  - Verificar flujo completo de adjuntar archivos en crear/editar ruta
  - Verificar descarga de archivos desde página de detalle
  - Verificar gestión de archivos desde página administrativa
  - Verificar que todos los métodos de file.bll.ts se usan correctamente

## Notes

- Todos los tasks aprovechan la infraestructura existente de file.bll.ts sin modificaciones
- La implementación sigue la arquitectura Controller/Service/Model establecida
- Los checkpoints aseguran validación incremental de la funcionalidad
- Cada task referencia requirements específicos para trazabilidad
- No se incluyen tasks de testing según especificación del usuario