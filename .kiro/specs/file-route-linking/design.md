# Design Document: File Route Linking

## Overview

Esta funcionalidad extiende el sistema de gestión de rutas existente para permitir la vinculación de archivos subidos a rutas específicas. La implementación sigue la arquitectura existente Controller/Service/Model con separación BLL/DAL, utilizando TypeScript, Angular, WebSockets y MySQL.

El diseño se centra en:
- Modificación mínima de la base de datos existente
- Integración transparente con el sistema de archivos actual
- Interfaz de usuario intuitiva para gestión de vinculaciones
- Mantenimiento de la arquitectura y patrones existentes

## Architecture

### Database Layer
- **Modificación de tabla `routes`**: Agregar campo `file_track VARCHAR(255) NULL`
- **Índice**: Crear índice en `file_track` para optimizar consultas de archivos vinculados
- **Integridad referencial**: El campo almacena el identificador único del archivo, sin foreign key para mantener flexibilidad

### Backend Architecture

```
Controller Layer (API Endpoints)
├── FileRouteController
│   ├── POST /api/files/upload-with-link
│   ├── GET /api/routes/available-for-linking
│   ├── PUT /api/routes/:id/unlink-file
│   ├── GET /api/files/download/:fileId
│   └── GET /api/files/unlinked
│
Service Layer (Business Logic)
├── FileRouteLinkingService
│   ├── linkFileToRoute()
│   ├── unlinkFileFromRoute()
│   ├── getAvailableRoutesForLinking()
│   ├── getUnlinkedFiles()
│   └── deleteUnlinkedFile()
│
Data Access Layer
├── RouteRepository (extended)
│   ├── updateFileTrack()
│   ├── findRoutesWithoutFiles()
│   └── findRouteByFileTrack()
└── FileRepository (new)
    ├── findUnlinkedFiles()
    └── deleteFile()
```

### Frontend Architecture

```
Angular Components
├── FileUploadComponent (extended)
│   └── Route selection during upload
├── RouteEditComponent (extended)
│   └── File unlinking functionality
├── RouteDetailComponent (extended)
│   └── Download button and messaging
└── FileManagementComponent (new)
    └── Unlinked files management

Angular Services
├── FileRouteLinkingService
│   ├── uploadFileWithLink()
│   ├── unlinkFileFromRoute()
│   ├── getAvailableRoutes()
│   ├── downloadLinkedFile()
│   └── manageUnlinkedFiles()
└── WebSocketService (extended)
    └── Real-time updates for file operations
```

## Components and Interfaces

### Backend Interfaces

```typescript
interface FileRouteLinkRequest {
  fileId: string;
  routeId: number;
}

interface RouteWithFileInfo {
  id: number;
  name: string;
  description: string;
  hasLinkedFile: boolean;
  fileTrack?: string;
}

interface UnlinkedFile {
  fileId: string;
  fileName: string;
  uploadDate: Date;
  fileSize: number;
}

interface FileDownloadResponse {
  fileId: string;
  fileName: string;
  filePath: string;
  mimeType: string;
}
```

### Frontend Interfaces

```typescript
interface RouteSelectionOption {
  id: number;
  name: string;
  description: string;
}

interface FileUploadWithLinkData {
  file: File;
  selectedRouteId?: number;
}

interface RouteDetailWithFile {
  route: Route;
  hasLinkedFile: boolean;
  downloadUrl?: string;
}
```

## Data Models

### Extended Route Model

```typescript
class Route {
  id: number;
  name: string;
  description: string;
  // ... existing fields
  fileTrack?: string; // New field for file linking
  
  hasLinkedFile(): boolean {
    return !!this.fileTrack;
  }
  
  getLinkedFileId(): string | null {
    return this.fileTrack || null;
  }
}
```

### New FileInfo Model

```typescript
class FileInfo {
  fileId: string;
  fileName: string;
  filePath: string;
  uploadDate: Date;
  fileSize: number;
  isLinked: boolean;
  linkedRouteId?: number;
  
  constructor(fileId: string, fileName: string, filePath: string) {
    this.fileId = fileId;
    this.fileName = fileName;
    this.filePath = filePath;
    this.uploadDate = new Date();
    this.isLinked = false;
  }
}
```

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de corrección verificables por máquina.*

### Property 1: File Track Consistency
*Para cualquier* archivo vinculado a una ruta, el valor del campo file_track debe ser igual al identificador único del archivo
**Validates: Requirements 1.3**

### Property 2: Available Routes for Linking
*Para cualquier* lista de rutas mostrada para vinculación durante subida de archivo, todas las rutas deben tener el campo file_track vacío
**Validates: Requirements 2.1, 2.2**

