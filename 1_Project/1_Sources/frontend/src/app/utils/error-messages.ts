/**
 * Centralized error messages in Spanish for file attachment functionality
 * Requirements: Error Handling section
 */

export class ErrorMessages {
  
  // File validation errors
  static readonly FILE_VALIDATION = {
    NO_FILE_PROVIDED: 'No se ha seleccionado ningún archivo',
    INVALID_FILE_NAME: 'El archivo debe tener un nombre válido',
    FILE_NAME_TOO_LONG: 'El nombre del archivo es demasiado largo (máximo 255 caracteres)',
    FILE_NAME_INVALID_CHARS: 'El nombre del archivo contiene caracteres no permitidos',
    FILE_EMPTY: 'El archivo está vacío',
    FILE_TOO_LARGE: (maxSize: string) => `El archivo es demasiado grande. Tamaño máximo: ${maxSize}`,
    INVALID_EXTENSION: 'El archivo debe tener una extensión válida',
    BLOCKED_EXTENSION: (ext: string) => `El tipo de archivo .${ext} no está permitido por razones de seguridad`,
    EXTENSION_NOT_ALLOWED: (ext: string, allowed: string) => `El tipo de archivo .${ext} no está permitido. Tipos permitidos: ${allowed}`,
    MIME_TYPE_BLOCKED: (mimeType: string) => `El tipo de contenido ${mimeType} no está permitido por razones de seguridad`,
    MIME_TYPE_NOT_ALLOWED: (mimeType: string) => `El tipo de contenido ${mimeType} no está permitido`
  };

  // File upload errors
  static readonly FILE_UPLOAD = {
    UPLOAD_FAILED: 'Error al subir el archivo al servidor',
    PROCESSING_ERROR: 'Ha ocurrido un error al procesar el archivo',
    NETWORK_ERROR: 'Error de conexión durante la subida del archivo',
    SERVER_ERROR: 'Error del servidor durante la subida del archivo',
    TIMEOUT_ERROR: 'La subida del archivo ha excedido el tiempo límite',
    CANCELLED: 'La subida del archivo fue cancelada',
    ALREADY_EXISTS: 'La ruta ya tiene un archivo adjunto. Debe eliminarlo primero'
  };

  // File download errors
  static readonly FILE_DOWNLOAD = {
    INVALID_FILE_TRACK: 'Identificador de archivo no válido',
    FILE_NOT_FOUND: 'No se encontró el archivo especificado',
    FILE_NOT_ON_SERVER: 'El archivo no se encuentra en el servidor. Es posible que haya sido eliminado',
    DOWNLOAD_FAILED: 'Error al descargar el archivo',
    CORRUPTED_FILE: 'El archivo está corrupto o dañado',
    ACCESS_DENIED: 'No tiene permisos para descargar este archivo'
  };

  // File deletion errors
  static readonly FILE_DELETION = {
    NO_FILES_SELECTED: 'Debe seleccionar al menos un archivo para eliminar',
    INVALID_FILE_TRACKS: 'Algunos identificadores de archivo no son válidos',
    DELETION_FAILED: 'Error al eliminar los archivos',
    PARTIAL_DELETION: (success: number, failed: number) => `Se eliminaron ${success} archivos correctamente, pero ${failed} archivos fallaron`,
    NO_FILE_ATTACHED: 'La ruta no tiene ningún archivo adjunto',
    DELETION_CANCELLED: 'La eliminación fue cancelada por el usuario'
  };

  // File management errors
  static readonly FILE_MANAGEMENT = {
    LOADING_FAILED: 'Error al cargar los archivos adjuntos',
    PROCESSING_RESPONSE_ERROR: 'Error al procesar la respuesta del servidor',
    REQUEST_TIMEOUT: 'La carga de archivos está tomando más tiempo del esperado',
    REQUEST_PREPARATION_ERROR: 'Error al preparar la solicitud de archivos',
    PERMISSION_DENIED: 'No tiene permisos para acceder a la gestión de archivos'
  };

