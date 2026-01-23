import { RouteModel } from './route.model';

/**
 * Interface for attached file information
 */
export interface AttachedFile {
  fileTrack: string;        // Identificador único del archivo
  filenameTrack: string;    // Nombre original con extensión
  uploadDate: Date;         // Fecha de subida
  fileSize: number;         // Tamaño en bytes
  mimeType: string;         // Tipo MIME del archivo
}

/**
 * Interface for route with optional attached file
 */
export interface RouteWithFile extends RouteModel {
  attachedFile: AttachedFile | null;
}

/**
 * Interface for attached file with associated route information
 */
export interface AttachedFileWithRoute extends AttachedFile {
  routeId: number;
  routeName: string;
  routeDate: Date;
}

/**
 * Interface for file data used in forms and API calls
 */
export interface FileData {
  file?: File;              // Archivo a subir (opcional)
  removeExisting?: boolean; // Flag para eliminar archivo existente
}

/**
 * Interface for file upload response
 */
export interface FileUploadResponse {
  success: boolean;
  fileTrack?: string;
  filenameTrack?: string;
  message?: string;
  error?: string;
}

/**
 * Interface for file download request
 */
export interface FileDownloadRequest {
  fileTrack: string;
  routeId?: number;
}

/**
 * Interface for file management operations
 */
export interface FileManagementOperation {
  action: 'upload' | 'remove' | 'download' | 'list';
  fileTrack?: string;
  fileTracks?: string[];
  routeId?: number;
}