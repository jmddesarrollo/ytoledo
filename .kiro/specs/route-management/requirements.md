# Gestión de Rutas - Requerimientos

## 1. Visión General

Desarrollar un sistema completo de gestión de rutas para el club de senderismo que permita a los administradores y usuarios autorizados crear, editar, consultar y eliminar rutas de senderismo, reemplazando el sistema manual actual.

## 2. Objetivos

- Digitalizar la gestión de rutas del club de senderismo
- Proporcionar una interfaz intuitiva para la administración de rutas
- Mantener consistencia con la arquitectura existente del sistema
- Permitir control granular de permisos sobre las operaciones de rutas

## 3. Usuarios del Sistema

### 3.1 Administrador de Rutas
- **Descripción**: Usuario con permisos completos sobre la gestión de rutas
- **Responsabilidades**: Crear, editar, eliminar y consultar todas las rutas

### 3.2 Editor de Rutas  
- **Descripción**: Usuario con permisos limitados de edición
- **Responsabilidades**: Crear y editar rutas, consultar todas las rutas

### 3.3 Consultor de Rutas
- **Descripción**: Usuario con permisos de solo lectura
- **Responsabilidades**: Consultar y visualizar rutas existentes

## 4. Historias de Usuario

### 4.1 Como administrador de rutas
- **HU-001**: Como administrador, quiero crear nuevas rutas especificando nombre, descripción, dificultad, distancia, duración estimada y puntos de interés, para ampliar la oferta del club.
- **HU-002**: Como administrador, quiero editar cualquier ruta existente para mantener la información actualizada.
- **HU-003**: Como administrador, quiero eliminar rutas obsoletas o incorrectas para mantener la calidad del catálogo.
- **HU-004**: Como administrador, quiero consultar todas las rutas con filtros y búsqueda para gestionar eficientemente el catálogo.

### 4.2 Como editor de rutas
- **HU-005**: Como editor, quiero crear nuevas rutas siguiendo las mismas especificaciones que el administrador.
- **HU-006**: Como editor, quiero editar rutas que he creado o que tengo permisos para modificar.
- **HU-007**: Como editor, quiero consultar todas las rutas disponibles para coordinar con otros editores.

### 4.3 Como consultor de rutas
- **HU-008**: Como consultor, quiero ver la lista completa de rutas con información básica.
- **HU-009**: Como consultor, quiero ver los detalles completos de una ruta específica.
- **HU-010**: Como consultor, quiero filtrar y buscar rutas por diferentes criterios.

## 5. Criterios de Aceptación

### 5.1 Gestión de Rutas (CRUD)

#### 5.1.1 Crear Ruta
- **AC-001**: El sistema debe permitir crear una ruta con los campos obligatorios: nombre, descripción, dificultad, distancia
- **AC-002**: El sistema debe validar que el nombre de la ruta sea único
- **AC-003**: El sistema debe validar que la distancia sea un número positivo
- **AC-004**: El sistema debe permitir campos opcionales: duración estimada, puntos de interés, coordenadas GPS
- **AC-005**: El sistema debe asignar automáticamente fecha de creación y usuario creador

#### 5.1.2 Editar Ruta
- **AC-006**: El sistema debe permitir editar todos los campos de una ruta existente
- **AC-007**: El sistema debe validar permisos antes de permitir la edición
- **AC-008**: El sistema debe mantener un registro de la última modificación (fecha y usuario)
- **AC-009**: El sistema debe validar la unicidad del nombre al editar

#### 5.1.3 Consultar Rutas
- **AC-010**: El sistema debe mostrar una lista paginada de todas las rutas
- **AC-011**: El sistema debe permitir filtrar por dificultad, distancia y fecha de creación
- **AC-012**: El sistema debe permitir búsqueda por nombre y descripción
- **AC-013**: El sistema debe mostrar información resumida en la lista (nombre, dificultad, distancia)
- **AC-014**: El sistema debe permitir ver detalles completos de una ruta específica

#### 5.1.4 Eliminar Ruta
- **AC-015**: El sistema debe permitir eliminar rutas solo a usuarios con permisos adecuados
- **AC-016**: El sistema debe solicitar confirmación antes de eliminar una ruta
- **AC-017**: El sistema debe realizar eliminación lógica (soft delete) manteniendo registro histórico

### 5.2 Validaciones y Reglas de Negocio

#### 5.2.1 Validaciones de Datos
- **AC-018**: El nombre de la ruta debe tener entre 3 y 100 caracteres
- **AC-019**: La descripción debe tener máximo 1000 caracteres
- **AC-020**: La dificultad debe ser uno de los valores: Fácil, Moderada, Difícil, Muy Difícil
- **AC-021**: La distancia debe ser un número decimal positivo con máximo 2 decimales
- **AC-022**: La duración estimada debe estar en formato HH:MM

