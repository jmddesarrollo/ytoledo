import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { TitleShareService } from '../../../services/share/title.service';
import { RouteService } from '../../../services/websockets/route.service';
import { FileService } from '../../../services/websockets/file.service';
import { FileAttachmentService } from '../../../services/websockets/file-attachment.service';
import { RouteModel } from '../../../models/route.model';
import { MessageService } from 'primeng/api';
import { MyPermissionShareService } from '../../../services/share/my-permission.service';
import { WRPermissionShareService } from '../../../services/share/wr-permission';
import { RoleHasPermission } from '../../../models/roleHasPermission.model';
import { GLOBAL } from '../../../services/global';
import { WebsocketService } from '../../../services/websocket.service';

@Component({
  selector: 'app-route-detail',
  templateUrl: './route-detail.component.html',
  styleUrls: ['./route-detail.component.css']
})
export class RouteDetailComponent implements OnInit, OnDestroy {

  public route: RouteModel | null = null;
  public loading: boolean = false;
  public routeId: number | null = null;
  public errorMessage: string = '';

  // Control de permisos
  public permission: RoleHasPermission | undefined;
  public permissionWriting: boolean = false;
  public wrPermission: string = 'U';
  public loadingPermission: boolean = false;
  private permissionViewId: number = GLOBAL.permission_routes_manager;

  private subscriptions: Subscription[] = [];
  private title: string = 'Detalle de Ruta';

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private titleShareService: TitleShareService,
    private routeService: RouteService,
    private fileService: FileService,
    private fileAttachmentService: FileAttachmentService,
    private messageService: MessageService,
    private myPermissionShareService: MyPermissionShareService,
    private wrPermissionShareService: WRPermissionShareService,
    private websocketService: WebsocketService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.changeTitle();
    this.getRouteId();
    this.setupSubscriptions();
    
    // Solo verificar permisos si hay sesión activa
    if (this.websocketService.sessionOn) {
      this._changeMyPermissions();
    }
    
    this.loadRoute();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private getRouteId(): void {
    this.routeId = this.activatedRoute.snapshot.params['id'];
    if (!this.routeId) {
      this.errorMessage = 'ID de ruta no válido';
      return;
    }
  }

