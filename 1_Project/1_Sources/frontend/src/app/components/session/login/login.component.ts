import { Component, OnDestroy, OnInit } from '@angular/core';

import { Router } from '@angular/router';

// Importar constantes globales
import { GLOBAL } from '../../../services/global';

// Form
import { FormGroup, FormControl, Validators } from '@angular/forms';

// Servicios
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services/websockets/auth.service';
import { TitleShareService } from '../../../services/share/title.service';
import { ValidateService } from '../../../services/help/validate.service';
import { WebsocketService } from '../../../services/websocket.service';
import { WRPermissionShareService } from '../../../services/share/wr-permission';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  public login: Login;
  public forma: FormGroup;

  private title: string;
  private wrPermission: string;
  public project: string;
  public version: string;

  private observables = new Array();

  constructor(
    private messageService: MessageService,
    private titleShareService: TitleShareService,
    private authService: AuthService,
    private validateService: ValidateService,
    private router: Router,
    private websocketService: WebsocketService,
    private wrPermissionShareService: WRPermissionShareService
  ) {
    this.project = GLOBAL.project;
    this.version = GLOBAL.version;

    this.login = {
      userName: '',
      password: ''
    };

    // FormControl parametros: valor por defecto / regla validación[] / regla validación asincrona[]
    this.forma = new FormGroup({
      userName: new FormControl('', [Validators.required, this.validateService.textMax100]),
      password: new FormControl('')
    });

    this.title = 'Iniciar sesión';
    this.wrPermission = 'U';
   }

  ngOnInit(): void {
    this.forma.setValue(this.login);

    this.validateLogin();

    this.changeTitle();
    this.changeWRPermission();

    this._postLogin();
    this._recoveryPassword();
  }
  ngOnDestroy(): void {
    for (const ob of this.observables) {
      if (ob !== undefined && ob !== null) {
        ob.unsubscribe();
      }
    }
  }

  changeTitle(): void {
    this.titleShareService.changeTitle(this.title);
  }

  changeWRPermission(): void {
    this.wrPermissionShareService.changeWRPermission(this.wrPermission);
  }  

  postLogin(): void {
    this.login = this.forma.value;

    this.authService.login(this.login);
  }

  /**
   * Solicitud de recuperación de la contraseña
   */
  recoveryPassword() {
    this.login = this.forma.value;

    if (!this.login.userName) {
      this.messageService.add({severity: 'error', summary: 'Regenerar contraseña', detail: 'El usuario no puede estar vacío', life: 5000});
      return false;
    }

    this.authService.recoveryPassword(this.login);
  }

  /**
   * Validar si tiene sesión iniciada
   */
  validateLogin() {
    if (this.websocketService.sessionOn) {
      this.router.navigate(['/redirect']);
    }
  }

  /**
   * Observables
   */
  _postLogin(): any {
    const ob = this.authService._login().subscribe((response: any) => {
      const data = response.data;
      const detail = response.message;

      // #29904. Nota 0080279
      // this.messageService.add({severity: 'success', summary: 'Sesión', detail, life: 2000});

      localStorage.setItem('id', data.user.id);
      localStorage.setItem('token', data.token);

      this.websocketService.setToken(data.token);
      this.websocketService.setUserId(data.user.id);
      this.websocketService.setSessionOn(true);

      this.router.navigate(['/my-profile']);
    });

    this.observables.push(ob);
  }

  _recoveryPassword(): any {
    const ob = this.authService._recoveryPassword().subscribe((response: any) => {
      if (response.message) {
        this.messageService.add({ severity: 'success', summary: 'Regenerar contraseña', detail: response.message, life: 2000 });     
      }
    });
    this.observables.push(ob);
  }

}

interface Login {
  userName: string;
  password: string;
}
