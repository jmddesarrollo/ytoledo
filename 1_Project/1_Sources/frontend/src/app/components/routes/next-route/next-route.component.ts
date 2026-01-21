import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { TitleShareService } from '../../../services/share/title.service';
import { RouteService } from '../../../services/websockets/route.service';
import { RouteModel } from '../../../models/route.model';

@Component({
  selector: 'app-next-route',
  templateUrl: './next-route.component.html',
  styleUrls: ['./next-route.component.css']
})
export class NextRouteComponent implements OnInit, OnDestroy {

  public nextRoute: RouteModel | null = null;
  public loading: boolean = false;
  public errorMessage: string = '';

  private subscriptions: Subscription[] = [];
  private title: string = 'Próxima Ruta';

  constructor(
    private titleShareService: TitleShareService,
    private routeService: RouteService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.changeTitle();
    this.setupSubscriptions();
    this.loadNextRoute();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupSubscriptions(): void {
    // Suscripción para obtener la próxima ruta
    const getNextRouteSub = this.routeService.onGetNextRoute().subscribe(
      (response: any) => {
        this.loading = false;
        if (response.data) {
          this.nextRoute = response.data;
          this.title = `Próxima Ruta: ${this.nextRoute.name}`;
          this.changeTitle();
        } else {
          this.errorMessage = 'No hay rutas programadas próximamente';
        }
      },
      (error) => {
        this.loading = false;
        this.errorMessage = 'Error al cargar la próxima ruta';
        console.error('Error loading next route:', error);
      }
    );

    this.subscriptions.push(getNextRouteSub);
  }

  public loadNextRoute(): void {
    this.loading = true;
    this.routeService.getNextRoute();
  }

  changeTitle(): void {
    this.titleShareService.changeTitle(this.title);
  }

  // Métodos de utilidad para el template
  formatDate(date: string): string {
    if (!date) return 'Fecha por confirmar';
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
    if (!this.nextRoute) return 'No especificada';
    
    // Intentar con ambos formatos: camelCase y snake_case
    // Usar nullish coalescing para manejar correctamente el valor 0
    const hours = this.nextRoute.estimatedDurationHours ?? this.nextRoute['estimated_duration_hours'] ?? 0;
    const minutes = this.nextRoute.estimatedDurationMinutes ?? this.nextRoute['estimated_duration_minutes'] ?? 0;
    
    if (hours > 0 || minutes > 0) {
      return `${hours}h ${minutes}min`;
    }
    return 'No especificada';
  }

  // Métodos helper para obtener valores con compatibilidad de formatos
  getStartPoint(): string {
    if (!this.nextRoute) return 'No especificado';
    return this.nextRoute.startPoint || this.nextRoute['start_point'] || 'No especificado';
  }

  getDistanceKm(): number {
    if (!this.nextRoute) return 0;
    // Usar nullish coalescing para manejar correctamente el valor 0
    return this.nextRoute.distanceKm ?? this.nextRoute['distance_km'] ?? 0;
  }

  getElevationGain(): number {
    if (!this.nextRoute) return 0;
    return this.nextRoute.elevationGain ?? this.nextRoute['elevation_gain'] ?? 0;
  }

  getMaxHeight(): number {
    if (!this.nextRoute) return 0;
    return this.nextRoute.maxHeight ?? this.nextRoute['max_height'] ?? 0;
  }

  getMinHeight(): number {
    if (!this.nextRoute) return 0;
    return this.nextRoute.minHeight ?? this.nextRoute['min_height'] ?? 0;
  }

  getSignUpLink(): string {
    if (!this.nextRoute) return '';
    return this.nextRoute.signUpLink || this.nextRoute['sign_up_link'] || '';
  }

  getWikilocLink(): string {
    if (!this.nextRoute) return '';
    return this.nextRoute.wikilocLink || this.nextRoute['wikiloc_link'] || '';
  }

  getWikilocMapLink(): SafeHtml {
    if (!this.nextRoute) return '';
    const mapLink = this.nextRoute.wikilocMapLink || this.nextRoute['wikiloc_map_link'] || '';
    if (!mapLink) return '';
    
    // Sanitizar el HTML para permitir el iframe
    return this.sanitizer.bypassSecurityTrustHtml(mapLink);
  }

  hasWikilocMapLink(): boolean {
    if (!this.nextRoute) return false;
    const mapLink = this.nextRoute.wikilocMapLink || this.nextRoute['wikiloc_map_link'] || '';
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
}