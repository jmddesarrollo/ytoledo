# Gestión de Rutas - Diseño

## 1. Arquitectura General

### 1.1 Visión de la Arquitectura
El sistema de gestión de rutas seguirá la arquitectura existente del proyecto, implementando el patrón de capas:
- **Presentación**: Componentes Angular con comunicación WebSocket
- **Controladores**: WebSocket controllers para manejo de eventos
- **Lógica de Negocio**: Services (BLL) para reglas de negocio
- **Acceso a Datos**: Data Access Layer (DAL) para operaciones de base de datos
- **Persistencia**: Modelos Sequelize para entidades de base de datos

### 1.2 Flujo de Datos
```
Frontend (Angular) ↔ WebSocket ↔ Controller ↔ BLL Service ↔ DAL Service ↔ Database
```

## 2. Modelo de Datos

### 2.1 Entidad Route

```typescript
interface Route {
  id: number;
  name: string;
  description: string;
  difficulty: 'Fácil' | 'Moderada' | 'Difícil' | 'Muy Difícil';
  distance: number; // en kilómetros
  estimatedDuration?: string; // formato HH:MM
  pointsOfInterest?: string; // JSON string con array de puntos
  coordinates?: string; // JSON string con coordenadas GPS
  isActive: boolean; // para soft delete
  createdAt: Date;
  updatedAt: Date;
  createdBy: number; // FK a users
  updatedBy?: number; // FK a users
}
```

### 2.2 Esquema de Base de Datos

```sql
CREATE TABLE routes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  difficulty ENUM('Fácil', 'Moderada', 'Difícil', 'Muy Difícil') NOT NULL,
  distance DECIMAL(8,2) NOT NULL,
  estimated_duration TIME NULL,
  points_of_interest JSON NULL,
  coordinates JSON NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  INDEX idx_name (name),
  INDEX idx_difficulty (difficulty),
  INDEX idx_distance (distance),
  INDEX idx_active (is_active)
);
```

## 3. Componentes del Sistema

### 3.1 Backend Components

#### 3.1.1 Route Model (`models/route.model.ts`)
```typescript
import { DataTypes, Model } from 'sequelize';

export class Route extends Model {
  public id!: number;
  public name!: string;
  public description!: string;
  public difficulty!: string;
  public distance!: number;
  public estimatedDuration?: string;
  public pointsOfInterest?: string;
  public coordinates?: string;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
  public createdBy!: number;
  public updatedBy?: number;
}
```

#### 3.1.2 Route Controller (`controllers/ws/route.controller.ts`)
Maneja eventos WebSocket:
- `route:list` - Obtener lista de rutas con filtros
- `route:get` - Obtener detalles de una ruta
- `route:create` - Crear nueva ruta
- `route:update` - Actualizar ruta existente
- `route:delete` - Eliminar ruta (soft delete)

#### 3.1.3 Route BLL (`services/route/route.bll.ts`)
Lógica de negocio:
- Validaciones de datos
- Verificación de permisos
- Reglas de negocio específicas
- Transformación de datos

#### 3.1.4 Route DAL (`services/route/route.dal.ts`)
Acceso a datos:
- Operaciones CRUD básicas
- Consultas con filtros y paginación
- Manejo de transacciones

### 3.2 Frontend Components

#### 3.2.1 Routes List Component (`components/routes/routes-list/`)
- Lista paginada de rutas
- Filtros por dificultad, distancia, fecha
- Búsqueda por nombre/descripción
- Acciones: ver, editar, eliminar

#### 3.2.2 Route Form Component (`components/routes/route-form/`)
- Formulario para crear/editar rutas
- Validaciones en tiempo real
- Manejo de estados de carga
- Integración con permisos

#### 3.2.3 Route Detail Component (`components/routes/route-detail/`)
- Vista detallada de una ruta
- Información completa
- Acciones contextuales según permisos

#### 3.2.4 Route Service (`services/websockets/route.service.ts`)
- Comunicación WebSocket con backend
- Manejo de eventos y respuestas
- Cache local de datos
- Manejo de errores

## 4. Permisos y Seguridad

### 4.1 Permisos Requeridos
```typescript
enum RoutePermissions {
  ROUTE_VIEW = 'route:view',
  ROUTE_CREATE = 'route:create', 
  ROUTE_UPDATE = 'route:update',
  ROUTE_DELETE = 'route:delete'
}
```

