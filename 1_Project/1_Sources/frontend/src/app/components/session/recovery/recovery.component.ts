import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

// Importar constantes globales
import { GLOBAL } from '../../../services/global';

// Servicios
import { AuthService } from '../../../services/websockets/auth.service';
import { TitleShareService } from '../../../services/share/title.service';
import { WebsocketService } from '../../../services/websocket.service';
import { WRPermissionShareService } from '../../../services/share/wr-permission';

// Modelos
import { UserModel } from '../../../models/user.model';

// API
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-recovery',
  templateUrl: './recovery.component.html',
  styleUrls: ['./recovery.component.css']
})
export class RecoveryComponent implements OnInit {
  public token: string;
  public user: UserModel;

  private title: string;
  private wrPermission: string;
  public project: string;
  public version: string;

  private observables = new Array();

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private titleShareService: TitleShareService,
    private websocketService: WebsocketService,
    private route: ActivatedRoute,
    private router: Router,
    private wrPermissionShareService: WRPermissionShareService
  ) {
    this.user = null;
    this.wrPermission = 'U';

    this.project = GLOBAL.project;
    this.version = GLOBAL.version;
  }

  ngOnInit(): void {       
    this.title = 'Regenerar contraseña';

    // Recoger token de la url
    this.route.params.forEach((params: Params) => {
      this.token = params['token'];    
    });

    if (this.websocketService && this.websocketService.token) {
      this.messageService.add({ severity: 'error', summary: 'Sesión', detail: 'Existe un inicio de sesión en curso', life: 5000 });
      this.router.navigate(['/my-profile']);
    } else {
      this.validateToken();    
    }

    this._validateToken();   
    
    this.changeTitle();
    this.changeWRPermission();
  }

  ngOnDestroy() {
    for (const ob of this.observables) {
      if (ob !== undefined && ob !== null) {
        ob.unsubscribe();
      }
    }
  }

  /**
   * Solicitud para validar el token
   */  
  validateToken() {
    const data = {
      tokenRecovery: this.token
    }

    this.authService.validateTokenRecovery(data);
  }

  changeTitle(): void {
    this.titleShareService.changeTitle(this.title);
  }

  changeWRPermission(): void {
    this.wrPermissionShareService.changeWRPermission(this.wrPermission);
  }  

  /**
   * Cancelar para regresar al inicio de sesión
   */
  cancel(event) {

  }

  /**
   * Observables
   */
  _validateToken() {
    const ob = this.authService._validateTokenRecovery().subscribe((response: any)=> {
      const data = response.data;      

      this.user = data.user;
      this.user.confirmPass = '';
      this.user.role = null;

      this.websocketService.setToken(this.token);
    });

    this.observables.push(ob);
  }

}