### Property 3: Exclusive File Linking
*Para cualquier* operación de vinculación completada, únicamente la ruta seleccionada debe tener el archivo vinculado y su file_track debe contener el identificador correcto
**Validates: Requirements 2.3, 2.4**

### Property 4: Optional File Linking
*Para cualquier* operación de subida de archivo, el sistema debe permitir completar la subida sin vincular el archivo a ninguna ruta
**Validates: Requirements 2.5**

### Property 5: Unlinking Option Visibility
*Para cualquier* ruta con archivo vinculado durante edición, debe aparecer la opción de desvinculación
**Validates: Requirements 3.1**

### Property 6: Unlinking Operation
*Para cualquier* operación de desvinculación confirmada, el campo file_track debe quedar vacío y el archivo debe permanecer en el sistema
**Validates: Requirements 3.2, 3.3**

### Property 7: Download Button and Message Display
*Para cualquier* ruta con archivo vinculado en página de detalle, debe aparecer el botón de descarga y el mensaje explicativo específico
**Validates: Requirements 4.1, 4.3**

### Property 8: File Download Service
*Para cualquier* clic en botón de descarga, debe servirse el archivo correcto vinculado a esa ruta
**Validates: Requirements 4.4**

### Property 9: Hidden Download Elements
*Para cualquier* ruta sin archivo vinculado, no debe aparecer botón de descarga ni mensaje explicativo
**Validates: Requirements 4.5**

### Property 10: Unlinked Files Display
*Para cualquier* acceso a la página de gestión de archivos, debe mostrar únicamente archivos que no están referenciados en ningún campo file_track
**Validates: Requirements 5.2, 5.3**

### Property 11: File Deletion
*Para cualquier* operación de eliminación de archivo no vinculado, el archivo debe ser removido del sistema y el listado debe actualizarse automáticamente
**Validates: Requirements 5.4, 5.5**

<function_calls>
<invoke name="prework">
<parameter name="featureName">file-route-linking

## Error Handling

### File Upload Errors
- **File size limits**: Validar tamaño máximo de archivo antes de mostrar rutas disponibles
- **File type validation**: Verificar tipos de archivo permitidos (GPX, KML, etc.)
- **Storage errors**: Manejar errores de escritura en sistema de archivos
- **Database errors**: Rollback de vinculación si falla actualización de file_track

### Linking Operation Errors
- **Route not available**: Validar que la ruta sigue disponible antes de vincular
- **Concurrent modifications**: Manejar casos donde otra operación modifica la ruta simultáneamente
- **File not found**: Verificar existencia del archivo antes de vincular
- **Permission errors**: Validar permisos de usuario antes de operaciones

### Download Errors
- **File not found**: Manejar casos donde el archivo vinculado fue eliminado del sistema
- **Access permissions**: Verificar permisos de descarga según configuración del sistema
- **Corrupted files**: Detectar y reportar archivos corruptos
- **Network errors**: Timeout y retry para descargas grandes

### Data Consistency Errors
- **Orphaned references**: Detectar y limpiar referencias a archivos inexistentes
- **Duplicate links**: Prevenir vinculación de un archivo a múltiples rutas
- **Invalid file_track values**: Validar formato de identificadores de archivo

## Testing Strategy

### Dual Testing Approach
La estrategia de testing combina pruebas unitarias y pruebas basadas en propiedades para cobertura completa:

**Unit Tests**:
- Casos específicos de vinculación y desvinculación
- Escenarios de error y casos límite
- Integración entre componentes frontend y backend
- Validación de permisos de usuario

**Property-Based Tests**:
- Propiedades universales que deben mantenerse para todas las entradas
- Cobertura exhaustiva de inputs mediante randomización
- Validación de invariantes del sistema
- Cada propiedad ejecutada con mínimo 100 iteraciones

**Testing Configuration**:
- Framework: Jest para backend, Jasmine/Karma para frontend
- Property testing: fast-check para TypeScript
- Cada test de propiedad debe referenciar su propiedad de diseño
- Formato de tag: **Feature: file-route-linking, Property {number}: {property_text}**

**Integration Testing**:
- Tests end-to-end para flujos completos de vinculación
- Validación de WebSocket updates en tiempo real
- Tests de base de datos con transacciones
- Simulación de errores de red y sistema de archivos

### Test Data Management
- Archivos de prueba con diferentes tamaños y formatos
- Datos de rutas con y sin archivos vinculados
- Usuarios con diferentes niveles de permisos
- Cleanup automático de archivos de prueba