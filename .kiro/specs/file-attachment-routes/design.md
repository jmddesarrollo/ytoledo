# Design Document: File Attachment Routes

## Overview

Esta funcionalidad integra directamente la capacidad de adjuntar archivos a las rutas dentro del flujo existente de creación y edición de rutas. La solución aprovecha completamente la infraestructura existente de `file.bll.ts` y sigue la arquitectura establecida Controller/Service/Model con BLL/DAL.

La integración es transparente para el usuario: durante la creación o edición de una ruta, puede opcionalmente subir un archivo que quedará asociado a esa ruta. Los archivos se pueden descargar desde la página de detalle de la ruta y gestionar desde una página administrativa dedicada.

## Architecture

### Database Schema Extensions

Se extiende la tabla de rutas existente con dos nuevos campos:

```sql
ALTER TABLE routes ADD COLUMN file_track VARCHAR(255) DEFAULT '';
ALTER TABLE routes ADD COLUMN filename_track VARCHAR(255) DEFAULT '';
```

- `file_track`: Identificador único generado por `generateIdentifier()` del File_Manager
- `filename_track`: Nombre original del archivo con extensión para descarga

### Integration Points

1. **Route Form Integration**: El formulario de crear/editar ruta incluye componente de upload de archivos
2. **File Manager Reuse**: Utiliza métodos existentes de `file.bll.ts` sin modificaciones
3. **Route Detail Enhancement**: Página de detalle muestra botón de descarga cuando existe archivo
4. **Management Interface**: Nueva página para gestión centralizada de archivos adjuntos

## Components and Interfaces

### Frontend Components

#### FileAttachmentComponent
```typescript
interface FileAttachmentComponent {
  // Propiedades
  currentFile: AttachedFile | null;
  isUploading: boolean;
  uploadProgress: number;
  
  // Métodos
  onFileSelected(file: File): void;
  uploadFile(): Promise<void>;
  removeFile(): void;
  downloadFile(): void;
}
```

#### RouteFormComponent (Extended)
```typescript
interface RouteFormComponent {
  // Propiedades existentes + nuevas
  attachedFile: AttachedFile | null;
  fileToRemove: string | null; // file_track a eliminar
  
  // Métodos nuevos
  onFileAttached(file: AttachedFile): void;
  onFileRemoved(): void;
  handleFormSubmit(): void; // Extendido para manejar archivos
}
```

#### FileManagementComponent
```typescript
interface FileManagementComponent {
  attachedFiles: AttachedFileWithRoute[];
  selectedFiles: string[];
  
  loadAttachedFiles(): Promise<void>;
  confirmDelete(fileTrack: string): void;
  deleteFiles(fileTracks: string[]): Promise<void>;
}
```

### Backend Interfaces

#### RouteService (Extended)
```typescript
interface RouteService {
  // Métodos existentes + nuevos
  createRouteWithFile(routeData: RouteData, fileData: FileData): Promise<Route>;
  updateRouteWithFile(routeId: string, routeData: RouteData, fileData: FileData): Promise<Route>;
  removeFileFromRoute(routeId: string): Promise<void>;
  getRoutesWithFiles(): Promise<RouteWithFile[]>;
}
```

#### FileAttachmentService
```typescript
interface FileAttachmentService {
  attachFileToRoute(routeId: string, file: File): Promise<AttachedFile>;
  removeFileFromRoute(routeId: string): Promise<void>;
  getAttachedFile(fileTrack: string): Promise<AttachedFile>;
  getAllAttachedFiles(): Promise<AttachedFileWithRoute[]>;
  deleteAttachedFiles(fileTracks: string[]): Promise<void>;
}
```

## Data Models

### AttachedFile
```typescript
interface AttachedFile {
  fileTrack: string;        // Identificador único del archivo
  filenameTrack: string;    // Nombre original con extensión
  uploadDate: Date;         // Fecha de subida
  fileSize: number;         // Tamaño en bytes
  mimeType: string;         // Tipo MIME del archivo
}
```

### RouteWithFile
```typescript
interface RouteWithFile extends Route {
  attachedFile: AttachedFile | null;
}
```

### AttachedFileWithRoute
```typescript
interface AttachedFileWithRoute extends AttachedFile {
  routeId: string;
  routeName: string;
  routeDate: Date;
}
```

### FileData
```typescript
interface FileData {
  file?: File;              // Archivo a subir (opcional)
  removeExisting?: boolean; // Flag para eliminar archivo existente
}
```

## Implementation Flow

### File Upload Flow
1. Usuario selecciona archivo en RouteFormComponent
2. FileAttachmentComponent valida el archivo
3. Al guardar ruta, RouteService llama a FileAttachmentService
4. FileAttachmentService usa File_Manager.generateIdentifier()
5. FileAttachmentService usa File_Manager.uploadFile()
6. RouteService guarda file_track y filename_track en base de datos

