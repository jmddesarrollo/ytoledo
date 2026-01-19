import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { TitleShareService } from '../../../services/share/title.service';
import { RouteService } from '../../../services/websockets/route.service';
import { RouteModel } from '../../../models/route.model';

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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.changeTitle();
    this.setupSubscriptions();
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
        console.log('Routes loaded:', this.routes);
      },
      (error) => {
        this.loading = false;
        console.error('Error loading routes:', error);
      }
    );

    // Suscripción para eliminar ruta
    const deleteRouteSub = this.routeService.onDeleteRoute().subscribe(
      (response: any) => {
        console.log('Route deleted:', response);
        this.loadRoutes(); // Recargar lista
      }
    );

    this.subscriptions.push(getRoutesSub, deleteRouteSub);
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

  formatDistance(distance: number): string {
    return distance ? `${distance} km` : 'N/A';
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES');
  }

}
