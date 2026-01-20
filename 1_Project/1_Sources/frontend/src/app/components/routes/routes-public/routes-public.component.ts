import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { TitleShareService } from '../../../services/share/title.service';
import { RouteService } from '../../../services/websockets/route.service';
import { RouteModel } from '../../../models/route.model';

@Component({
  selector: 'app-routes-public',
  templateUrl: './routes-public.component.html',
  styleUrls: ['./routes-public.component.css']
})
export class RoutesPublicComponent implements OnInit, OnDestroy {

  public routes: RouteModel[] = [];
  public loading: boolean = false;
  public currentPage: number = 1;
  public pageSize: number = 12;
  public totalRecords: number = 0;
  public totalPages: number = 0;

  // Filtros públicos (más simples que los de gestión)
  public filters = {
    search: '',
    difficulty: '',
    dateFrom: null
  };

  public difficulties = [
    { label: 'Todas las dificultades', value: '' },
    { label: 'Fácil', value: 'Fácil' },
    { label: 'Moderada', value: 'Moderada' },
    { label: 'Difícil', value: 'Difícil' },
    { label: 'Muy Difícil', value: 'Muy Difícil' }
  ];

  private subscriptions: Subscription[] = [];
  private title: string = 'Rutas de Senderismo';

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
        console.log('Public routes loaded:', this.routes);
      },
      (error) => {
        this.loading = false;
        console.error('Error loading public routes:', error);
      }
    );

    this.subscriptions.push(getRoutesSub);
  }

  loadRoutes(): void {
    this.loading = true;
    
    const requestFilters = {
      ...this.filters,
      page: this.currentPage,
      limit: this.pageSize,
      // Solo mostrar rutas futuras en vista pública
      dateFrom: new Date().toISOString().split('T')[0]
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
      dateFrom: null
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

  formatDistance(distance: number): string {
    return distance ? `${distance} km` : 'N/A';
  }

  formatDate(date: string): string {
    if (!date) return 'Fecha por confirmar';
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDuration(route: RouteModel): string {
    // Intentar con ambos formatos: camelCase y snake_case
    const hours = route.estimatedDurationHours || route['estimated_duration_hours'] || 0;
    const minutes = route.estimatedDurationMinutes || route['estimated_duration_minutes'] || 0;
    
    if (hours > 0 || minutes > 0) {
      return `${hours}h ${minutes}min`;
    }
    return 'Duración por confirmar';
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
      default: return 'Tipo por confirmar';
    }
  }

  openSignUpLink(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  // Método para determinar si una ruta es próxima (en los próximos 7 días)
  isUpcoming(date: string): boolean {
    if (!date) return false;
    const routeDate = new Date(date);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return routeDate >= today && routeDate <= nextWeek;
  }

  // Método para determinar si una ruta es futura (más de 7 días)
  isFuture(date: string): boolean {
    if (!date) return false;
    const routeDate = new Date(date);
    const nextWeek = new Date();
    nextWeek.setDate(new Date().getDate() + 7);
    
    return routeDate > nextWeek;
  }
}