### 4.2 Matriz de Permisos
| Rol | Ver | Crear | Editar | Eliminar |
|-----|-----|-------|--------|----------|
| Administrador | ✓ | ✓ | ✓ | ✓ |
| Editor | ✓ | ✓ | ✓* | ✗ |
| Consultor | ✓ | ✗ | ✗ | ✗ |

*Editor solo puede editar rutas propias

### 4.3 Validaciones de Seguridad
- Autenticación requerida para todas las operaciones
- Verificación de permisos en cada endpoint
- Validación de datos en backend
- Sanitización de inputs
- Logs de auditoría

## 5. API Design (WebSocket Events)

### 5.1 Eventos de Consulta

#### `route:list`
```typescript
// Request
{
  event: 'route:list',
  data: {
    page?: number,
    limit?: number,
    filters?: {
      difficulty?: string,
      minDistance?: number,
      maxDistance?: number,
      search?: string
    }
  }
}

// Response
{
  success: boolean,
  data: {
    routes: Route[],
    total: number,
    page: number,
    totalPages: number
  }
}
```

#### `route:get`
```typescript
// Request
{
  event: 'route:get',
  data: { id: number }
}

// Response
{
  success: boolean,
  data: Route
}
```

### 5.2 Eventos de Modificación

#### `route:create`
```typescript
// Request
{
  event: 'route:create',
  data: {
    name: string,
    description: string,
    difficulty: string,
    distance: number,
    estimatedDuration?: string,
    pointsOfInterest?: string[],
    coordinates?: { lat: number, lng: number }[]
  }
}

// Response
{
  success: boolean,
  data: Route,
  message?: string
}
```

#### `route:update`
```typescript
// Request
{
  event: 'route:update',
  data: {
    id: number,
    // campos a actualizar
  }
}

// Response
{
  success: boolean,
  data: Route,
  message?: string
}
```

#### `route:delete`
```typescript
// Request
{
  event: 'route:delete',
  data: { id: number }
}

// Response
{
  success: boolean,
  message: string
}
```

## 6. Interfaz de Usuario

### 6.1 Wireframes Conceptuales

#### 6.1.1 Lista de Rutas
```
[Filtros: Dificultad ▼] [Distancia: Min___ Max___] [Buscar: ________] [🔍]

┌─────────────────────────────────────────────────────────────────┐
│ Nombre          │ Dificultad │ Distancia │ Creada    │ Acciones │
├─────────────────────────────────────────────────────────────────┤
│ Ruta del Pinar  │ Fácil      │ 5.2 km    │ 15/01/26  │ 👁️ ✏️ 🗑️  │
│ Subida al Cerro │ Difícil    │ 12.8 km   │ 10/01/26  │ 👁️ ✏️ 🗑️  │
└─────────────────────────────────────────────────────────────────┘

[← Anterior] [1] [2] [3] [Siguiente →]
```

#### 6.1.2 Formulario de Ruta
```
┌─────────────────────────────────────────┐
│ Crear/Editar Ruta                       │
├─────────────────────────────────────────┤
│ Nombre: [________________________]      │
│ Descripción:                            │
│ [_________________________________]     │
│ [_________________________________]     │
│                                         │
│ Dificultad: [Fácil ▼]                  │
│ Distancia (km): [_____]                 │
│ Duración estimada: [HH:MM]              │
│                                         │
│ Puntos de interés:                      │
│ [_________________________________]     │
│                                         │
│ [Cancelar] [Guardar]                    │
└─────────────────────────────────────────┘
```

### 6.2 Flujos de Usuario

#### 6.2.1 Crear Ruta
1. Usuario accede a lista de rutas
2. Hace clic en "Nueva Ruta"
3. Completa formulario con validaciones
4. Confirma creación
5. Sistema valida y guarda
6. Redirección a lista actualizada

#### 6.2.2 Editar Ruta
1. Usuario selecciona ruta de la lista
2. Hace clic en "Editar"
3. Sistema verifica permisos
4. Carga formulario con datos existentes
5. Usuario modifica campos
6. Confirma cambios
7. Sistema valida y actualiza

## 7. Validaciones y Reglas de Negocio