  // General errors
  static readonly GENERAL = {
    UNEXPECTED_ERROR: 'Ha ocurrido un error inesperado',
    SERVER_UNAVAILABLE: 'El servidor no está disponible en este momento',
    CONNECTION_ERROR: 'Error de conexión con el servidor',
    INVALID_RESPONSE: 'Respuesta inválida del servidor',
    OPERATION_CANCELLED: 'La operación fue cancelada',
    INSUFFICIENT_PERMISSIONS: 'No tiene permisos suficientes para realizar esta operación'
  };

  // Success messages
  static readonly SUCCESS = {
    FILE_UPLOADED: (filename: string) => `Archivo "${filename}" listo para subir al guardar la ruta`,
    FILE_ATTACHED: (filename: string) => `Archivo "${filename}" adjuntado correctamente`,
    FILE_REMOVED: (filename: string) => `El archivo "${filename}" ha sido eliminado`,
    FILES_DELETED: (count: number) => count === 1 ? 'El archivo se ha eliminado correctamente' : `Se han eliminado ${count} archivo(s) correctamente`,
    DOWNLOAD_STARTED: 'La descarga del archivo ha comenzado',
    CLEANUP_COMPLETED: (count: number) => `Limpieza completada. Se eliminaron ${count} archivo(s) huérfano(s)`
  };

  // Warning messages
  static readonly WARNING = {
    FILE_CHANGED_DURING_UPLOAD: 'El archivo fue cambiado durante el procesamiento',
    FILE_NOT_ON_DISK: 'El archivo no se encuentra en el disco, limpiando registro de base de datos',
    INCONSISTENT_FILES: (count: number) => `Se encontraron ${count} archivos con registros en base de datos pero faltantes en disco`,
    PARTIAL_SUCCESS: 'La operación se completó parcialmente con algunos errores',
    LARGE_FILE_WARNING: (size: string) => `El archivo es grande (${size}). La subida puede tomar tiempo`,
    CLEANUP_ERRORS: (count: number) => `Se encontraron ${count} error(es) durante la limpieza`
  };

  // Info messages
  static readonly INFO = {
    PREPARING_UPLOAD: 'Preparando archivo para subir...',
    UPLOADING: 'Subiendo archivo...',
    PROCESSING: 'Procesando archivo...',
    VALIDATING: 'Validando archivo...',
    LOADING_FILES: 'Cargando archivos adjuntos...',
    DELETING_FILES: 'Eliminando archivos...',
    CLEANING_UP: 'Limpiando archivos temporales...'
  };

  /**
   * Get user-friendly error message from error object
   */
  static getErrorMessage(error: any): string {
    if (!error) {
      return this.GENERAL.UNEXPECTED_ERROR;
    }

    // If error has a message property, use it
    if (error.message && typeof error.message === 'string') {
      return error.message;
    }

    // If error is a string, use it directly
    if (typeof error === 'string') {
      return error;
    }

    // If error has a detail property (from API responses)
    if (error.detail && typeof error.detail === 'string') {
      return error.detail;
    }

    // If error has an error property (nested error)
    if (error.error) {
      return this.getErrorMessage(error.error);
    }

    // Default fallback
    return this.GENERAL.UNEXPECTED_ERROR;
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get severity level for PrimeNG messages
   */
  static getSeverity(errorType: 'error' | 'warning' | 'info' | 'success'): string {
    switch (errorType) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warn';
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'info';
    }
  }

  /**
   * Create a standardized message object for PrimeNG
   */
  static createMessage(
    type: 'error' | 'warning' | 'info' | 'success',
    summary: string,
    detail: string,
    life: number = 3000
  ) {
    return {
      severity: this.getSeverity(type),
      summary,
      detail,
      life
    };
  }
}

export default ErrorMessages;