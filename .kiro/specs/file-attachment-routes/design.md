# Adjuntar Archivos a Rutas - Diseño

## 1. Arquitectura General

### 1.1 Visión de la Arquitectura
El sistema de archivos adjuntos extiende la arquitectura existente del sistema de rutas, manteniendo el patrón de capas establecido:
- **Presentación**: Componentes Angular extendidos con funcionalidad de archivos
- **Controladores**: WebSocket controllers extendidos para manejo de archivos
- **Lógica de Negocio**: Services (BLL) para reglas de negocio de archivos
- **Acceso a Datos**: DAL extendido para operaciones con archivos
- **Persistencia**: Modelo Route extendido + nuevo modelo FileAttachment
- **Almacenamiento**: Sistema de archivos existente con estructura de carpetas

### 1.2 Flujo de Datos Extendido
```
Frontend (Angular) ↔ WebSocket ↔ Controller ↔ BLL Service ↔ DAL Service ↔ Database
                                      ↓
                              File System (Existing)
```

### 1.3 Integración con Sistema Existente
- Extiende el modelo Route con campo `file_track`
- Reutiliza sistema de subida de archivos existente
- Mantiene compatibilidad total con funcionalidades de rutas
- Sigue patrones WebSocket establecidos

## 2. Modelo de Datos

### 2.1 Extensión del Modelo Route

```typescript
interface RouteExtended extends Route {
  file_track?: string; // Identificador único del archivo adjunto
}
```

### 2.2 Nuevo Modelo FileAttachment

```typescript
interface FileAttachment {
  id: string; // Identificador único generado por sistema existente
  originalName: string; // Nombre original del archivo
  fileName: string; // Nombre del archivo en el sistema
  filePath: string; // Ruta completa del archivo
  fileSize: number; // Tamaño en bytes
  mimeType: string; // Tipo MIME del archivo
  isLinked: boolean; // Si está vinculado a una ruta
  linkedRouteId?: number; // ID de la ruta vinculada
  uploadedAt: Date;
  uploadedBy: number; // FK a users
}
```

### 2.3 Extensión del Esquema de Base de Datos

```sql
-- Extensión de tabla routes existente
ALTER TABLE routes 
ADD COLUMN file_track VARCHAR(255) NULL,
ADD INDEX idx_file_track (file_track);

-- Nueva tabla para gestión de archivos (opcional, para tracking)
CREATE TABLE file_attachments (
  id VARCHAR(255) PRIMARY KEY, -- Mismo ID que genera el sistema existente
  original_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  is_linked BOOLEAN DEFAULT FALSE,
  linked_route_id INT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by INT NOT NULL,
  FOREIGN KEY (linked_route_id) REFERENCES routes(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_is_linked (is_linked),
  INDEX idx_linked_route (linked_route_id)
);
```

## 3. Componentes del Sistema

### 3.1 Backend Components

#### 3.1.1 Extensión Route Model (`models/route.model.ts`)
```typescript
export class Route extends Model {
  // ... campos existentes
  public fileTrack?: string; // Nuevo campo
}

// Actualizar definición del modelo
Route.init({
  // ... campos existentes
  fileTrack: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'file_track'
  }
}, {
  // ... configuración existente
});
```

#### 3.1.2 Nuevo FileAttachment Model (`models/fileAttachment.model.ts`)
```typescript
export class FileAttachment extends Model {
  public id!: string;
  public originalName!: string;
  public fileName!: string;
  public filePath!: string;
  public fileSize!: number;
  public mimeType!: string;
  public isLinked!: boolean;
  public linkedRouteId?: number;
  public uploadedAt!: Date;
  public uploadedBy!: number;
}
```

#### 3.1.3 Extensión Route Controller (`controllers/ws/route.controller.ts`)
Nuevos eventos WebSocket:
- `route:upload-file` - Subir archivo y mostrar rutas disponibles
- `route:link-file` - Vincular archivo a ruta específica
- `route:unlink-file` - Desvincular archivo de ruta
- `route:download-file` - Descargar archivo vinculado
- `file:list-orphaned` - Listar archivos huérfanos
- `file:delete-orphaned` - Eliminar archivo huérfano

