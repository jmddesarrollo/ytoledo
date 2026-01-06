import { Injectable } from '@angular/core';
import { WebsocketService } from '../websocket.service';
import { Observable } from 'rxjs';

@Injectable()
export class FileService {
  constructor(private wsService: WebsocketService) {
  }

  downFile(identifier: string, name: string, unique: boolean = true, productName: string): void {
    this.wsService.emit('file/download', {identifier, name, unique, productName});
  }
  _downFile(): Observable<any> {
    return this.wsService.listen('file/download');
  }

  uploadFiles(files: any): void {
    this.wsService.emit('file/upload', { files });
  }
  _uploadFiles(): Observable<any> {
    return this.wsService.listen('file/upload');
  }

  deleteFiles(identifier: string): void {
    this.wsService.emit('file/delete', { identifier });
  }
  _deleteFiles(): Observable<any> {
    return this.wsService.listen('file/delete');
  }
}
