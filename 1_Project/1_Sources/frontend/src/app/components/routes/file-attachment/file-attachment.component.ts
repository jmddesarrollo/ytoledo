import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AttachedFile, FileData, SerializableFile } from '../../../models/file-attachment.model';
import ErrorMessages from '../../../utils/error-messages';

@Component({
  selector: 'app-file-attachment',
  templateUrl: './file-attachment.component.html',
  styleUrls: ['./file-attachment.component.css']
})
export class FileAttachmentComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('dropZone') dropZone!: ElementRef<HTMLDivElement>;

  // Inputs
  @Input() currentFile: AttachedFile | null = null;
  @Input() disabled: boolean = false;
  @Input() maxFileSize: number = 10 * 1024 * 1024; // 10MB por defecto
  @Input() acceptedTypes: string[] = []; // Vacío = todos los tipos

  // Outputs
  @Output() fileAttached = new EventEmitter<FileData>();
  @Output() fileRemoved = new EventEmitter<void>();

  // Estado del componente
  public isUploading: boolean = false;
  public uploadProgress: number = 0;
  public isDragOver: boolean = false;
  public selectedFile: File | null = null;
  public validationError: string = '';

  // Configuración de validación
  private readonly MAX_FILE_SIZE_DEFAULT = 50 * 1024 * 1024; // 50MB
  private readonly ACCEPTED_TYPES_DEFAULT: string[] = []; // Todos los tipos
  private readonly BLOCKED_EXTENSIONS = ['exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar', 'msi', 'dll'];
  private readonly ALLOWED_EXTENSIONS_DEFAULT = ['pdf', 'gpx', 'kml', 'kmz', 'txt', 'doc', 'docx', 'zip', 'rar', '7z', 'jpg', 'jpeg', 'png', 'gif', 'bmp'];

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.setupDragAndDrop();
  }

  ngOnDestroy(): void {
    this.removeDragAndDropListeners();
  }

  /**
   * Configurar eventos de drag and drop
   */
  private setupDragAndDrop(): void {
    if (this.dropZone) {
      const dropZoneElement = this.dropZone.nativeElement;
      
      // Prevenir comportamiento por defecto del navegador
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZoneElement.addEventListener(eventName, this.preventDefaults.bind(this), false);
        document.body.addEventListener(eventName, this.preventDefaults.bind(this), false);
      });

      // Highlight drop zone cuando se arrastra sobre él
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZoneElement.addEventListener(eventName, this.highlight.bind(this), false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropZoneElement.addEventListener(eventName, this.unhighlight.bind(this), false);
      });

      // Manejar drop
      dropZoneElement.addEventListener('drop', this.handleDrop.bind(this), false);
    }
  }

  /**
   * Remover listeners de drag and drop
   */
  private removeDragAndDropListeners(): void {
    if (this.dropZone) {
      const dropZoneElement = this.dropZone.nativeElement;
      
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZoneElement.removeEventListener(eventName, this.preventDefaults.bind(this), false);
        document.body.removeEventListener(eventName, this.preventDefaults.bind(this), false);
      });

      ['dragenter', 'dragover'].forEach(eventName => {
        dropZoneElement.removeEventListener(eventName, this.highlight.bind(this), false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropZoneElement.removeEventListener(eventName, this.unhighlight.bind(this), false);
      });

      dropZoneElement.removeEventListener('drop', this.handleDrop.bind(this), false);
    }
  }

  /**
   * Prevenir comportamiento por defecto del navegador
   */
  private preventDefaults(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * Highlight drop zone
   */
  private highlight(): void {
    if (!this.disabled) {
      this.isDragOver = true;
    }
  }

  /**
   * Unhighlight drop zone
   */
  private unhighlight(): void {
    this.isDragOver = false;
  }

  /**
   * Manejar drop de archivos
   */
  private handleDrop(e: DragEvent): void {
    if (this.disabled) return;

    const dt = e.dataTransfer;
    const files = dt?.files;

    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  /**
   * Manejar selección de archivo desde input
   */
  onFileSelected(event: Event): void {
    if (this.disabled) return;

    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  /**
   * Procesar archivo seleccionado
   */
  private handleFileSelection(file: File): void {
    this.validationError = '';
    
    // Validar archivo
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      this.validationError = validation.error;
      this.messageService.add({
        severity: 'error',
        summary: 'Error de validación',
        detail: validation.error,
        life: 4000
      });
      return;
    }

    this.selectedFile = file;
    this.uploadFile();
  }

  /**
   * Validar archivo seleccionado
   */
  private validateFile(file: File): { isValid: boolean; error: string } {
    // Validar que el archivo existe
    if (!file) {
      return {
        isValid: false,
        error: ErrorMessages.FILE_VALIDATION.NO_FILE_PROVIDED
      };
    }

    // Validar nombre del archivo
    if (!file.name || file.name.trim() === '') {
      return {
        isValid: false,
        error: ErrorMessages.FILE_VALIDATION.INVALID_FILE_NAME
      };
    }

    // Validar longitud del nombre
    if (file.name.length > 255) {
      return {
        isValid: false,
        error: ErrorMessages.FILE_VALIDATION.FILE_NAME_TOO_LONG
      };
    }

    // Validar caracteres peligrosos en el nombre
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      return {
        isValid: false,
        error: ErrorMessages.FILE_VALIDATION.FILE_NAME_INVALID_CHARS
      };
    }

    // Validar tamaño
    const maxSize = this.maxFileSize || this.MAX_FILE_SIZE_DEFAULT;
    if (file.size === 0) {
      return {
        isValid: false,
        error: ErrorMessages.FILE_VALIDATION.FILE_EMPTY
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: ErrorMessages.FILE_VALIDATION.FILE_TOO_LARGE(ErrorMessages.formatFileSize(maxSize))
      };
    }

    // Obtener extensión del archivo
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();
    
    if (!fileExtension) {
      return {
        isValid: false,
        error: ErrorMessages.FILE_VALIDATION.INVALID_EXTENSION
      };
    }

    // Validar extensiones bloqueadas por seguridad
    if (this.BLOCKED_EXTENSIONS.includes(fileExtension)) {
      return {
        isValid: false,
        error: ErrorMessages.FILE_VALIDATION.BLOCKED_EXTENSION(fileExtension)
      };
    }

    // Validar tipo si se especificaron tipos aceptados
    const acceptedTypes = this.acceptedTypes.length > 0 ? this.acceptedTypes : this.ACCEPTED_TYPES_DEFAULT;
    
    if (acceptedTypes.length > 0) {
      const fileExtensionWithDot = '.' + fileExtension;
      const mimeType = file.type ? file.type.toLowerCase() : '';
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtensionWithDot === type.toLowerCase();
        } else if (type.includes('/')) {
          return mimeType === type.toLowerCase() || mimeType.startsWith(type.toLowerCase().replace('*', ''));
        }
        return false;
      });

      if (!isAccepted) {
        return {
          isValid: false,
          error: ErrorMessages.FILE_VALIDATION.EXTENSION_NOT_ALLOWED(fileExtension, acceptedTypes.join(', '))
        };
      }
    } else {
      // Si no se especificaron tipos aceptados, usar la lista por defecto
      if (!this.ALLOWED_EXTENSIONS_DEFAULT.includes(fileExtension)) {
        return {
          isValid: false,
          error: ErrorMessages.FILE_VALIDATION.EXTENSION_NOT_ALLOWED(fileExtension, this.ALLOWED_EXTENSIONS_DEFAULT.join(', '))
        };
      }
    }

    // Validar tipo MIME si está disponible
    if (file.type) {
      const mimeType = file.type.toLowerCase();
      
      // Lista de tipos MIME peligrosos
      const dangerousMimeTypes = [
        'application/x-msdownload',
        'application/x-executable',
        'application/x-dosexec',
        'application/x-winexe',
        'application/x-msdos-program',
        'application/javascript',
        'text/javascript'
      ];

      if (dangerousMimeTypes.includes(mimeType)) {
        return {
          isValid: false,
          error: ErrorMessages.FILE_VALIDATION.MIME_TYPE_BLOCKED(mimeType)
        };
      }
    }

    return { isValid: true, error: '' };
  }

  /**
   * Subir archivo
   */
  private async uploadFile(): Promise<void> {
    if (!this.selectedFile) {
      this.messageService.add(ErrorMessages.createMessage(
        'error',
        'Error',
        ErrorMessages.FILE_UPLOAD.UPLOAD_FAILED
      ));
      return;
    }

    // Validar archivo una vez más antes de subir
    const validation = this.validateFile(this.selectedFile);
    if (!validation.isValid) {
      this.validationError = validation.error;
      this.messageService.add(ErrorMessages.createMessage(
        'error',
        'Error de validación',
        validation.error,
        4000
      ));
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.validationError = '';

    try {
      // Progreso inicial
      this.uploadProgress = 10;

      // Leer el archivo como ArrayBuffer (similar al sistema existente)
      const fileData = await this.readFileAsArrayBuffer(this.selectedFile);
      this.uploadProgress = 50;

      // Crear objeto de archivo compatible con el backend
      const fileObject: SerializableFile = {
        name: this.selectedFile.name,
        size: this.selectedFile.size,
        type: this.selectedFile.type,
        lastModified: this.selectedFile.lastModified,
        data: fileData
      };

      this.uploadProgress = 80;

      // Emitir evento con el archivo procesado
      const fileDataPayload: FileData = {
        file: fileObject,
        removeExisting: false
      };

      this.uploadProgress = 100;

      // Pequeño delay para mostrar el progreso completo
      setTimeout(() => {
        this.isUploading = false;
        this.uploadProgress = 0;
        
        // Verificar que el archivo aún existe (usuario no lo cambió durante la subida)
        if (this.selectedFile) {
          this.fileAttached.emit(fileDataPayload);
          
          this.messageService.add(ErrorMessages.createMessage(
            'success',
            'Archivo preparado',
            ErrorMessages.SUCCESS.FILE_UPLOADED(this.selectedFile.name)
          ));
        } else {
          this.messageService.add(ErrorMessages.createMessage(
            'warning',
            'Advertencia',
            ErrorMessages.WARNING.FILE_CHANGED_DURING_UPLOAD
          ));
        }
      }, 300);

    } catch (error) {
      this.isUploading = false;
      this.uploadProgress = 0;
      this.validationError = ErrorMessages.FILE_UPLOAD.PROCESSING_ERROR;
      
      console.error('Error processing file:', error);
      this.messageService.add(ErrorMessages.createMessage(
        'error',
        'Error de procesamiento',
        ErrorMessages.FILE_UPLOAD.PROCESSING_ERROR,
        4000
      ));
    }
  }

  /**
   * Leer archivo como ArrayBuffer (compatible con WebSocket)
   */
  private async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = () => {
        resolve(fileReader.result as ArrayBuffer);
      };
      
      fileReader.onerror = () => {
        const error = new DOMException('Error reading file');
        reject(error);
      };
      
      fileReader.readAsArrayBuffer(file);
    });
  }

  /**
   * Quitar archivo actual con confirmación
   */
  removeFile(event?: Event): void {
    if (this.disabled) return;

    // Determinar el mensaje de confirmación según el tipo de archivo
    const fileName = this.displayFileName;
    const isCurrentFile = this.hasCurrentFile;
    const isSelectedFile = this.hasSelectedFile;

    let confirmMessage = '';
    let confirmHeader = '';

    if (isCurrentFile) {
      confirmMessage = `¿Está seguro de que desea quitar el archivo "${fileName}" de esta ruta? Esta acción eliminará el archivo del servidor.`;
      confirmHeader = 'Confirmar eliminación de archivo';
    } else if (isSelectedFile) {
      confirmMessage = `¿Está seguro de que desea quitar el archivo seleccionado "${fileName}"?`;
      confirmHeader = 'Confirmar eliminación de archivo';
    } else {
      // No hay archivo para quitar
      return;
    }

    this.confirmationService.confirm({
      target: event?.target || undefined,
      message: confirmMessage,
      header: confirmHeader,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, quitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm',
      accept: () => {
        this.performFileRemoval();
      },
      reject: () => {
        // Usuario canceló, no hacer nada
        this.messageService.add({
          severity: 'info',
          summary: 'Operación cancelada',
          detail: 'El archivo no fue eliminado',
          life: 2000
        });
      }
    });
  }

  /**
   * Realizar la eliminación del archivo después de la confirmación
   */
  private performFileRemoval(): void {
    const fileName = this.displayFileName;
    const isCurrentFile = this.hasCurrentFile;

    // Limpiar estado del componente
    this.selectedFile = null;
    this.validationError = '';
    
    // Limpiar input file
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }

    // Emitir evento de eliminación
    const fileData: FileData = {
      removeExisting: isCurrentFile
    };

    this.fileRemoved.emit();
    
    // Mostrar mensaje de confirmación
    const messageDetail = isCurrentFile 
      ? `El archivo "${fileName}" será eliminado del servidor al guardar la ruta`
      : `El archivo seleccionado "${fileName}" ha sido eliminado`;

    this.messageService.add({
      severity: 'success',
      summary: 'Archivo eliminado',
      detail: messageDetail,
      life: 3000
    });
  }

  /**
   * Abrir selector de archivos
   */
  openFileSelector(): void {
    if (this.disabled) return;
    
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  /**
   * Formatear tamaño de archivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Obtener icono según tipo de archivo
   */
  getFileIcon(filename: string): string {
    if (!filename) return 'pi pi-file';
    
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      // Hiking track formats
      case 'gpx':
      case 'kml':
      case 'kmz':
        return 'pi pi-map-marker';
      case 'pdf':
        return 'pi pi-file-pdf';
      case 'doc':
      case 'docx':
        return 'pi pi-file-word';
      case 'xls':
      case 'xlsx':
        return 'pi pi-file-excel';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return 'pi pi-image';
      case 'zip':
      case 'rar':
      case '7z':
        return 'pi pi-file-archive';
      case 'txt':
        return 'pi pi-file-text';
      default:
        return 'pi pi-file';
    }
  }

  /**
   * Getters para el template
   */
  get hasCurrentFile(): boolean {
    return !!(this.currentFile && this.currentFile.fileTrack);
  }

  get hasSelectedFile(): boolean {
    return !!this.selectedFile;
  }

  get displayFileName(): string {
    if (this.selectedFile) {
      return this.selectedFile.name;
    }
    if (this.currentFile) {
      return this.currentFile.filenameTrack;
    }
    return '';
  }

  get displayFileSize(): string {
    if (this.selectedFile) {
      return this.formatFileSize(this.selectedFile.size);
    }
    if (this.currentFile) {
      return this.formatFileSize(this.currentFile.fileSize);
    }
    return '';
  }

  get showUploadArea(): boolean {
    return !this.hasCurrentFile && !this.hasSelectedFile;
  }

  get showFileInfo(): boolean {
    return this.hasCurrentFile || this.hasSelectedFile;
  }
}