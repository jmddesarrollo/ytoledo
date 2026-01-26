/**
 * Backend TypeScript interfaces for file attachment functionality
 */

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
export interface RouteWithFile {
  id: number;
  date: string;
  name: string;
  start_point: string;
  description: string;
  distance_km: number;
  elevation_gain: number;
  max_height: number;
  min_height: number;
  estimated_duration_hours: number;
  estimated_duration_minutes: number;
  type: number;
  difficulty: string;
  sign_up_link?: string;
  wikiloc_link?: string;
  wikiloc_map_link?: string;
  user_id?: number;
  file_track?: string;
  filename_track?: string;
  created_at?: Date;
  updated_at?: Date;
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
 * Interface for file data used in API operations
 */
export interface FileData {
  file?: any;  // Archivo subido (compatible con multer)
  removeExisting?: boolean;    // Flag para eliminar archivo existente
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
 * Interface for route data with file information
 */
export interface RouteData {
  date: string;
  name: string;
  start_point: string;
  description: string;
  distance_km: number;
  elevation_gain: number;
  max_height: number;
  min_height: number;
  estimated_duration_hours: number;
  estimated_duration_minutes: number;
  type: number;
  difficulty: string;
  sign_up_link?: string;
  wikiloc_link?: string;
  wikiloc_map_link?: string;
  user_id?: number;
  file_track?: string;
  filename_track?: string;
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