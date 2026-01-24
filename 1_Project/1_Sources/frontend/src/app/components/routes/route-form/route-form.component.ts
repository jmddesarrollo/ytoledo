import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { TitleShareService } from '../../../services/share/title.service';
import { RouteService } from '../../../services/websockets/route.service';
import { RouteModel } from '../../../models/route.model';
import { MessageService } from 'primeng/api';
import { MyPermissionShareService } from '../../../services/share/my-permission.service';
import { WRPermissionShareService } from '../../../services/share/wr-permission';
import { RoleHasPermission } from '../../../models/roleHasPermission.model';
import { GLOBAL } from '../../../services/global';
import { AttachedFile, FileData } from '../../../models/file-attachment.model';

@Component({
  selector: 'app-route-form',
  templateUrl: './route-form.component.html',
  styleUrls: ['./route-form.component.css']
})
export class RouteFormComponent implements OnInit, OnDestroy {

  public routeForm: FormGroup;
  public loading: boolean = false;
  public saving: boolean = false;
  public isEditMode: boolean = false;
  public routeId: number | null = null;
  public errorMessage: string = '';

  // File attachment properties
  public attachedFile: AttachedFile | null = null;
  public fileData: FileData | null = null;
  public fileOperationInProgress: boolean = false;
  public acceptedFileTypes: string[] = ['.gpx', '.kml', '.kmz', 'application/gpx+xml', 'application/vnd.google-earth.kml+xml', 'application/vnd.google-earth.kmz'];

  // Control de permisos
  public permission: RoleHasPermission | undefined;
  public permissionWriting: boolean = false;
  public wrPermission: string = 'U';
  public loadingPermission: boolean = false;
  private permissionViewId: number = GLOBAL.permission_routes_manager;

  public difficulties = [
    { label: 'Seleccionar dificultad', value: '' },
    { label: 'Fácil', value: 'Fácil' },
    { label: 'Moderada', value: 'Moderada' },
    { label: 'Difícil', value: 'Difícil' },
    { label: 'Muy Difícil', value: 'Muy Difícil' }
  ];

  public routeTypes = [
    { label: 'Seleccionar tipo', value: null },
    { label: 'Circular', value: 1 },
    { label: 'Lineal', value: 2 },
    { label: 'Travesía', value: 3 }
  ];

