import { Component, OnInit } from '@angular/core';

import { TitleShareService } from '../../../services/share/title.service';
import { RouteService } from '../../../services/websockets/route.service';

@Component({
  selector: 'app-routes-list',
  templateUrl: './routes-list.component.html',
  styleUrls: ['./routes-list.component.css']
})
export class RoutesListComponent implements OnInit {

  public routes: any[];

  private title: string;

  constructor(
        private titleShareService: TitleShareService,
        private routeService: RouteService
  ) {
    // Título de la página
    this.title = 'Listado de rutas';

    this.routes = [
      {
        date: '10 de Enero',
        name: 'Navahermosa - Galinda-Nacientes-Comida "La Alameda" ',
      },
      {
        date: '24 de enero',
        name: 'Los Yébenes - Pico Vedado - Ermita y Molinos - Arte rupestre'
      },
      {
        date: '7 de Febrero',
        name: 'Malagón - Crestas de Malagón y las Navas'
      },
      {
        date: '21 de Febrero',
        name: 'LOS NAVALUCILLOS - Sierra de la Botija - Las Becerras'
      },
      {
        date: '07 de Marzo',
        name: 'VALERIA - Ciudad Romana - Hoz río Gritos'
      },
      {
        date: '21 de Marzo',
        name: 'Colmenar Viejo - Puentes medievales, molinos y batanes - Garganta río Manzanares'
      }
    ]

    this.getRoutes();
    this._getRoutes();
  }

  ngOnInit(): void {
    this.changeTitle();
  }

  changeTitle(): void {
    this.titleShareService.changeTitle(this.title);
  }

  getRoutes(): void {
    this.routeService.getRoutes();
  }

  _getRoutes(): void {
    this.routeService.onGetRoutes().subscribe(
      (routes: any[]) => {
        this.routes = routes;

        console.log('Routes received:', this.routes);
      }
    );
  }

}