#### 5.2.2 Permisos y Seguridad
- **AC-023**: Solo usuarios autenticados pueden acceder al sistema de rutas
- **AC-024**: Los permisos de creación, edición y eliminación deben ser verificados en cada operación
- **AC-025**: Las operaciones deben registrarse en logs de auditoría
- **AC-026**: Los datos sensibles deben ser validados en backend independientemente del frontend

### 5.3 Interfaz de Usuario

#### 5.3.1 Lista de Rutas
- **AC-027**: La interfaz debe mostrar una tabla responsive con las rutas
- **AC-028**: Debe incluir controles de paginación cuando hay más de 20 rutas
- **AC-029**: Debe incluir filtros accesibles y fáciles de usar
- **AC-030**: Debe mostrar indicadores visuales del estado de carga

#### 5.3.2 Formulario de Ruta
- **AC-031**: El formulario debe ser responsive y accesible
- **AC-032**: Debe mostrar validaciones en tiempo real
- **AC-033**: Debe incluir ayuda contextual para cada campo
- **AC-034**: Debe permitir guardar como borrador y publicar

#### 5.3.3 Botones de Acción
- **AC-043**: Los botones de acción deben mostrar iconos claros y descriptivos (ojo para ver, lápiz para editar, papelera para eliminar)
- **AC-044**: Los botones deben mantener su visibilidad y color base al hacer hover
- **AC-045**: Al hacer hover, solo el icono debe cambiar a un color más intenso o contrastante
- **AC-046**: Los botones deben tener tooltips descriptivos para mejorar la accesibilidad

#### 5.3.4 Manejo de Valores Cero
- **AC-047**: El formulario debe manejar correctamente los valores cero en campos numéricos
- **AC-048**: Los campos con valor cero no deben considerarse como campos vacíos
- **AC-049**: Al editar una ruta con valores cero, estos deben mantenerse visibles en el formulario
- **AC-050**: El botón de actualizar debe permanecer habilitado cuando hay valores cero válidos

### 5.4 Integración con Sistema Existente

#### 5.4.1 Arquitectura
- **AC-035**: Debe seguir el patrón de arquitectura existente (Controller/Service/Model)
- **AC-036**: Debe utilizar WebSockets para comunicación en tiempo real
- **AC-037**: Debe integrarse con el sistema de permisos existente
- **AC-038**: Debe seguir las convenciones de naming y estructura del proyecto

#### 5.4.2 Base de Datos
- **AC-039**: Debe crear las tablas necesarias siguiendo el esquema existente
- **AC-040**: Debe mantener integridad referencial con tablas de usuarios
- **AC-041**: Debe incluir índices apropiados para optimizar consultas
- **AC-042**: Debe incluir campos de auditoría (created_at, updated_at, created_by, updated_by)

## 6. Restricciones Técnicas

### 6.1 Tecnológicas
- Debe utilizar TypeScript tanto en backend como frontend
- Debe seguir la arquitectura de servicios existente (BLL/DAL)
- Debe utilizar WebSockets para comunicación tiempo real
- Debe ser compatible con la base de datos MySQL existente

### 6.2 De Rendimiento
- Las consultas de lista deben responder en menos de 2 segundos
- La paginación debe manejar eficientemente grandes volúmenes de datos
- Las operaciones CRUD deben completarse en menos de 1 segundo

### 6.3 De Seguridad
- Todas las operaciones deben validar permisos en backend
- Los datos de entrada deben ser sanitizados y validados
- Debe mantener logs de auditoría para todas las operaciones

## 7. Criterios de Éxito

- **Funcionalidad**: Todas las operaciones CRUD funcionan correctamente
- **Usabilidad**: Los usuarios pueden gestionar rutas de forma intuitiva
- **Rendimiento**: El sistema responde dentro de los tiempos establecidos
- **Integración**: Se integra seamlessly con el sistema existente
- **Mantenibilidad**: El código sigue las convenciones y patrones existentes

### 4.4 Como usuario del sistema
- **HU-011**: Como usuario, quiero que los botones de acción (consultar, editar, eliminar) tengan iconos claros y permanezcan visibles con efectos hover apropiados para una mejor experiencia de usuario.

## 8. Fuera del Alcance

- Integración con sistemas de mapas externos (GPS/Google Maps)
- Funcionalidades de reserva o inscripción a rutas
- Sistema de calificaciones o comentarios de rutas
- Exportación de rutas a formatos GPX o KML
- Notificaciones automáticas sobre cambios en rutas