import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { TitleShareService } from '../../../services/share/title.service';
import { RouteService } from '../../../services/websockets/route.service';
import { RouteModel } from '../../../models/route.model';
import { MessageService } from 'primeng/api';

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

  private subscriptions: Subscription[] = [];
  private title: string = 'Detalle de Ruta';

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private titleShareService: TitleShareService,
    private routeService: RouteService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.changeTitle();
    this.getRouteId();
    this.setupSubscriptions();
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
    // Suscripción para obtener ruta específica
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

    // Suscripción para eliminar ruta
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

    this.subscriptions.push(getRouteSub, deleteRouteSub);
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
    this.router.navigate(['/routes']);
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

  getWikilocMapLink(): string {
    if (!this.route) return '';
    return this.route.wikilocMapLink || this.route['wikiloc_map_link'] || '';
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
}