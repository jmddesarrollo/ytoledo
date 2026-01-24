import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { TitleShareService } from '../../../services/share/title.service';
import { FileAttachmentService } from '../../../services/websockets/file-attachment.service';
import { AttachedFileWithRoute } from '../../../models/file-attachment.model';
import { MessageService } from 'primeng/api';
import { MyPermissionShareService } from '../../../services/share/my-permission.service';
import { WRPermissionShareService } from '../../../services/share/wr-permission';
import { RoleHasPermission } from '../../../models/roleHasPermission.model';
import { GLOBAL } from '../../../services/global';

@Component({
  selector: 'app-file-management',
  templateUrl: './file-management.component.html',
  styleUrls: ['./file-management.component.css']
})
export class FileManagementComponent implements OnInit, OnDestroy {

  public attachedFiles: AttachedFileWithRoute[] = [];
  public selectedFiles: string[] = [];
  public loading: boolean = false;
  public totalRecords: number = 0;
  public currentPage: number = 1;
  public pageSize: number = 20;
  public totalPages: number = 0;

  // Control de permisos
  public permission: RoleHasPermission | undefined;
  public permissionWriting: boolean = false;
  public wrPermission: string = 'U';
  public loadingPermission: boolean = false;
  private permissionViewId: number = GLOBAL.permission_routes_manager;

  // Filtros
  public filters = {
    search: '',
    dateFrom: null,
    dateTo: null,
    routeName: ''
  };

  // Control de selección
  public selectAll: boolean = false;
  public showDeleteConfirmation: boolean = false;
  public filesToDelete: string[] = [];

  private subscriptions: Subscription[] = [];
  private title: string = 'Gestión de Archivos Adjuntos';

  constructor(
    private titleShareService: TitleShareService,
    private fileAttachmentService: FileAttachmentService,
    private router: Router,
    private messageService: MessageService,
    private myPermissionShareService: MyPermissionShareService,
    private wrPermissionShareService: WRPermissionShareService
  ) {}

  ngOnInit(): void {
    this.changeTitle();
    this.setupSubscriptions();
    this._changeMyPermissions();
    this.loadAttachedFiles();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  changeTitle(): void {
    this.titleShareService.changeTitle(this.title);
  }

  setupSubscriptions(): void {
    // Suscripción para obtener archivos adjuntos
    const getFilesSub = this.fileAttachmentService.onGetAllAttachedFiles().subscribe(
      (response: any) => {
        this.loading = false;
        if (response.data) {
          if (response.data.files) {
            // Respuesta con paginación
            this.attachedFiles = response.data.files;
            if (response.data.pagination) {
              this.totalRecords = response.data.pagination.total;
              this.totalPages = response.data.pagination.totalPages;
              this.currentPage = response.data.pagination.page;
            }
          } else {
            // Respuesta simple sin paginación
            this.attachedFiles = response.data;
            this.totalRecords = this.attachedFiles.length;
          }
        }
        console.log('Attached files loaded:', this.attachedFiles);
      },
      (error) => {
        this.loading = false;
        console.error('Error loading attached files:', error);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Error al cargar los archivos adjuntos', 
          life: 3000 
        });
      }
    );

    // Suscripción para eliminar archivos
    const deleteFilesSub = this.fileAttachmentService.onDeleteAttachedFiles().subscribe(
      (response: any) => {
        console.log('Files deleted:', response);
        
        // Mostrar mensaje de éxito
        if (response.message) {
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Eliminación', 
            detail: response.message, 
            life: 2000 
          });
        }
        
        // Limpiar selección y recargar lista
        this.selectedFiles = [];
        this.selectAll = false;
        this.showDeleteConfirmation = false;
        this.filesToDelete = [];
        this.loadAttachedFiles();
      },
      (error) => {
        console.error('Error deleting files:', error);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Error al eliminar los archivos', 
          life: 3000 
        });
        this.showDeleteConfirmation = false;
      }
    );

    this.subscriptions.push(getFilesSub, deleteFilesSub);
  }

  loadAttachedFiles(): void {
    this.loading = true;
    
    const requestFilters = {
      ...this.filters,
      page: this.currentPage,
      limit: this.pageSize
    };

    // Limpiar filtros vacíos
    Object.keys(requestFilters).forEach(key => {
      if (requestFilters[key] === '' || requestFilters[key] === null) {
        delete requestFilters[key];
      }
    });

    this.fileAttachmentService.getAllAttachedFiles(requestFilters);
  }

  onFilterChange(): void {
    this.currentPage = 1; // Reset a primera página
    this.selectedFiles = []; // Limpiar selección
    this.selectAll = false;
    this.loadAttachedFiles();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      dateFrom: null,
      dateTo: null,
      routeName: ''
    };
    this.onFilterChange();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.selectedFiles = []; // Limpiar selección al cambiar página
    this.selectAll = false;
    this.loadAttachedFiles();
  }

  // Métodos de selección
  toggleSelectAll(): void {
    if (this.selectAll) {
      this.selectedFiles = this.attachedFiles.map(file => file.fileTrack);
    } else {
      this.selectedFiles = [];
    }
  }

  toggleFileSelection(fileTrack: string): void {
    const index = this.selectedFiles.indexOf(fileTrack);
    if (index > -1) {
      this.selectedFiles.splice(index, 1);
    } else {
      this.selectedFiles.push(fileTrack);
    }
    
    // Actualizar estado de selectAll
    this.selectAll = this.selectedFiles.length === this.attachedFiles.length;
  }

  isFileSelected(fileTrack: string): boolean {
    return this.selectedFiles.includes(fileTrack);
  }

  // Métodos de eliminación
  deleteSelectedFiles(): void {
    if (this.selectedFiles.length === 0) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Selección', 
        detail: 'Debe seleccionar al menos un archivo para eliminar', 
        life: 3000 
      });
      return;
    }

    this.filesToDelete = [...this.selectedFiles];
    this.showDeleteConfirmation = true;
  }

  confirmDelete(): void {
    if (this.filesToDelete.length > 0) {
      this.fileAttachmentService.deleteAttachedFiles(this.filesToDelete);
    }
  }

  cancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.filesToDelete = [];
  }

  // Métodos de navegación
  viewRoute(routeId: number): void {
    this.router.navigate(['/routes/detail', routeId]);
  }

  downloadFile(fileTrack: string): void {
    // Crear un enlace temporal para descargar el archivo
    const downloadUrl = `/api/files/download/${fileTrack}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Métodos de formato
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'fa-file-image-o';
    if (mimeType.startsWith('video/')) return 'fa-file-video-o';
    if (mimeType.startsWith('audio/')) return 'fa-file-audio-o';
    if (mimeType.includes('pdf')) return 'fa-file-pdf-o';
    if (mimeType.includes('word')) return 'fa-file-word-o';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'fa-file-excel-o';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'fa-file-powerpoint-o';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return 'fa-file-archive-o';
    return 'fa-file-o';
  }

  // Métodos de control de permisos
  changeWRPermission(): void {
    this.wrPermissionShareService.changeWRPermission(this.wrPermission);
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
            this.messageService.add({ 
              severity: 'warn', 
              summary: 'Permiso', 
              detail: 'El usuario no tiene permisos para acceder a "' + this.title + '"', 
              life: 4000 
            });
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

    this.subscriptions.push(ob);
  }

  // Métodos para verificar permisos
  canDelete(): boolean {
    return this.permissionWriting;
  }

  canDownload(): boolean {
    return this.permission !== undefined;
  }

}