#### 3.1.4 Nuevo FileAttachment BLL (`services/fileAttachment/fileAttachment.bll.ts`)
Lógica de negocio:
- Validación de tipos de archivo permitidos
- Gestión de vinculación/desvinculación
- Lógica de archivos huérfanos
- Integración con sistema de archivos existente

#### 3.1.5 Nuevo FileAttachment DAL (`services/fileAttachment/fileAttachment.dal.ts`)
Acceso a datos:
- CRUD de registros de archivos
- Consultas de archivos huérfanos
- Actualización de estado de vinculación
- Integración con Route DAL

### 3.2 Frontend Components

#### 3.2.1 Extensión Route Form Component
- Nuevo campo para mostrar archivo vinculado
- Botón para desvincular archivo
- Indicador visual de estado de archivo

#### 3.2.2 Extensión Route Detail Component
- Botón de descarga cuando hay archivo vinculado
- Mensaje explicativo sobre uso del archivo
- Integración con botón de Wikiloc existente

#### 3.2.3 Nuevo File Upload Component (`components/files/file-upload/`)
- Subida de archivos con validación
- Lista de rutas disponibles para vinculación
- Confirmación de vinculación exitosa

#### 3.2.4 Nuevo File Management Component (`components/files/file-management/`)
- Lista de archivos huérfanos
- Información detallada de archivos
- Funcionalidad de eliminación con confirmación

#### 3.2.5 Extensión Route Service (`services/websockets/route.service.ts`)
Nuevos métodos:
- `uploadAndLinkFile(file: File, routeId: number)`
- `unlinkFile(routeId: number)`
- `downloadFile(fileId: string)`
- `getOrphanedFiles()`
- `deleteOrphanedFile(fileId: string)`

## 4. Permisos y Seguridad

### 4.1 Permisos Requeridos
```typescript
enum FileAttachmentPermissions {
  FILE_UPLOAD = 'file:upload',
  FILE_LINK = 'file:link',
  FILE_UNLINK = 'file:unlink',
  FILE_DOWNLOAD = 'file:download', // Público
  FILE_MANAGE = 'file:manage' // Solo administradores
}
```

### 4.2 Matriz de Permisos
| Rol | Subir | Vincular | Desvincular | Descargar | Gestionar |
|-----|-------|----------|-------------|-----------|-----------|
| Administrador | ✓ | ✓ | ✓ | ✓ | ✓ |
| Editor | ✓ | ✓ | ✓* | ✓ | ✗ |
| Consultor | ✗ | ✗ | ✗ | ✓ | ✗ |
| Público | ✗ | ✗ | ✗ | ✓ | ✗ |

*Editor solo puede desvincular archivos de rutas propias

### 4.3 Validaciones de Seguridad
- Validación de tipos de archivo permitidos (GPX, KML, TCX, FIT)
- Validación de tamaño máximo (10MB)
- Sanitización de nombres de archivo
- Verificación de existencia de archivos antes de descarga
- Logs de auditoría para operaciones de archivos

## 5. API Design (WebSocket Events)

### 5.1 Eventos de Gestión de Archivos

#### `route:upload-file`
```typescript
// Request
{
  event: 'route:upload-file',
  data: {
    file: File, // Archivo a subir
    metadata: {
      originalName: string,
      size: number,
      type: string
    }
  }
}

// Response
{
  success: boolean,
  data: {
    fileId: string,
    availableRoutes: Route[] // Rutas sin archivo adjunto
  },
  message?: string
}
```

#### `route:link-file`
```typescript
// Request
{
  event: 'route:link-file',
  data: {
    fileId: string,
    routeId: number
  }
}

// Response
{
  success: boolean,
  data: {
    route: Route, // Ruta actualizada con file_track
    fileAttachment: FileAttachment
  },
  message?: string
}
```