### 7.1 Validaciones Frontend
```typescript
const routeValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 100,
    unique: true
  },
  description: {
    maxLength: 1000
  },
  difficulty: {
    required: true,
    enum: ['Fácil', 'Moderada', 'Difícil', 'Muy Difícil']
  },
  distance: {
    required: true,
    min: 0.1,
    max: 999.99,
    decimal: 2
  },
  estimatedDuration: {
    pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  }
};
```

### 7.2 Validaciones Backend
- Sanitización de inputs
- Validación de tipos de datos
- Verificación de unicidad
- Validación de rangos numéricos
- Verificación de permisos

### 7.3 Reglas de Negocio
- Solo usuarios autenticados pueden acceder
- Nombres de rutas deben ser únicos
- Distancia debe ser positiva
- Soft delete para mantener historial
- Auditoría de todas las operaciones

## 8. Manejo de Errores

### 8.1 Tipos de Errores
```typescript
enum RouteErrorCodes {
  ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',
  ROUTE_NAME_EXISTS = 'ROUTE_NAME_EXISTS',
  INVALID_DIFFICULTY = 'INVALID_DIFFICULTY',
  INVALID_DISTANCE = 'INVALID_DISTANCE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}
```

### 8.2 Manejo de Errores Frontend
- Mensajes de error contextuales
- Validaciones en tiempo real
- Indicadores visuales de estado
- Recuperación graceful de errores

### 8.3 Manejo de Errores Backend
- Logging estructurado
- Respuestas de error consistentes
- Rollback de transacciones
- Notificación de errores críticos

## 9. Testing Strategy

### 9.1 Unit Tests
- Validaciones de modelos
- Lógica de servicios BLL
- Transformaciones de datos
- Utilidades y helpers

### 9.2 Integration Tests
- Endpoints WebSocket
- Flujos completos CRUD
- Integración con base de datos
- Verificación de permisos

### 9.3 Property-Based Tests
- Validación de invariantes de datos
- Propiedades de consistencia
- Comportamiento bajo diferentes inputs

## 10. Performance Considerations

### 10.1 Base de Datos
- Índices en campos de búsqueda frecuente
- Paginación eficiente
- Consultas optimizadas
- Connection pooling

### 10.2 Frontend
- Lazy loading de componentes
- Paginación virtual para listas grandes
- Debounce en búsquedas
- Cache de datos frecuentes

### 10.3 WebSocket
- Throttling de eventos
- Compresión de mensajes
- Reconexión automática
- Manejo de desconexiones

## 11. Deployment y Configuración

### 11.1 Variables de Entorno
```
ROUTES_PAGE_SIZE=20
ROUTES_MAX_DISTANCE=999.99
ROUTES_CACHE_TTL=300
```

### 11.2 Scripts de Base de Datos
- Script de creación de tabla
- Datos de prueba
- Índices adicionales
- Permisos iniciales

### 11.3 Configuración de Permisos
```sql
INSERT INTO permissions (name, description) VALUES
('route:view', 'Ver rutas'),
('route:create', 'Crear rutas'),
('route:update', 'Editar rutas'),
('route:delete', 'Eliminar rutas');
```

## 12. Correctness Properties

### 12.1 Data Integrity Properties
- **P1**: Una ruta creada debe tener todos los campos obligatorios válidos
- **P2**: El nombre de una ruta debe ser único en el sistema
- **P3**: La distancia de una ruta debe ser siempre un número positivo
- **P4**: Una ruta eliminada (soft delete) no debe aparecer en consultas normales

### 12.2 Business Logic Properties  
- **P5**: Solo usuarios con permisos adecuados pueden realizar operaciones CRUD
- **P6**: Toda operación de modificación debe registrar usuario y timestamp
- **P7**: Las validaciones de frontend deben ser consistentes con las de backend
- **P8**: Los filtros de búsqueda deben retornar solo rutas que cumplan los criterios

### 12.3 System Behavior Properties
- **P9**: El sistema debe mantener consistencia ante operaciones concurrentes
- **P10**: Los errores deben ser manejados gracefully sin corromper datos
- **P11**: Las operaciones CRUD deben ser atómicas
- **P12**: El sistema debe mantener logs de auditoría para todas las operaciones

Estas propiedades serán validadas mediante property-based testing usando la librería de testing configurada en el proyecto.