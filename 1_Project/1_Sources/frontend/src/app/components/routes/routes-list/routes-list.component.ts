import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { TitleShareService } from '../../../services/share/title.service';
import { RouteService } from '../../../services/websockets/route.service';
import { RouteModel } from '../../../models/route.model';
import { MessageService } from 'primeng/api';
import { MyPermissionShareService } from '../../../services/share/my-permission.service';
import { WRPermissionShareService } from '../../../services/share/wr-permission';
import { RoleHasPermission } from '../../../models/roleHasPermission.model';
import { GLOBAL } from '../../../services/global';

@Component({
  selector: 'app-routes-list',
  templateUrl: './routes-list.component.html',
  styleUrls: ['./routes-list.component.css']
})
export class RoutesListComponent implements OnInit, OnDestroy {

  public routes: RouteModel[] = [];
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
    difficulty: '',
    minDistance: null,
    maxDistance: null,
    dateFrom: null,
    dateTo: null
  };

  public difficulties = [
    { label: 'Todas', value: '' },
    { label: 'Fácil', value: 'Fácil' },
    { label: 'Moderada', value: 'Moderada' },
    { label: 'Difícil', value: 'Difícil' },
    { label: 'Muy Difícil', value: 'Muy Difícil' }
  ];

  private subscriptions: Subscription[] = [];
  private title: string = 'Gestión de Rutas';

  constructor(
    private titleShareService: TitleShareService,
    private routeService: RouteService,
    private router: Router,
    private messageService: MessageService,
    private myPermissionShareService: MyPermissionShareService,
    private wrPermissionShareService: WRPermissionShareService
  ) {}

  ngOnInit(): void {
    this.changeTitle();
    this.setupSubscriptions();
    this._changeMyPermissions();
    this.loadRoutes();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  changeTitle(): void {
    this.titleShareService.changeTitle(this.title);
  }

  setupSubscriptions(): void {
    // Suscripción para obtener rutas
    const getRoutesSub = this.routeService.onGetRoutes().subscribe(
      (response: any) => {
        this.loading = false;
        if (response.data) {
          if (response.data.routes) {
            // Respuesta con paginación
            this.routes = response.data.routes;
            if (response.data.pagination) {
              this.totalRecords = response.data.pagination.total;
              this.totalPages = response.data.pagination.totalPages;
              this.currentPage = response.data.pagination.page;
            }
          } else {
            // Respuesta simple sin paginación
            this.routes = response.data;
            this.totalRecords = this.routes.length;
          }
        }
      },
      (error) => {
        this.loading = false;
        console.error('Error loading routes:', error);
      }
    );

    // Suscripción para eliminar ruta
    const deleteRouteSub = this.routeService.onDeleteRoute().subscribe(
      (response: any) => {
        
        // Mostrar mensaje de éxito
        if (response.message) {
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Eliminación', 
            detail: response.message, 
            life: 2000 
          });
        }
        
        // Recargar lista para actualizar la tabla
        this.loadRoutes();
      },
      (error) => {
        console.error('Error deleting route:', error);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Error al eliminar la ruta', 
          life: 3000 
        });
      }
    );

    // Suscripción para escuchar eliminaciones de otros usuarios (websockets)
    const broadcastDeleteSub = this.routeService.onDeleteRoute().subscribe(
      (response: any) => {
        // Solo recargar si no es la eliminación que iniciamos nosotros
        if (response.data && response.data.route) {
          this.loadRoutes(); // Actualizar lista en tiempo real
        }
      }
    );

    // Suscripción para escuchar creaciones de otros usuarios (websockets)
    const addRouteSub = this.routeService.onAddRoute().subscribe(
      (response: any) => {
        if (response.data) {
          this.loadRoutes(); // Actualizar lista cuando se crea una nueva ruta
        }
      }
    );

    // Suscripción para escuchar ediciones de otros usuarios (websockets)
    const editRouteSub = this.routeService.onEditRoute().subscribe(
      (response: any) => {
        if (response.data) {
          this.loadRoutes(); // Actualizar lista cuando se edita una ruta
        }
      }
    );

    this.subscriptions.push(getRoutesSub, deleteRouteSub, broadcastDeleteSub, addRouteSub, editRouteSub);
  }

  loadRoutes(): void {
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

    this.routeService.getRoutes(requestFilters);
  }

  onFilterChange(): void {
    this.currentPage = 1; // Reset a primera página
    this.loadRoutes();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      difficulty: '',
      minDistance: null,
      maxDistance: null,
      dateFrom: null,
      dateTo: null
    };
    this.onFilterChange();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRoutes();
  }

  viewRoute(route: RouteModel): void {
    this.router.navigate(['/routes/detail', route.id]);
  }

  editRoute(route: RouteModel): void {
    this.router.navigate(['/routes/edit', route.id]);
  }

  deleteRoute(route: RouteModel): void {
    if (confirm(`¿Estás seguro de que quieres eliminar la ruta "${route.name}"?`)) {
      this.routeService.deleteRoute(route);
    }
  }

  createRoute(): void {
    this.router.navigate(['/routes/create']);
  }

  formatDistance(route: any): string {
    const distance = route.distanceKm ?? route['distance_km'] ?? 0;
    return (distance !== null && distance !== undefined) ? `${distance} km` : 'N/A';
  }

  formatDuration(route: any): string {
    if (!route) return 'N/A';
    
    const hours = route.estimatedDurationHours ?? route['estimated_duration_hours'] ?? 0;
    const minutes = route.estimatedDurationMinutes ?? route['estimated_duration_minutes'] ?? 0;
    
    if (hours > 0 || minutes > 0) {
      const hoursStr = hours.toString().padStart(2, '0');
      const minutesStr = minutes.toString().padStart(2, '0');
      return `${hoursStr}:${minutesStr}`;
    }
    return 'N/A';
  }

  getStartPoint(route: any): string {
    return route.startPoint || route['start_point'] || 'N/A';
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES');
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
  canEdit(): boolean {
    return this.permissionWriting;
  }

  canCreate(): boolean {
    return this.permissionWriting;
  }

}
