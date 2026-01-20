import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

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
    private routeService: RouteService
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

  private loadNextRoute(): void {
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
    return distance ? `${distance} km` : 'Distancia por confirmar';
  }

  formatHeight(height: number): string {
    return height ? `${height} m` : 'No especificada';
  }

  formatDuration(): string {
    if (!this.nextRoute) return 'No especificada';
    
    // Intentar con ambos formatos: camelCase y snake_case
    const hours = this.nextRoute.estimatedDurationHours || this.nextRoute['estimated_duration_hours'] || 0;
    const minutes = this.nextRoute.estimatedDurationMinutes || this.nextRoute['estimated_duration_minutes'] || 0;
    
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

  openLink(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }
}