### File Removal Flow
1. Usuario hace clic en "Quitar archivo" en RouteFormComponent
2. Se marca fileToRemove con el file_track actual
3. Al guardar ruta, RouteService detecta fileToRemove
4. FileAttachmentService usa File_Manager.delFiles()
5. RouteService limpia file_track y filename_track en base de datos

### File Download Flow
1. Usuario hace clic en "Descargar" en página de detalle
2. RouteController recibe solicitud con file_track
3. FileAttachmentService usa File_Manager.downloadFile()
4. Archivo se sirve con filename_track como nombre de descarga

### File Management Flow
1. Usuario accede a página de gestión de archivos
2. FileManagementComponent carga lista de AttachedFileWithRoute
3. Usuario selecciona archivos y confirma eliminación
4. FileAttachmentService elimina archivos del servidor y base de datos

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File upload form availability
*For any* route creation or editing form, when accessed by an authorized user, the form should include file attachment functionality
**Validates: Requirements 1.1**

### Property 2: Unique identifier generation
*For any* file upload operation, the File_Manager should generate a unique identifier using generateIdentifier()
**Validates: Requirements 1.2, 5.1**

### Property 3: File data persistence
*For any* route saved with an attached file, the database should contain non-empty file_track and filename_track values
**Validates: Requirements 1.3**

### Property 4: File upload integration
*For any* completed file upload, the File_Manager should use uploadFile() to store the file on the server
**Validates: Requirements 1.4, 5.2**

### Property 5: File removal option availability
*For any* route editing form where the route has an attached file, the form should display an option to remove the file
**Validates: Requirements 2.1**

### Property 6: File data cleanup
*For any* route where the attached file is removed, the file_track and filename_track fields should be emptied in the database
**Validates: Requirements 2.2**

### Property 7: File deletion integration
*For any* route saved without a file (after having one), the File_Manager should use delFiles() to remove the file from the server
**Validates: Requirements 2.3, 5.3**

### Property 8: Route data integrity during file removal
*For any* route where the attached file is removed, all other route data should remain unchanged
**Validates: Requirements 2.4**

### Property 9: Download button availability
*For any* route detail page where the route has an attached file, a download button should appear next to the 'Ver en Wikiloc' button
**Validates: Requirements 3.1**

### Property 10: File download integration
*For any* file download request, the File_Manager should use downloadFile() to serve the file
**Validates: Requirements 3.3, 5.4**

### Property 11: Download filename preservation
*For any* file download, the served file should use the filename_track value as the download name
**Validates: Requirements 3.4**

### Property 12: Management page file listing
*For any* file management page access by an authorized user, the page should display all attached files with their associated route information
**Validates: Requirements 4.1, 4.2**

### Property 13: Deletion confirmation requirement
*For any* file deletion request in the management page, a confirmation dialog should be displayed before proceeding
**Validates: Requirements 4.3**

### Property 14: Management deletion integration
*For any* confirmed file deletion from the management page, the system should use delFiles() and update the corresponding route fields
**Validates: Requirements 4.4**

### Property 15: Default empty values
*For any* route without an attached file, both file_track and filename_track should contain empty strings
**Validates: Requirements 6.3, 6.4**

## Error Handling

### File Upload Errors
- **File size limits**: Validate file size before upload, show user-friendly error messages
- **File type restrictions**: Validate file types if needed, reject unsupported formats
- **Upload failures**: Handle network errors, server errors, and storage failures gracefully
- **Duplicate identifiers**: Retry identifier generation if collision occurs (unlikely but possible)

### File Access Errors
- **Missing files**: Handle cases where file_track exists but physical file is missing
- **Permission errors**: Handle server permission issues for file operations
- **Corrupted files**: Detect and handle corrupted file scenarios

### Database Consistency
- **Transaction rollback**: Ensure file operations and database updates are atomic
- **Orphaned files**: Implement cleanup for files without corresponding database records
- **Orphaned records**: Handle database records pointing to non-existent files

### User Experience
- **Loading states**: Show progress indicators during file operations
- **Error messages**: Provide clear, actionable error messages in Spanish
- **Graceful degradation**: System should work normally even if file operations fail

## Testing Strategy

### Unit Testing Approach
Given the user's specification that no testing tasks should be included, this section serves as documentation for future testing considerations:

**Core Functionality Tests**:
- File upload, removal, and download operations
- Database field updates and cleanup
- Integration with existing File_Manager methods
- Form validation and user interaction flows

**Integration Tests**:
- End-to-end file attachment workflow
- Route creation/editing with file operations
- File management page functionality
- Error handling and recovery scenarios

**Property-Based Testing Configuration**:
- Would use appropriate testing framework for TypeScript/Angular
- Each correctness property would be implemented as automated tests
- Minimum 100 iterations per property test for comprehensive coverage
- Tests would be tagged with feature name and property references

### Manual Testing Considerations
- Cross-browser compatibility for file upload functionality
- File type and size validation
- User permission verification
- UI/UX validation for Spanish language interface
- Performance testing with various file sizes