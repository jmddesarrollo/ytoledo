# Fix: Descarga de archivos en detalles de ruta sin autenticación

## Problema identificado
En la página "Próxima ruta" cualquier usuario podía descargar archivos sin necesidad de iniciar sesión, pero en la página "detalles de la ruta" se requería autenticación, causando una inconsistencia en el comportamiento.

## Causa del problema
- **Próxima ruta**: Usaba el endpoint HTTP público `/api/routes/${fileTrack}/download` que no requiere autenticación
- **Detalles de ruta**: Usaba el servicio WebSocket `FileAttachmentService.downloadAttachedFile()` que requiere autenticación

## Solución implementada
Modificado el componente `route-detail.component.ts` para usar el mismo endpoint HTTP público que usa "Próxima ruta":

### Cambios realizados:

1. **Método `downloadAttachedFile()`**: Cambiado de WebSocket a HTTP endpoint público
   ```typescript
   // Antes: WebSocket (requiere autenticación)
   this.fileAttachmentService.downloadAttachedFile(fileTrack);
   
   // Después: HTTP endpoint público (sin autenticación)
   const downloadUrl = `/api/routes/${fileTrack}/download`;
   const link = document.createElement('a');
   link.href = downloadUrl;
   link.download = filenameTrack;
   link.click();
   ```

2. **Eliminadas dependencias innecesarias**:
   - Importación de `FileAttachmentService`
   - Inyección del servicio en el constructor
   - Suscripción al observable `onDownloadAttachedFile()`

3. **Simplificado el método `setupSubscriptions()`**: Eliminada la lógica compleja de manejo de respuestas WebSocket

## Resultado
Ahora tanto "Próxima ruta" como "detalles de la ruta" permiten descargar archivos sin necesidad de autenticación, manteniendo un comportamiento consistente en toda la aplicación.

## Archivos modificados
- `1_Project/1_Sources/frontend/src/app/components/routes/route-detail/route-detail.component.ts`

## Verificación
Para probar el fix:
1. Acceder a una ruta con archivo adjunto sin iniciar sesión
2. Hacer clic en el botón "Descargar"
3. Verificar que el archivo se descarga correctamente sin redirección al login