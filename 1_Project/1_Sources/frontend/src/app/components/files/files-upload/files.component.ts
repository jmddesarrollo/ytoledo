import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

// Services
import { FileService } from 'src/app/services/websockets/file.service';
import { MyPermissionShareService } from '../../../services/share/my-permission.service';
import { TitleShareService } from '../../../services/share/title.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { WRPermissionShareService } from '../../../services/share/wr-permission';

import { ConfirmationService, MessageService } from 'primeng/api';

// Modelos
import { RoleHasPermission } from '../../../models/roleHasPermission.model';

import { GLOBAL } from '../../../services/global';

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.css']
})
export class FilesComponent implements OnInit {
  @ViewChild('fileUpload') fileUpload: any;

  public uploadedFiles: File[];
  public files: any[];

  public identifier: string;

  private title: string;
  private wrPermission: string;

  public permissionViewId: number;
  public permissionWriting: boolean;
  public permission: RoleHasPermission;
  public loadingPermission: boolean;  

  private observables = new Array();

  constructor(
    private fileService: FileService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private myPermissionShareService: MyPermissionShareService,
    private router: Router,
    private titleShareService: TitleShareService,
    private websocketService: WebsocketService,
    private wrPermissionShareService: WRPermissionShareService
  ) {
    this.title = 'Gestión de archivos';
    this.wrPermission = '';

    this.uploadedFiles = [];
    this.files = [];

    this.permissionViewId = GLOBAL.permission_files_manager;
  }

  ngOnInit(): void {
    this.changeTitle();

    if (this.websocketService.sessionOn) {
      this._changeMyPermissions();
    }

    this._downloadFile();
    this._uploadFile();
    this._deleleFiles();
  }

  ngOnDestroy() {
    for (const ob of this.observables) {
      if (ob !== undefined && ob !== null) {
        ob.unsubscribe();
      }
    }
  }

  onSelectFiles(files: any[]) {
    for (const file of files) {
      this.uploadedFiles.push(file);
    }
  }

  onRemoveFile(file: any) {
    this.uploadedFiles = this.uploadedFiles.filter(upf => upf.name !== file.name);
  }  

  onErrorFiles(event: any) {
    console.log(event);
  }

  async onSubmitFiles() {
    if (this.uploadedFiles.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Archivos', detail: 'No se ha encontrado ningún archivo', life: 4000 });
      return false;
    }

    for (let file of this.uploadedFiles) {
      const data = await this.read(file);

      const fileOut = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        data
      }

      this.files.push(fileOut);
    }

    this.fileService.uploadFiles(this.files);
  }

  downloadFile() {
    this.fileService.downFile(this.identifier, this.files[0].name, true, this.files[0].name);
  }

  private async read(file) {
    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
      fileReader.onerror = () => {
        const error = new DOMException();
        reject(error);
      };
      fileReader.readAsArrayBuffer(file);
    });
  }

  deleteFiles() {
    this.fileService.deleteFiles(this.identifier);
  }

  confirm(event: Event) {
    this.confirmationService.confirm({
        target: event.target,
        message: '¿Está seguro de proceder a la eliminación de todos los archivos en el servidor?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: "Si",
        accept: () => {
          this.fileService.deleteFiles(this.identifier);
        },
        reject: () => {
          return false;
        }
    });
  }

  changeTitle(): void {
    this.titleShareService.changeTitle(this.title);
  }

  changeWRPermission(): void {
    this.wrPermissionShareService.changeWRPermission(this.wrPermission);
  }

  /**
   * Observables
   */
  _downloadFile() {
    const ob = this.fileService._downFile().subscribe((response: any) => {
      const blob = new Blob([response.file]);
      const filename = response.name;

      // Creación del enlace de descarga
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';

      // Descarga del fichero
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    this.observables.push(ob);
  }

  _uploadFile() {
    const ob = this.fileService._uploadFiles().subscribe((response: any) => {
      this.identifier = response.identifier;

      const file = response.message;
      this.messageService.add({ severity: 'success', summary: 'Alta', detail: response.message, life: 3000 });
    });

    this.observables.push(ob);
  }

  _deleleFiles() {
    const ob = this.fileService._deleteFiles().subscribe((response: any) => {
      const file = response.message;
      this.messageService.add({ severity: 'success', summary: 'Alta', detail: response.message, life: 3000 });

      this.files = [];
      this.uploadedFiles = [];

      this.fileUpload.clear();
      this.fileUpload.msgs = [];
    });

    this.observables.push(ob);
  }

  _changeMyPermissions(): void {
    const ob = this.myPermissionShareService.currentMyPermissions.subscribe((myPermissions: RoleHasPermission[]) => {
      this.permission = myPermissions.find(mp => mp.permissions_id === this.permissionViewId);

      this.permissionWriting = false;

      // Se da un tiempo de 2s por si se producen cambios rápidos antes de echar al usuario,
      // además el permiso al inicio de la vista llega 'undefined' y echa al usuario, aunque al regresar datos del backend tenga realmente permisos
      if (!this.loadingPermission) {
        this.loadingPermission = true;
        setTimeout(() => {
          if (!this.permission) {
            this.messageService.add({ severity: 'warn', summary: 'Permiso', detail: 'El usuario no tiene permisos para acceder a "' + this.title + '"', life: 4000 });
            this.router.navigate(['/my-profile']);
            return false;
          }

          this.loadingPermission = false;
        }, 2000);
      }


      if (this.permission) {
        if (this.permission.writing) {
          this.permissionWriting = true;
          this.wrPermission = 'W';
          this.changeWRPermission();
        } else {
          if (this.permission.reading) {
            this.wrPermission = 'R';
            this.changeWRPermission();
          }
        }
      }
    });

    this.observables.push(ob);
  }  

}
