import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { TitleShareService } from '../../../services/share/title.service';
import { RouteService } from '../../../services/websockets/route.service';
import { RouteModel } from '../../../models/route.model';

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
    private routeService: RouteService
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
        this.router.navigate(['/routes']);
      },
      (error) => {
        this.errorMessage = 'Error al eliminar la ruta';
        console.error('Error deleting route:', error);
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
    return distance ? `${distance} km` : 'No especificada';
  }

  formatHeight(height: number): string {
    return height ? `${height} m` : 'No especificada';
  }

  formatDuration(duration: string): string {
    return duration || 'No especificada';
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