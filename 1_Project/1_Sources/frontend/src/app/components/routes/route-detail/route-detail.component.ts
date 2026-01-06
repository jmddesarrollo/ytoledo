import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { TitleShareService } from '../../../services/share/title.service';
import { MessageService } from 'primeng/api';
import { WebsocketService } from 'src/app/services/websocket.service';

import { RouteService } from '../../../services/websockets/route.service';
import { RouteModel } from '../../../models/route.model';

import { GLOBAL } from '../../../services/global';

@Component({
  selector: 'app-route-detail',
  templateUrl: './route-detail.component.html',
  styleUrls: ['./route-detail.component.css']
})
export class RouteDetailComponent implements OnInit, OnDestroy {
  private title: string;

  public route: RouteModel;

  private observables = new Array();

  constructor(
    private titleShareService: TitleShareService,
    private messageService: MessageService,
    private websocketService: WebsocketService,
    private routeService: RouteService,
    private router: Router
  ) {
    // Título de la página
    this.title = 'Detalle de ruta';

    // this.route = [] as unknown as RouteModel;

    this.route = {
      id: 0,
      date: '04/10/2025',
      name: 'Ruta de prueba',
      startPoint: 'Cervera',
      description: 'Descripción de la ruta de prueba',
      distanceKm: 12,
      distanceM: 650,
      elevationGain: 805,
      maxHeight: 1200,
      minHeight: 950,
      estimatedDurationHours: 4,
      estimatedDurationMinutes: 30,
      type: 1,
      difficulty: 'Media',
      signUpLink: 'https://y-toledo.es',
      wikilocLink: 'https://y-toledo.es',
      wikilocMapLink: null
    };
  }

  ngOnInit(): void {
    this.changeTitle();

    this.getNextRoute();

    this.onGetNextRoute();
  }

  ngOnDestroy() {
    for (const ob of this.observables) {
      if (ob !== undefined && ob !== null) {
        ob.unsubscribe();
      }
    }
  }

  changeTitle(): void {
    this.titleShareService.changeTitle(this.title);
  }

  getNextRoute(): void {
    console.log('getNextRoute Component');
    this.routeService.getNextRoute();
  }

  onGetNextRoute(): void {
    const ob = this.routeService.onGetNextRoute().subscribe(
      (response: any) => {
        const data = response.data;

        this.route = {
          id: data.id,
          date: data.date,
          name: data.name,
          startPoint: data.start_point,
          description: data.description,
          distanceKm: Number(data.distance_km),
          distanceM: data.distance_m,
          elevationGain: data.elevation_gain,
          maxHeight: data.max_height,
          minHeight: data.min_height,
          estimatedDurationHours: data.estimated_duration_hours,
          estimatedDurationMinutes: data.estimated_duration_minutes,
          type: data.type,
          difficulty: data.difficulty,
          signUpLink: data.sign_up_link,
          wikilocLink: data.wikiloc_link,
          wikilocMapLink: data.wikiloc_map_link
        };

        console.log('onGetNextRoute', this.route);
      }
    );
    this.observables.push(ob);
  }

  public formatDescription(desc: string): string {
    if (!desc) return '';
    // Reemplaza la secuencia literal '\n' por saltos de línea reales
    const withRealNewlines = desc.replace(/\\n/g, '\n');
    // Ahora reemplaza los saltos de línea reales por <br>
    return withRealNewlines.replace(/\n/g, '<br>');
  }
}