  private subscriptions: Subscription[] = [];
  private title: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private titleShareService: TitleShareService,
    private routeService: RouteService,
    private messageService: MessageService,
    private myPermissionShareService: MyPermissionShareService,
    private wrPermissionShareService: WRPermissionShareService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.checkRouteMode();
    this.setupSubscriptions();
    this._changeMyPermissions();
    this.setupDescriptionListener();
  }

  private setupDescriptionListener(): void {
    // Escuchar cambios en el campo descripción para mostrar advertencias
    this.routeForm.get('description')?.valueChanges.subscribe(value => {
      if (value) {
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        if (emojiRegex.test(value)) {
          // Marcar el campo como que tiene emojis para mostrar la advertencia
          this.routeForm.get('description')?.setErrors({ containsEmojis: true });
        } else {
          // Limpiar el error de emojis si no los hay
          const currentErrors = this.routeForm.get('description')?.errors;
          if (currentErrors && currentErrors['containsEmojis']) {
            delete currentErrors['containsEmojis'];
            const hasOtherErrors = Object.keys(currentErrors).length > 0;
            this.routeForm.get('description')?.setErrors(hasOtherErrors ? currentErrors : null);
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeForm(): void {
    this.routeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      date: ['', Validators.required],
      start_point: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(1000)],
      distance_km: ['', [Validators.required, Validators.min(0.1), Validators.max(999.99)]],
      distance_m: ['', [Validators.required, Validators.min(1)]],
      elevation_gain: ['', [Validators.required, Validators.min(0)]],
      max_height: ['', [Validators.required, Validators.min(0)]],
      min_height: ['', [Validators.required, Validators.min(0)]],
      estimated_duration_hours: ['', [Validators.required, Validators.min(0), Validators.max(23)]],
      estimated_duration_minutes: ['', [Validators.required, Validators.min(0), Validators.max(59)]],
      type: [null, Validators.required],
      difficulty: ['', Validators.required],
      sign_up_link: ['', Validators.maxLength(255)],
      wikiloc_link: ['', Validators.maxLength(255)],
      wikiloc_map_link: ['', [Validators.maxLength(2000), this.iframeValidator]]
    });
  }

  // Validador personalizado para iframe
  private iframeValidator(control: any) {
    if (!control.value) {
      return null; // Campo opcional, no validar si está vacío
    }
    
    const value = control.value.trim();
    
    // Verificar que contenga las etiquetas iframe básicas
    const iframeRegex = /<iframe[^>]*>.*<\/iframe>/i;
    
    if (!iframeRegex.test(value)) {
      return { invalidIframe: true };
    }
    
    // Verificar que contenga src con wikiloc
    const srcRegex = /src\s*=\s*["'][^"']*wikiloc[^"']*["']/i;
    
    if (!srcRegex.test(value)) {
      return { invalidWikilocSrc: true };
    }
    
    return null;
  }

  // Validador para caracteres Unicode/emojis - Modo advertencia
  private unicodeValidator(control: any) {
    if (!control.value) {
      return null; // Campo opcional, no validar si está vacío
    }
    
    const value = control.value;
    
    // Verificar si contiene emojis o caracteres especiales que podrían causar problemas
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    
    if (emojiRegex.test(value)) {
      // En lugar de bloquear, solo advertir
      return { containsEmojis: true };
    }
    
    return null;
  }

  // Función para limpiar emojis del texto
  private cleanEmojis(text: string): string {
    if (!text) return text;
    
    // Regex para detectar emojis
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    
    // Reemplazar emojis con texto descriptivo o eliminarlos
    return text.replace(emojiRegex, '[emoji]');
  }

  private checkRouteMode(): void {
    this.routeId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.routeId;
    
    if (this.isEditMode) {
      this.title = 'Editar Ruta';
      this.loadRoute();
    } else {
      this.title = 'Nueva Ruta';
      // Establecer fecha por defecto a hoy
      const today = new Date().toISOString().split('T')[0];
      this.routeForm.patchValue({ date: today });
    }
    
    this.changeTitle();
  }

  private setupSubscriptions(): void {
    // Suscripción para obtener ruta específica
    const getRouteSub = this.routeService.onGetRoute().subscribe(
      (response: any) => {
        this.loading = false;
        if (response.data) {
          this.populateForm(response.data);
        }
      },
      (error) => {
        this.loading = false;
        this.errorMessage = 'Error al cargar la ruta';
        console.error('Error loading route:', error);
      }
    );

    // Suscripción para crear ruta
    const addRouteSub = this.routeService.onAddRoute().subscribe(
      (response: any) => {
        this.saving = false;
        if (response.data) {
          console.log('Route created successfully:', response);
          
          // Mostrar mensaje de éxito
          if (response.message) {
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Alta', 
              detail: response.message, 
              life: 2000 
            });
          }
          
          // Navegar de vuelta a la lista después de un breve delay para que se vea el mensaje
          setTimeout(() => {
            this.router.navigate(['/routes']);
          }, 1000);
        }
      },
      (error) => {
        this.saving = false;
        this.errorMessage = 'Error al crear la ruta';
        console.error('Error creating route:', error);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Error al crear la ruta', 
          life: 3000 
        });
      }
    );

    // Suscripción para editar ruta
    const editRouteSub = this.routeService.onEditRoute().subscribe(
      (response: any) => {
        this.saving = false;
        if (response.data) {
          console.log('Route updated successfully:', response);
          
          // Mostrar mensaje de éxito
          if (response.message) {
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Edición', 
              detail: response.message, 
              life: 2000 
            });
          }
          
          // Navegar de vuelta a la lista después de un breve delay para que se vea el mensaje
          setTimeout(() => {
            this.router.navigate(['/routes']);
          }, 1000);
        }
      },
      (error) => {
        this.saving = false;
        this.errorMessage = 'Error al actualizar la ruta';
        console.error('Error updating route:', error);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Error al actualizar la ruta', 
          life: 3000 
        });
      }
    );

    // Suscripción para manejar errores del servidor
    const errorSub = this.routeService.onError().subscribe(
      (error: any) => {
        this.saving = false;
        this.loading = false;
        this.errorMessage = error.message || 'Error desconocido';
        console.error('Server error:', error);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: error.message || 'Error desconocido', 
          life: 3000 
        });
      }
    );

    this.subscriptions.push(getRouteSub, addRouteSub, editRouteSub, errorSub);
  }

  private loadRoute(): void {
    if (this.routeId) {
      this.loading = true;
      this.routeService.getRoute(this.routeId);
    }
  }

  private populateForm(route: any): void {
    // Convertir fecha al formato requerido por input date
    let formattedDate = '';
    if (route.date) {
      const date = new Date(route.date);
      formattedDate = date.toISOString().split('T')[0];
    }

    this.routeForm.patchValue({
      name: route.name || '',
      date: formattedDate,
      start_point: route.start_point || '',
      description: route.description || '',
      distance_km: route.distance_km || '',
      distance_m: route.distance_m || '',
      elevation_gain: route.elevation_gain || '',
      max_height: route.max_height || '',
      min_height: route.min_height || '',
      estimated_duration_hours: route.estimated_duration_hours || '',
      estimated_duration_minutes: route.estimated_duration_minutes || '',
      type: route.type || null,
      difficulty: route.difficulty || '',
      sign_up_link: route.sign_up_link || '',
      wikiloc_link: route.wikiloc_link || '',
      wikiloc_map_link: route.wikiloc_map_link || ''
    });

    // Populate attached file information if exists
    if (route.file_track && route.filename_track) {
      this.attachedFile = {
        fileTrack: route.file_track,
        filenameTrack: route.filename_track,
        uploadDate: route.updated_at ? new Date(route.updated_at) : new Date(),
        fileSize: 0, // Size not available from route data
        mimeType: this.getMimeTypeFromFilename(route.filename_track)
      };
    } else {
      this.attachedFile = null;
    }
  }

  changeTitle(): void {
    this.titleShareService.changeTitle(this.title);
  }

  changeWRPermission(): void {
    this.wrPermissionShareService.changeWRPermission(this.wrPermission);
  }

  onSubmit(): void {
    if (this.routeForm.valid) {
      this.saving = true;
      this.errorMessage = '';
      
      const formData = { ...this.routeForm.value };
      
      // Limpiar emojis de la descripción si los hay
      if (formData.description) {
        formData.description = this.cleanEmojis(formData.description);
      }
      
      // Convertir valores numéricos
      if (formData.distance_km) formData.distance_km = parseFloat(formData.distance_km);
      if (formData.distance_m) formData.distance_m = parseInt(formData.distance_m);
      if (formData.elevation_gain) formData.elevation_gain = parseInt(formData.elevation_gain);
      if (formData.max_height) formData.max_height = parseInt(formData.max_height);
      if (formData.min_height) formData.min_height = parseInt(formData.min_height);
      if (formData.estimated_duration_hours) formData.estimated_duration_hours = parseInt(formData.estimated_duration_hours);
      if (formData.estimated_duration_minutes) formData.estimated_duration_minutes = parseInt(formData.estimated_duration_minutes);
      if (formData.type) formData.type = parseInt(formData.type);
      
      // Include file data if present
      if (this.fileData) {
        formData.fileData = this.fileData;
      }
      
      if (this.isEditMode && this.routeId) {
        formData.id = this.routeId;
        this.routeService.editRoute(formData);
      } else {
        this.routeService.addRoute(formData);
      }
    } else {
      this.markFormGroupTouched();
      this.errorMessage = 'Por favor, corrige los errores en el formulario';
    }
  }

  onCancel(): void {
    this.router.navigate(['/routes']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.routeForm.controls).forEach(key => {
      const control = this.routeForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // Getters para validaciones en template
  get name() { return this.routeForm.get('name'); }
  get date() { return this.routeForm.get('date'); }
  get start_point() { return this.routeForm.get('start_point'); }
  get description() { return this.routeForm.get('description'); }
  get distance_km() { return this.routeForm.get('distance_km'); }
  get distance_m() { return this.routeForm.get('distance_m'); }
  get elevation_gain() { return this.routeForm.get('elevation_gain'); }
  get max_height() { return this.routeForm.get('max_height'); }
  get min_height() { return this.routeForm.get('min_height'); }
  get estimated_duration_hours() { return this.routeForm.get('estimated_duration_hours'); }
  get estimated_duration_minutes() { return this.routeForm.get('estimated_duration_minutes'); }
  get type() { return this.routeForm.get('type'); }
  get difficulty() { return this.routeForm.get('difficulty'); }
  get sign_up_link() { return this.routeForm.get('sign_up_link'); }
  get wikiloc_link() { return this.routeForm.get('wikiloc_link'); }
  get wikiloc_map_link() { return this.routeForm.get('wikiloc_map_link'); }

  // Métodos de utilidad para el template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.routeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.routeForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} es obligatorio`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) return `${this.getFieldLabel(fieldName)} no puede exceder ${field.errors['maxlength'].requiredLength} caracteres`;
      if (field.errors['min']) return `${this.getFieldLabel(fieldName)} debe ser mayor a ${field.errors['min'].min}`;
      if (field.errors['max']) return `${this.getFieldLabel(fieldName)} debe ser menor a ${field.errors['max'].max}`;
      if (field.errors['pattern']) return `${this.getFieldLabel(fieldName)} tiene un formato inválido`;
      if (field.errors['invalidIframe']) return 'Debe ser un código iframe válido (debe contener <iframe>...</iframe>)';
      if (field.errors['invalidWikilocSrc']) return 'El iframe debe contener una URL de Wikiloc en el atributo src';
      if (field.errors['containsEmojis']) return 'Los emojis serán convertidos a texto al guardar para evitar problemas de codificación';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'name': 'Nombre',
      'date': 'Fecha',
      'start_point': 'Punto de inicio',
      'description': 'Descripción',
      'distance_km': 'Distancia (km)',
      'distance_m': 'Distancia (m)',
      'elevation_gain': 'Desnivel positivo',
      'max_height': 'Altura máxima',
      'min_height': 'Altura mínima',
      'estimated_duration_hours': 'Horas de duración',
      'estimated_duration_minutes': 'Minutos de duración',
      'type': 'Tipo de ruta',
      'difficulty': 'Dificultad',
      'sign_up_link': 'Enlace de inscripción',
      'wikiloc_link': 'Enlace Wikiloc',
      'wikiloc_map_link': 'Código iframe mapa Wikiloc'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * File attachment event handlers
   */
  onFileAttached(fileData: FileData): void {
    this.fileData = fileData;
    this.fileOperationInProgress = false;
    
    console.log('File attached:', fileData);
    
    // Update attached file info for display
    if (fileData.file) {
      this.attachedFile = {
        fileTrack: '', // Will be generated on server
        filenameTrack: fileData.file.name,
        uploadDate: new Date(),
        fileSize: fileData.file.size,
        mimeType: fileData.file.type
      };
    }
  }

  onFileRemoved(): void {
    // Set file data to indicate removal
    this.fileData = {
      removeExisting: this.attachedFile !== null
    };
    
    // Clear attached file info
    this.attachedFile = null;
    this.fileOperationInProgress = false;
    
    console.log('File removed, fileData set to:', this.fileData);
  }

  /**
   * Utility method to get MIME type from filename
   */
  private getMimeTypeFromFilename(filename: string): string {
    if (!filename) return 'application/octet-stream';
    
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const mimeTypes: { [key: string]: string } = {
      // Hiking track formats
      'gpx': 'application/gpx+xml',
      'kml': 'application/vnd.google-earth.kml+xml',
      'kmz': 'application/vnd.google-earth.kmz',
      // Other common formats (kept for compatibility)
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'txt': 'text/plain',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed'
    };
    
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  /**
   * Check if form is in a loading state (saving or file operations)
   */
  get isFormDisabled(): boolean {
    return this.saving || this.fileOperationInProgress || this.loading;
  }

  /**
   * Control de permisos
   */
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
            // Si solo tiene permisos de lectura, redirigir a la lista
            this.messageService.add({ 
              severity: 'warn', 
              summary: 'Permiso', 
              detail: 'No tiene permisos para crear o editar rutas', 
              life: 3000 
            });
            this.router.navigate(['/routes']);
          }
        }
      }
    });

    this.subscriptions.push(ob);
  }
}