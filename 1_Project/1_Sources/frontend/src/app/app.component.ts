import { Component, OnDestroy, OnInit } from '@angular/core';

import { Router, ActivationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';

// Servicios
import { AuthService } from './services/websockets/auth.service';
import { MyPermissionShareService } from './services/share/my-permission.service';
import { PermissionService } from './services/websockets/permission.service'
import { TitleShareService } from './services/share/title.service';
import { WRPermissionShareService } from './services/share/wr-permission';
import { UserService } from './services/websockets/user.service';
import { WebsocketService } from './services/websocket.service';

import { MenuItem } from 'primeng/api';

// Modelos
import { RoleHasPermission } from './models/roleHasPermission.model';

// Importar constantes globales
import { GLOBAL } from './services/global';

// API
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  public title: string;
  public wrPermission: string;
  public items: MenuItem[];
  public loginOn: boolean;

  public project: string;
  public version: string;

  private permissionsHasRoles: RoleHasPermission[];
  private userId: number;
  private roleId: number;
  private permission_users_manager: number;
  private permission_permissions_manager: number;
  private permission_files_manager: number;

  private observables = new Array();

  constructor(
    private router: Router,
    private titleBrowser: Title,
    private authService: AuthService,
    private titleShareService: TitleShareService,
    private wrPermissionShareService: WRPermissionShareService,
    private messageService: MessageService,
    private permissionService: PermissionService,
    private userService: UserService,
    private myPermissionShareService: MyPermissionShareService,
    public websocketService: WebsocketService
  ) {
    this.title = null;
    this.wrPermission = 'U';
    this.project = GLOBAL.project;
    this.version = GLOBAL.version;
    this.loginOn = false;

    this.permissionsHasRoles = [];
    this.userId = null;
    this.roleId = null;
    this.permission_users_manager = GLOBAL.permission_users_manager;
    this.permission_permissions_manager = GLOBAL.permission_permissions_manager;
    this.permission_files_manager = GLOBAL.permission_files_manager;
  }

  ngOnInit(): void {
    if (this.websocketService.token) this.loginOn = true;

    this.items = [
      {
        label: 'Acceso',
        icon: 'pi pi-fw pi-user',
        items: [
          {
            label: 'Mi perfil',
            icon: 'pi pi-fw pi-user',
            routerLink: ['/my-profile']
          },
          {
            label: 'Permisos',
            icon: 'pi pi-fw pi-ban',
            routerLink: ['/permissions']
          },
          {
            label: 'Usuarios',
            icon: 'pi pi-fw pi-users',
            routerLink: ['/users']
          },
          {
            separator: true,
          }
        ],
      },
      {
        label: 'Gestión rutas',
        items: [
          {
            label: 'Próxima ruta',
            icon: 'pi pi-fw pi-key',
            routerLink: ['/route-detail']
          },
          {
            label: 'Todas las Rutas',
            icon: 'pi pi-fw pi-sitemap',
            routerLink: ['/routes-list']
          },
          {
            label: 'Inscripción',
            icon: 'pi pi-fw pi-file',
            command: () => {
              const base = document.getElementsByTagName('base')[0]?.getAttribute('href') || '/';
              window.open(base + 'assets/inscripcion.html', '_blank', 'noopener,noreferrer');
            }
          },
          {
            separator: true,
          }
        ],
      },
      {
        label: 'Archivos',
        icon: 'pi pi-fw pi-file',
        items: [
          {
            label: 'Subir archivos',
            icon: 'pi pi-fw pi-cog',
            routerLink: ['/files']
          },
          {
            separator: true,
          }
        ],
      },
      {
        label: 'Sesión',
        icon: 'pi pi-fw pi-power-off',
        items: [
          {
            label: 'Iniciar',
            icon: 'pi pi-fw pi-power-off',
            routerLink: ['/login'],
            visible: !this.loginOn
          },
          {
            label: 'Cerrar',
            icon: 'pi pi-fw pi-power-off',
            visible: this.loginOn,
            command: (): void => {
              this.logout();
            }
          }
        ],
      }
    ];

    this.menuSession();

    this._changeTitle();
    this._changeWRPermission();
    this._login();
    this._logout();
    this._renewToken();
    this._disabledUser();
    this._endSessionChangePasswordUser();
    this._notAllowed();

    this._getTitleBrowser();
    this.getDataRoute();

    this._getMyPermissionsHasRoles();

    if (this.websocketService.sessionOn) {
      this.getMyPermissionsHasRoles();
    }

    this._editUser();
    this._addPermission();
    this._delPermission();
  }

  ngOnDestroy(): void {
    for (const ob of this.observables) {
      if (ob !== undefined && ob !== null) {
        ob.unsubscribe();
      }
    }
  }

  logout() {
    this.authService.logout();
  }

  /**
   * Recoger información ofrecida desde el archivo routing en parámetro data
   */
  getDataRoute() {
    return this.router.events.pipe(
      filter(evento => evento instanceof ActivationEnd),
      filter((evento: ActivationEnd) => evento.snapshot.firstChild === null),
      map((evento: ActivationEnd) => evento.snapshot.data)
    );
  }

  /**
   * Acciones posteriores a la finalización de la sesión
   */
  logoutPostActions() {
    localStorage.removeItem('token');
    localStorage.removeItem('id');

    this.websocketService.setToken('');
    this.websocketService.setSessionOn(false);
    this.websocketService.setUserId(null);

    this.menuSession();

    this.router.navigate(['/login']);
    this.loginOn = false;
  }

  /**
   * Acciones después de cargar Angular
   */
  ngAfterViewInit() {
    const domBtnText = document.getElementsByClassName('p-button-label');
    if (domBtnText) {
      domBtnText[0].innerHTML = this.project;
    }
  }

  /**
   * Plantilla para mostrar u ocultar elemento del menú
   * eItemTop: Elemento superior
   * eItemBottom: Elemento de segundo nivel
   * result: (true) mostrar / (false) ocultar
   */
  menuItemVisible(eItemTop = null, eItemBottom = null, result: boolean) {
    // Actualizar el menú
    const itemTop = this.items.find(i => i.label === eItemTop);

    if (eItemBottom) {
      const itemBottom = itemTop.items.find(i => i.label === eItemBottom);
      itemBottom.visible = result;
    } else {
      itemTop.visible = result;
    }

    this.items = [...this.items];
  }

  menuSession() {
    if (this.websocketService.sessionOn) {
      this.menuItemVisible('Sesión', 'Iniciar', false);
      this.menuItemVisible('Sesión', 'Cerrar', true);
      this.menuItemVisible('Acceso', null, true);
      this.menuItemVisible('Gestión rutas', null, true);
      this.menuItemVisible('Archivos', null, true);

      return false;
    }

    this.menuItemVisible('Sesión', 'Iniciar', true);
    this.menuItemVisible('Sesión', 'Cerrar', false);
    this.menuItemVisible('Acceso', null, false);
    this.menuItemVisible('Gestión rutas', null, true);
    this.menuItemVisible('Archivos', null, false);
  }

  /**
   * Plantilla para validar elemento del menu para ser visualizado en función del permiso del usuario por su rol
   */
  menuItem(eItemTop = null, eItemBottom = null, permissionId) {
    const idx = this.permissionsHasRoles.findIndex(phr => phr.permissions_id === permissionId);

    if (idx >= 0) {
      this.menuItemVisible(eItemTop, eItemBottom, true);
      return true;
    }

    this.menuItemVisible(eItemTop, eItemBottom, false);
    return false;
  }

  inspectMenu() {
    this.menuSession();
    this.menuItem('Acceso', 'Usuarios', this.permission_users_manager);
    this.menuItem('Acceso', 'Permisos', this.permission_permissions_manager);

    const filesBool: boolean = this.menuItem('Archivos', 'Subir archivos', this.permission_files_manager);

    if (!filesBool) {
      this.menuItemVisible('Archivos', null, false);
    }
  }

  /**
   * Solicitar los permisos del usuario conectado
   */
  getMyPermissionsHasRoles() {
    this.permissionService.getMyPermissionsHasRoles();
  }

  /**
   * Observables
   */
  _getMyPermissionsHasRoles() {
    const ob = this.permissionService._getMyPermissionsHasRoles().subscribe((response: any) => {
      this.permissionsHasRoles = response.data;
      this.userId = response.user.userId;
      this.roleId = response.user.roleId;

      this.inspectMenu();

      this.myPermissionShareService.changeMyPermissions(this.permissionsHasRoles);
    });

    this.observables.push(ob);
  }

  _addPermission() {
    const ob = this.permissionService._addPermission().subscribe((response: any) => {
      const data: RoleHasPermission = response.data;

      if (data.roles_id === this.roleId) {
        this.permissionsHasRoles = this.permissionsHasRoles.filter(phr => phr.permissions_id !== data.permissions_id);
        this.permissionsHasRoles.push(data);
        this.inspectMenu();

        this.myPermissionShareService.changeMyPermissions(this.permissionsHasRoles);
      }
    });

    this.observables.push(ob);
  }

  _delPermission() {
    const ob = this.permissionService._delPermission().subscribe((response: any) => {
      const data: RoleHasPermission = response.data;

      if (data.roles_id === this.roleId) {
        this.permissionsHasRoles = this.permissionsHasRoles.filter(phr => phr.permissions_id !== data.permissions_id);
        this.permissionsHasRoles = [...this.permissionsHasRoles];
        this.inspectMenu();

        this.myPermissionShareService.changeMyPermissions(this.permissionsHasRoles);
      }
    });

    this.observables.push(ob);
  }


  // Si el usuario ha cambiado de rol
  _editUser(): any {
    const ob = this.userService._editUser().subscribe((response: any) => {
      const data = response.data;

      if (data.id === this.userId) {
        this.authService.renewToken();
      }

    });
    this.observables.push(ob);
  }

  /**
   * Observables
   */
  _getTitleBrowser() {
    const ob = this.getDataRoute().subscribe(data => {
      if (data && !data.titulo) {
        this.titleBrowser.setTitle('');
        return false;
      }

      this.titleBrowser.setTitle(data.titulo);
    });
    this.observables.push(ob);
  }
  _changeTitle(): void {
    const ob = this.titleShareService.currentTitle.subscribe((title) => {
      if (title) {
        // Se ofrece un timeout para encolar petición y que a Angular le dé tiempo a cargar elementos en el componente
        setTimeout(() => { this.title = title; });
      }
    });

    this.observables.push(ob);
  }

  _changeWRPermission(): void {
    const ob = this.wrPermissionShareService.currentWRPermission.subscribe((wrPermission) => {
      if (wrPermission) {
        // Se ofrece un timeout para encolar petición y que a Angular le dé tiempo a cargar elementos en el componente
        setTimeout(() => { this.wrPermission = wrPermission; });
      }
    });

    this.observables.push(ob);
  }
  _login(): any {
    const ob = this.authService._login().subscribe((response: any) => {
      const data = response.data;

      this.loginOn = true;
      this.websocketService.setToken(data.token);
      this.websocketService.setSessionOn(true);

      this.getMyPermissionsHasRoles();
    });

    this.observables.push(ob);
  }
  _logout(): any {
    const ob = this.authService._logout().subscribe((response: any) => {
      this.permissionsHasRoles = [];
      this.userId = null;
      this.roleId = null;

      this.logoutPostActions();
    });

    this.observables.push(ob);
  }
  _notAllowed(): any {
    const ob = this.authService._notAllowed().subscribe((response: any) => {
      const mode = response.mode;

      if (mode === 'reading') this.router.navigate(['/my-profile']);
    });

    this.observables.push(ob);
  }
  _disabledUser(): any {
    const ob = this.userService._disabledUser().subscribe((response: any) => {
      const data = response.data;

      if (data.id === this.websocketService.userId) {
        this.logout();

        if (response.message) { this.messageService.add({ severity: 'warn', summary: 'Sesión', detail: response.message, life: 4000 }); }
      }
    });

    this.observables.push(ob);
  }
  _endSessionChangePasswordUser(): any {
    const ob = this.userService._endSessionChangePasswordUser().subscribe((response: any) => {
      const data = response.data;

      if (data.id === this.websocketService.userId) {
        this.logout();

        if (response.message) { this.messageService.add({ severity: 'warn', summary: 'Sesión', detail: response.message, life: 4000 }); }
      }
    });

    this.observables.push(ob);
  }
  _renewToken(): any {
    const ob = this.authService._renewToken().subscribe((response: any) => {
      const data = response.data;

      localStorage.setItem('id', data.user.id);
      localStorage.setItem('token', data.token);

      this.websocketService.setToken(data.token);
      this.websocketService.setSessionOn(true);
      this.websocketService.setUserId(data.user.id);

      // Si al renovar el token ha cambiado el rol, se solicitan consulta de permisos al usuario
      if (data.user.id === this.userId && data.user.role_id !== this.roleId) {
        this.getMyPermissionsHasRoles();
      }
    });

    this.observables.push(ob);
  }
}