#### `route:unlink-file`
```typescript
// Request
{
  event: 'route:unlink-file',
  data: {
    routeId: number
  }
}

// Response
{
  success: boolean,
  data: {
    route: Route, // Ruta con file_track = null
    orphanedFileId: string
  },
  message?: string
}
```

#### `route:download-file`
```typescript
// Request
{
  event: 'route:download-file',
  data: {
    routeId: number
  }
}

// Response
{
  success: boolean,
  data: {
    downloadUrl: string, // URL temporal para descarga
    fileName: string,
    fileSize: number
  }
}
```

### 5.2 Eventos de Gestión de Archivos Huérfanos

#### `file:list-orphaned`
```typescript
// Request
{
  event: 'file:list-orphaned',
  data: {
    page?: number,
    limit?: number
  }
}

// Response
{
  success: boolean,
  data: {
    files: FileAttachment[],
    total: number,
    page: number,
    totalPages: number
  }
}
```

#### `file:delete-orphaned`
```typescript
// Request
{
  event: 'file:delete-orphaned',
  data: {
    fileId: string
  }
}

// Response
{
  success: boolean,
  message: string
}
```

## 6. Interfaz de Usuario

### 6.1 Wireframes Conceptuales

#### 6.1.1 Subida y Vinculación de Archivos
```
┌─────────────────────────────────────────┐
│ Subir Archivo de Track                  │
├─────────────────────────────────────────┤
│ [Seleccionar Archivo] archivo.gpx       │
│                                         │
│ Rutas disponibles para vincular:        │
│ ○ Ruta del Pinar (5.2 km)              │
│ ○ Sendero del Río (8.1 km)             │
│ ○ Subida al Cerro (12.8 km)            │
│                                         │
│ [Cancelar] [Subir y Vincular]           │
└─────────────────────────────────────────┘
```

#### 6.1.2 Detalle de Ruta con Archivo
```
┌─────────────────────────────────────────┐
│ Ruta del Pinar                          │
├─────────────────────────────────────────┤
│ Descripción: Ruta fácil por el pinar... │
│ Dificultad: Fácil | Distancia: 5.2 km  │
│                                         │
│ [📥 Descargar Track] [🌐 Ver en Wikiloc]│
│                                         │
│ ℹ️ El archivo de descarga es el que se  │
│   usará en la ruta. La ruta que aparece │
│   en wikiloc es solo de referencia      │
└─────────────────────────────────────────┘
```

#### 6.1.3 Formulario de Edición con Archivo
```
┌─────────────────────────────────────────┐
│ Editar Ruta                             │
├─────────────────────────────────────────┤
│ Nombre: [Ruta del Pinar____________]    │
│ Descripción: [___________________]      │
│                                         │
│ Archivo adjunto: 📎 ruta_pinar.gpx     │
│ [🗑️ Desvincular archivo]                │
│                                         │
│ [Cancelar] [Guardar Cambios]            │
└─────────────────────────────────────────┘
```