  private setupSubscriptions(): void {
    // Suscripción para obtener ruta específica (ahora pública)
    const getRouteSub = this.routeService.onGetRoute().subscribe(
      (response: any) => {
        this.loading = false;
        if (response.data) {
          this.route = response.data;
          this.title = `Ruta: ${this.route.name}`;
          this.changeTitle();
        }
      },
      (error) => {
        this.loading = false;
        this.errorMessage = 'Error al cargar la ruta';
        console.error('Error loading route:', error);
      }
    );

    // Suscripción para eliminar ruta (solo para usuarios autenticados con permisos)
    const deleteRouteSub = this.routeService.onDeleteRoute().subscribe(
      (response: any) => {
        console.log('Route deleted:', response);
        
        // Mostrar mensaje de éxito
        if (response.message) {
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Eliminación', 
            detail: response.message, 
            life: 2000 
          });
        }
        
        // Navegar de vuelta a la lista de rutas
        this.router.navigate(['/routes']);
      },
      (error) => {
        this.errorMessage = 'Error al eliminar la ruta';
        console.error('Error deleting route:', error);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Error al eliminar la ruta', 
          life: 3000 
        });
      }
    );

    // Suscripción para descarga de archivos
    const downloadFileSub = this.fileService._downFile().subscribe(
      (response: any) => {
        if (response.success) {
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Descarga', 
            detail: 'Archivo descargado correctamente', 
            life: 2000 
          });
        } else {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: response.message || 'Error al descargar el archivo', 
            life: 3000 
          });
        }
      },
      (error) => {
        console.error('Error downloading file:', error);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Error al descargar el archivo', 
          life: 3000 
        });
      }
    );

    // Suscripción para descarga de archivos adjuntos via WebSocket
    const downloadAttachedFileSub = this.fileAttachmentService.onDownloadAttachedFile().subscribe(
      (response: any) => {
        console.log('File download response:', response);
        
        try {
          if (response.success && response.data) {
            // Create blob from base64 data
            const byteCharacters = atob(response.data.fileData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/octet-stream' });
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = response.data.filename || 'archivo.gpx';
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            setTimeout(() => {
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
            }, 100);
            
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Descarga exitosa', 
              detail: 'El archivo se ha descargado correctamente', 
              life: 3000 
            });
          } else {
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error de descarga', 
              detail: response.message || 'Error al descargar el archivo', 
              life: 3000 
            });
          }
        } catch (processingError) {
          console.error('Error processing download response:', processingError);
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error de procesamiento', 
            detail: 'Error al procesar la respuesta de descarga', 
            life: 3000 
          });
        }
      },
      (error) => {
        console.error('Error downloading attached file:', error);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error de descarga', 
          detail: 'Error al descargar el archivo adjunto', 
          life: 3000 
        });
      }
    );

    this.subscriptions.push(getRouteSub, deleteRouteSub, downloadFileSub, downloadAttachedFileSub);
  }

  private loadRoute(): void {
    if (this.routeId) {
      this.loading = true;
      this.routeService.getRoute(this.routeId);
    }
  }

  changeTitle(): void {
    this.titleShareService.changeTitle(this.title);
  }

  goBack(): void {
    // Navegación inteligente basada en el referrer o contexto
    this.router.navigate(['/routes-public']);
  }

  editRoute(): void {
    if (this.routeId) {
      this.router.navigate(['/routes/edit', this.routeId]);
    }
  }

  deleteRoute(): void {
    if (this.route && confirm(`¿Estás seguro de que quieres eliminar la ruta "${this.route.name}"?`)) {
      this.routeService.deleteRoute(this.route);
    }
  }

  // Métodos de utilidad para el template
  formatDate(date: string): string {
    if (!date) return 'No especificada';
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDistance(distance: number): string {
    return (distance !== null && distance !== undefined) ? `${distance} km` : 'No especificada';
  }

  formatHeight(height: number): string {
    return (height !== null && height !== undefined) ? `${height} m` : 'No especificada';
  }

  formatDuration(): string {
    if (!this.route) return 'No especificada';
    
    // Intentar con ambos formatos: camelCase y snake_case
    // Usar nullish coalescing para manejar correctamente el valor 0
    const hours = this.route.estimatedDurationHours ?? this.route['estimated_duration_hours'] ?? 0;
    const minutes = this.route.estimatedDurationMinutes ?? this.route['estimated_duration_minutes'] ?? 0;
    
    if (hours > 0 || minutes > 0) {
      return `${hours}h ${minutes}min`;
    }
    return 'No especificada';
  }

  // Métodos helper para obtener valores con compatibilidad de formatos
  getStartPoint(): string {
    if (!this.route) return 'No especificado';
    return this.route.startPoint || this.route['start_point'] || 'No especificado';
  }

  getDistanceKm(): number {
    if (!this.route) return 0;
    // Usar nullish coalescing para manejar correctamente el valor 0
    return this.route.distanceKm ?? this.route['distance_km'] ?? 0;
  }

  getElevationGain(): number {
    if (!this.route) return 0;
    return this.route.elevationGain ?? this.route['elevation_gain'] ?? 0;
  }

  getMaxHeight(): number {
    if (!this.route) return 0;
    return this.route.maxHeight ?? this.route['max_height'] ?? 0;
  }

  getMinHeight(): number {
    if (!this.route) return 0;
    return this.route.minHeight ?? this.route['min_height'] ?? 0;
  }

  getSignUpLink(): string {
    if (!this.route) return '';
    return this.route.signUpLink || this.route['sign_up_link'] || '';
  }

  getWikilocLink(): string {
    if (!this.route) return '';
    return this.route.wikilocLink || this.route['wikiloc_link'] || '';
  }

  getWikilocMapLink(): SafeHtml {
    if (!this.route) return '';
    const mapLink = this.route.wikilocMapLink || this.route['wikiloc_map_link'] || '';
    if (!mapLink) return '';
    
    // Sanitizar el HTML para permitir el iframe
    return this.sanitizer.bypassSecurityTrustHtml(mapLink);
  }

  hasWikilocMapLink(): boolean {
    if (!this.route) return false;
    const mapLink = this.route.wikilocMapLink || this.route['wikiloc_map_link'] || '';
    return !!mapLink.trim();
  }

  getDifficultyClass(difficulty: string): string {
    switch (difficulty) {
      case 'Fácil': return 'w3-green';
      case 'Moderada': return 'w3-yellow';
      case 'Difícil': return 'w3-orange';
      case 'Muy Difícil': return 'w3-red';
      default: return 'w3-grey';
    }
  }

  getRouteTypeLabel(type: number): string {
    switch (type) {
      case 1: return 'Circular';
      case 2: return 'Lineal';
      case 3: return 'Travesía';
      default: return 'No especificado';
    }
  }

  openLink(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  downloadAttachedFile(): void {
    // Support both camelCase and snake_case field names for compatibility
    const fileTrack = this.route?.fileTrack || this.route?.['file_track'];
    const filenameTrack = this.route?.filenameTrack || this.route?.['filename_track'];
    
    if (this.route && fileTrack && filenameTrack) {
      // Use the FileAttachmentService to download the file via WebSocket
      this.fileAttachmentService.downloadAttachedFile(fileTrack);
      
      this.messageService.add({ 
        severity: 'info', 
        summary: 'Descarga iniciada', 
        detail: 'La descarga del archivo ha comenzado', 
        life: 2000 
      });
    } else {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Advertencia', 
        detail: 'No hay archivo adjunto para descargar', 
        life: 3000 
      });
    }
  }

  // Helper method to check if route has an attached file
  hasAttachedFile(): boolean {
    if (!this.route) return false;
    
    // Support both camelCase and snake_case field names for compatibility
    const fileTrack = this.route.fileTrack || this.route['file_track'];
    return !!(fileTrack && fileTrack.trim() !== '');
  }

  // Métodos de control de permisos
  changeWRPermission(): void {
    this.wrPermissionShareService.changeWRPermission(this.wrPermission);
  }

  _changeMyPermissions(): void {
    const ob = this.myPermissionShareService.currentMyPermissions.subscribe((myPermissions: RoleHasPermission[]) => {
      this.permission = myPermissions.find(mp => mp.permissions_id === this.permissionViewId);
      this.permissionWriting = false;

      // Solo aplicar lógica de permisos si hay sesión activa
      if (this.websocketService.sessionOn) {
        // Se da un tiempo de 2s por si se producen cambios rápidos antes de echar al usuario,
        // además el permiso al inicio de la vista llega 'undefined' y echa al usuario, aunque al regresar datos del backend tenga realmente permisos
        if (!this.loadingPermission) {
          this.loadingPermission = true;
          setTimeout(() => {
            if (!this.permission) {
              this.messageService.add({ 
                severity: 'warn', 
                summary: 'Permiso', 
                detail: 'El usuario no tiene permisos para gestionar rutas', 
                life: 4000 
              });
              // No redirigir, solo ocultar botones de gestión
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
      }
    });

    this.subscriptions.push(ob);
  }

  // Método para verificar si el usuario puede editar/eliminar
  canEdit(): boolean {
    return this.websocketService.sessionOn && this.permissionWriting;
  }
}