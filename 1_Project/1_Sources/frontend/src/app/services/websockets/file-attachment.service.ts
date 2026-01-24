import { Injectable } from '@angular/core';
import { WebsocketService } from '../websocket.service';
import { Observable } from 'rxjs';

import { AttachedFileWithRoute } from '../../models/file-attachment.model';

@Injectable()
export class FileAttachmentService {
  constructor(private wsService: WebsocketService) {
  }

  // Obtener todos los archivos adjuntos con información de ruta
  getAllAttachedFiles(filters?: any): void {
    this.wsService.emit('fileAttachment/getAllAttachedFiles', { filters });
  }
  onGetAllAttachedFiles(): Observable<AttachedFileWithRoute[]> {
    return this.wsService.listen('fileAttachment/getAllAttachedFiles');
  }

  // Eliminar múltiples archivos adjuntos
  deleteAttachedFiles(fileTracks: string[]): void {
    this.wsService.emit('fileAttachment/deleteAttachedFiles', { fileTracks });
  }
  onDeleteAttachedFiles(): Observable<any> {
    return this.wsService.listen('fileAttachment/deleteAttachedFiles');
  }

  // Adjuntar archivo a una ruta
  attachFileToRoute(routeId: number, fileData: any): void {
    this.wsService.emit('fileAttachment/attachFileToRoute', { routeId, fileData });
  }
  onAttachFileToRoute(): Observable<any> {
    return this.wsService.listen('fileAttachment/attachFileToRoute');
  }

  // Quitar archivo de una ruta
  removeFileFromRoute(routeId: number): void {
    this.wsService.emit('fileAttachment/removeFileFromRoute', { routeId });
  }
  onRemoveFileFromRoute(): Observable<any> {
    return this.wsService.listen('fileAttachment/removeFileFromRoute');
  }

  // Obtener información de un archivo adjunto específico
  getAttachedFile(fileTrack: string): void {
    this.wsService.emit('fileAttachment/getAttachedFile', { fileTrack });
  }
  onGetAttachedFile(): Observable<any> {
    return this.wsService.listen('fileAttachment/getAttachedFile');
  }

  // Descargar archivo adjunto
  downloadAttachedFile(fileTrack: string): void {
    this.wsService.emit('fileAttachment/downloadAttachedFile', { fileTrack });
  }
  onDownloadAttachedFile(): Observable<any> {
    return this.wsService.listen('fileAttachment/downloadAttachedFile');
  }

  // Método para escuchar errores del servidor
  onError(): Observable<any> {
    return this.wsService.listen('error_message');
  }
}