#### 6.1.4 Gestión de Archivos Huérfanos
```
┌─────────────────────────────────────────────────────────────────┐
│ Gestión de Archivos                                             │
├─────────────────────────────────────────────────────────────────┤
│ Archivos no vinculados:                                         │
│                                                                 │
│ 📄 track_montaña.gpx    │ 2.1 MB │ 15/01/26 │ [🗑️ Eliminar]    │
│ 📄 ruta_costera.kml     │ 1.8 MB │ 12/01/26 │ [🗑️ Eliminar]    │
│ 📄 sendero_bosque.tcx   │ 3.2 MB │ 10/01/26 │ [🗑️ Eliminar]    │
│                                                                 │
│ Total: 3 archivos (7.1 MB)                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Flujos de Usuario

#### 6.2.1 Subir y Vincular Archivo
1. Usuario accede a página de subida de archivos
2. Selecciona archivo del sistema
3. Sistema valida tipo y tamaño
4. Sistema muestra rutas disponibles (sin archivo)
5. Usuario selecciona ruta específica
6. Confirma vinculación
7. Sistema sube archivo y actualiza ruta
8. Confirmación de éxito

#### 6.2.2 Descargar Archivo de Ruta
1. Usuario (público) accede a detalle de ruta
2. Sistema verifica si ruta tiene archivo vinculado
3. Si existe, muestra botón de descarga
4. Usuario hace clic en descargar
5. Sistema genera URL temporal
6. Descarga se inicia automáticamente

#### 6.2.3 Desvincular Archivo
1. Usuario edita ruta con archivo vinculado
2. Sistema muestra archivo actual
3. Usuario hace clic en "Desvincular"
4. Sistema solicita confirmación
5. Usuario confirma
6. Sistema actualiza ruta (file_track = null)
7. Archivo queda como huérfano

## 7. Validaciones y Reglas de Negocio

### 7.1 Validaciones de Archivos
```typescript
const fileValidationRules = {
  allowedTypes: ['application/gpx+xml', 'application/vnd.google-earth.kml+xml', 'application/tcx+xml', 'application/fit'],
  allowedExtensions: ['.gpx', '.kml', '.tcx', '.fit'],
  maxSize: 10 * 1024 * 1024, // 10MB
  maxNameLength: 255
};
```

### 7.2 Reglas de Negocio
- Un archivo solo puede estar vinculado a una ruta
- Una ruta solo puede tener un archivo vinculado
- Solo usuarios autenticados pueden subir archivos
- Archivos huérfanos pueden ser eliminados por administradores
- Descargas son públicas para rutas con archivos vinculados
- Nombres de archivo se sanitizan al subir

### 7.3 Validaciones de Integración
- Verificar que ruta existe antes de vincular
- Verificar que archivo existe antes de descargar
- Verificar permisos antes de operaciones de gestión
- Mantener consistencia entre Route.file_track y FileAttachment.linkedRouteId

## 8. Manejo de Errores

### 8.1 Tipos de Errores
```typescript
enum FileAttachmentErrorCodes {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',
  ROUTE_ALREADY_HAS_FILE = 'ROUTE_ALREADY_HAS_FILE',
  FILE_ALREADY_LINKED = 'FILE_ALREADY_LINKED',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}
```

### 8.2 Manejo de Errores Frontend
- Validación de archivos antes de subida
- Mensajes de error específicos por tipo
- Indicadores de progreso durante subida
- Recuperación graceful de errores de red

### 8.3 Manejo de Errores Backend
- Validación exhaustiva de archivos
- Rollback de operaciones fallidas
- Logging de errores de archivo
- Limpieza de archivos huérfanos en caso de error

## 9. Integración con Sistema Existente

### 9.1 Reutilización de Componentes
- Sistema de subida de archivos existente
- Controladores de descarga existentes
- Sistema de permisos y autenticación
- Patrones de validación y error handling

### 9.2 Extensiones Necesarias
- Nuevo campo en modelo Route
- Nuevos eventos WebSocket
- Nuevos componentes de UI
- Nueva tabla FileAttachment (opcional)

### 9.3 Compatibilidad
- Rutas existentes sin archivo siguen funcionando
- No se rompe funcionalidad existente
- Migración transparente de datos
- Rollback posible si es necesario

## 10. Testing Strategy

### 10.1 Unit Tests
- Validaciones de archivo
- Lógica de vinculación/desvinculación
- Transformaciones de datos
- Servicios de gestión de archivos

### 10.2 Integration Tests
- Flujo completo de subida y vinculación
- Descarga de archivos vinculados
- Gestión de archivos huérfanos
- Integración con sistema de rutas existente

### 10.3 Property-Based Tests
- Invariantes de vinculación (un archivo = una ruta)
- Consistencia de datos entre modelos
- Comportamiento con diferentes tipos de archivo
- Propiedades de limpieza de archivos huérfanos