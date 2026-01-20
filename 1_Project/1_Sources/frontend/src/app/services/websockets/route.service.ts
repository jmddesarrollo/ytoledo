import { Injectable } from '@angular/core';
import { WebsocketService } from '../websocket.service';
import { Observable } from 'rxjs';

import { RouteModel } from '../../models/route.model';

@Injectable()
export class RouteService {
  constructor(private wsService: WebsocketService) {
  }

  getRoutes(filters?: any): void {
    this.wsService.emit('route/getRoutes', { filters });
  }
  onGetRoutes(): Observable<RouteModel[]> {
    return this.wsService.listen('route/getRoutes');
  }

  getNextRoute(): void {
    console.log('getNextRoute Service');
    this.wsService.emit('route/getNextRoute', {});
  }
  onGetNextRoute(): Observable<RouteModel> {
    console.log('onGetNextRoute Service');
    return this.wsService.listen('route/getNextRoute');
  }

  getRoute(routeId: number): void {
    this.wsService.emit('route/getRoute', { routeId });
  }
  onGetRoute(): Observable<RouteModel> {
    return this.wsService.listen('route/getRoute');
  }

  addRoute(route: RouteModel): void {
    this.wsService.emit('route/addRoute', { route });
  }
  onAddRoute(): Observable<RouteModel> {
    return this.wsService.listen('route/addRoute');
  }

  editRoute(route: RouteModel): void {
    this.wsService.emit('route/editRoute', { route });
  }
  onEditRoute(): Observable<RouteModel> {
    return this.wsService.listen('route/editRoute');
  }

  deleteRoute(route: RouteModel): void {
    this.wsService.emit('route/deleteRoute', { route });
  }
  onDeleteRoute(): Observable<number> {
    return this.wsService.listen('route/deleteRoute');
  }

  // Método para escuchar errores del servidor
  onError(): Observable<any> {
    return this.wsService.listen('error_message');
  }
}
