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
import ErrorMessages from '../../../utils/error-messages';

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
        try {
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
          } else {
            this.attachedFiles = [];
            this.totalRecords = 0;
          }
          console.log('Attached files loaded:', this.attachedFiles);
        } catch (processingError) {
          console.error('Error processing attached files response:', processingError);
          this.attachedFiles = [];
          this.totalRecords = 0;
          this.messageService.add(ErrorMessages.createMessage(
            'error',
            'Error de procesamiento',
            ErrorMessages.FILE_MANAGEMENT.PROCESSING_RESPONSE_ERROR
          ));
        }
      },
      (error) => {
        this.loading = false;
        console.error('Error loading attached files:', error);
        this.attachedFiles = [];
        this.totalRecords = 0;
        
        const errorMessage = ErrorMessages.getErrorMessage(error);
        
        this.messageService.add(ErrorMessages.createMessage(
          'error',
          'Error de carga',
          errorMessage,
          4000
        ));
      }
    );

    // Suscripción para eliminar archivos
    const deleteFilesSub = this.fileAttachmentService.onDeleteAttachedFiles().subscribe(
      (response: any) => {
        console.log('Files deleted:', response);
        
        try {
          // Mostrar mensaje de éxito
          if (response.message) {
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Eliminación exitosa', 
              detail: response.message, 
              life: 3000 
            });
          } else {
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Eliminación exitosa', 
              detail: 'Los archivos han sido eliminados correctamente', 
              life: 3000 
            });
          }
          
          // Limpiar selección y recargar lista
          this.selectedFiles = [];
          this.selectAll = false;
          this.showDeleteConfirmation = false;
          this.filesToDelete = [];
          
          // Recargar lista después de un breve delay
          setTimeout(() => {
            this.loadAttachedFiles();
          }, 500);
          
        } catch (processingError) {
          console.error('Error processing delete response:', processingError);
          this.messageService.add({ 
            severity: 'warn', 
            summary: 'Advertencia', 
            detail: 'Los archivos pueden haber sido eliminados, pero hubo un error al procesar la respuesta', 
            life: 4000 
          });
          this.showDeleteConfirmation = false;
          this.loadAttachedFiles();
        }
      },
      (error) => {
        console.error('Error deleting files:', error);
        
        let errorMessage = 'Error al eliminar los archivos';
        if (error && error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error de eliminación', 
          detail: errorMessage, 
          life: 4000 
        });
        this.showDeleteConfirmation = false;
      }
    );

    this.subscriptions.push(getFilesSub, deleteFilesSub);
  }

  loadAttachedFiles(): void {
    if (this.loading) {
      return; // Prevent multiple simultaneous requests
    }
    
    this.loading = true;
    
    try {
      const requestFilters = {
        ...this.filters,
        page: this.currentPage,
        limit: this.pageSize
      };

      // Limpiar filtros vacíos
      Object.keys(requestFilters).forEach(key => {
        if (requestFilters[key] === '' || requestFilters[key] === null || requestFilters[key] === undefined) {
          delete requestFilters[key];
        }
      });

      // Validar filtros antes de enviar
      if (requestFilters.page && (!Number.isInteger(requestFilters.page) || requestFilters.page < 1)) {
        requestFilters.page = 1;
        this.currentPage = 1;
      }

      if (requestFilters.limit && (!Number.isInteger(requestFilters.limit) || requestFilters.limit < 1)) {
        requestFilters.limit = this.pageSize;
      }

      this.fileAttachmentService.getAllAttachedFiles(requestFilters);
      
      // Set timeout to prevent infinite loading state
      setTimeout(() => {
        if (this.loading) {
          this.loading = false;
          this.messageService.add({ 
            severity: 'warn', 
            summary: 'Tiempo agotado', 
            detail: 'La carga de archivos está tomando más tiempo del esperado', 
            life: 3000 
          });
        }
      }, 30000); // 30 seconds timeout
      
    } catch (error) {
      this.loading = false;
      console.error('Error preparing file request:', error);
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error de solicitud', 
        detail: 'Error al preparar la solicitud de archivos', 
        life: 3000 
      });
    }
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
    if (!this.filesToDelete || this.filesToDelete.length === 0) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Advertencia', 
        detail: 'No hay archivos seleccionados para eliminar', 
        life: 3000 
      });
      this.showDeleteConfirmation = false;
      return;
    }

    try {
      // Validate file tracks before deletion
      const validFileTracks = this.filesToDelete.filter(track => 
        track && typeof track === 'string' && track.trim() !== ''
      );

      if (validFileTracks.length === 0) {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error de validación', 
          detail: 'No hay identificadores de archivo válidos para eliminar', 
          life: 3000 
        });
        this.showDeleteConfirmation = false;
        return;
      }

      if (validFileTracks.length !== this.filesToDelete.length) {
        this.messageService.add({ 
          severity: 'warn', 
          summary: 'Advertencia', 
          detail: `Se eliminarán ${validFileTracks.length} de ${this.filesToDelete.length} archivos seleccionados (algunos identificadores no son válidos)`, 
          life: 4000 
        });
      }

      // Sanitize file tracks to prevent injection
      const sanitizedTracks = validFileTracks.map(track => 
        track.replace(/[^a-zA-Z0-9\-_]/g, '')
      );

      // Check if any tracks were modified during sanitization
      const modifiedTracks = sanitizedTracks.filter((sanitized, index) => 
        sanitized !== validFileTracks[index]
      );

      if (modifiedTracks.length > 0) {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error de seguridad', 
          detail: 'Algunos identificadores de archivo contienen caracteres no válidos', 
          life: 4000 
        });
        this.showDeleteConfirmation = false;
        return;
      }

      this.fileAttachmentService.deleteAttachedFiles(sanitizedTracks);
      
    } catch (error) {
      console.error('Error preparing file deletion:', error);
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error de preparación', 
        detail: 'Error al preparar la eliminación de archivos', 
        life: 3000 
      });
      this.showDeleteConfirmation = false;
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
    if (!fileTrack || fileTrack.trim() === '') {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Identificador de archivo no válido', 
        life: 3000 
      });
      return;
    }

    try {
      // Sanitize file track to prevent XSS
      const sanitizedFileTrack = fileTrack.replace(/[^a-zA-Z0-9\-_]/g, '');
      if (sanitizedFileTrack !== fileTrack) {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error de seguridad', 
          detail: 'El identificador del archivo contiene caracteres no válidos', 
          life: 3000 
        });
        return;
      }

      // Crear un enlace temporal para descargar el archivo
      const downloadUrl = `/api/files/download/${encodeURIComponent(sanitizedFileTrack)}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = '';
      link.style.display = 'none';
      
      // Add error handling for download
      link.onerror = () => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error de descarga', 
          detail: 'No se pudo descargar el archivo. Es posible que no exista o haya sido eliminado', 
          life: 4000 
        });
        document.body.removeChild(link);
      };

      document.body.appendChild(link);
      link.click();
      
      // Clean up after a delay
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 1000);

      // Show success message
      this.messageService.add({ 
        severity: 'info', 
        summary: 'Descarga iniciada', 
        detail: 'La descarga del archivo ha comenzado', 
        life: 2000 
      });

    } catch (error) {
      console.error('Error initiating download:', error);
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error de descarga', 
        detail: 'Ha ocurrido un error al iniciar la descarga', 
        life: 3000 
      });
    }
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