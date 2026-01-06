import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

// Servicios
import { AuthService } from '../../../services/websockets/auth.service';
import { RoleManagerShareService } from '../../../services/share/role-mananager-share.service';
import { MessageService } from 'primeng/api';
import { MyPermissionShareService } from '../../../services/share/my-permission.service';
import { PermissionService } from '../../../services/websockets/permission.service';
import { RoleService } from '../../../services/websockets/role.service';
import { TitleShareService } from '../../../services/share/title.service';
import { WRPermissionShareService } from '../../../services/share/wr-permission';
import { WebsocketService } from 'src/app/services/websocket.service';

// Modelos
import { PermissionModel } from '../../../models/permission.model';
import { RoleModel } from '../../../models/role.model';
import { RoleHasPermission } from '../../../models/roleHasPermission.model';

import { GLOBAL } from '../../../services/global';

@Component({
  selector: 'app-permissions-list',
  templateUrl: './permissions-list.component.html',
  styleUrls: ['./permissions-list.component.css']
})
export class PermissionsListComponent implements OnInit, OnDestroy {
  private title: string;
  private wrPermission: string;

  public permissions: PermissionModel[];
  public roles: RoleModel[];
  public permissionsHasRoles: RoleHasPermission[];

  public printTable: boolean;
  public roleDialog: boolean;
  public boolGetRoles: boolean;

  public adminRoleId: number;
  public permissionViewId: number;
  public permissionWriting: boolean;
  public permission: RoleHasPermission;
  public loadingPermission: boolean;

  private observables = new Array();

  constructor(
    private authService: AuthService,
    private roleManagerShareService: RoleManagerShareService,
    private router: Router,
    private messageService: MessageService,
    private myPermissionShareService: MyPermissionShareService,
    private permissionService: PermissionService,
    private roleService: RoleService,
    private titleShareService: TitleShareService,
    private wrPermissionShareService: WRPermissionShareService,
    private websocketService: WebsocketService
  ) {
    this.title = 'Gestión de permisos';
    this.wrPermission = '';

    this.adminRoleId = GLOBAL.adminRoleId;
    this.permissionViewId = GLOBAL.permission_permissions_manager;
    this.permissionWriting = false;
    this.permission = null;

    this.permissions = [];
    this.roles = [];
    this.permissionsHasRoles = [];
    this.loadingPermission = false;

    this.printTable = false;
    this.roleDialog = false;
    this.boolGetRoles = true;
  }

  ngOnInit(): void {
    this.changeTitle();
    
    this._getPermissions();
    this._getRoles();
    this._getPermissionsHasRoles();

    if (this.websocketService.sessionOn) {
      this._changeMyPermissions();
      this.getPermissions();
      this.getRoles();
    }    

    this._addPermission();
    this._delPermission();

    this._addRole();
    this._editRole();
    this._delRole();
  }

  ngOnDestroy() {
    for (const ob of this.observables) {
      if (ob !== undefined && ob !== null) {
        ob.unsubscribe();
      }
    }
  }

  /**
   * Asignar el título de la vista
   */
  changeTitle(): void {
    this.titleShareService.changeTitle(this.title);
  }

  changeWRPermission(): void {
    this.wrPermissionShareService.changeWRPermission(this.wrPermission);
  }

  /**
   * Consultar los permisos existentes
   */
  getPermissions() {
    this.permissionService.getPermissions();
  }

  /**
   * Consultar los roles existentes
   */
  getRoles() {
    this.roleService.getRoles();
  }

  getPermissionsHasRoles() {
    this.permissionService.getPermissionsHasRoles();
  }

  /**
   * Asignar valor a todos los posibles permisos por rol
   */
  setPermissions() {
    for (let permission of this.permissions) {
      for (let role of permission.roles) {
        for (let RoleHasPermission of this.permissionsHasRoles) {
          if (permission.id === RoleHasPermission.permissions_id && role.id === RoleHasPermission.roles_id) {
            role.reading = RoleHasPermission.reading;
            role.writing = RoleHasPermission.writing;
          }
        }
      }
    }

    this.permissions = [...this.permissions];
    this.printTable = true;
  }

  /**
   * Tratar la eliminación de un rol
   */
  delPermissions(rolId: number) {
    for (let permission of this.permissions) {
      permission.roles = permission.roles.filter(r => r.id !== rolId);
    }

    this.permissions = [...this.permissions];
    this.printTable = true;
  }

  /**
   * Acción al chequear el usuario el permiso
   */
  checkPermission(permissionId: number, roleId: number, reading: boolean, writing: boolean) {
    if (!reading && !writing) {
      this.removePermission(permissionId, roleId)
      return false;
    }

    this.addPermission(permissionId, roleId, reading, writing);
  }

  /**
   * Añadir permiso al rol
   */
  addPermission(permissions_id: number, roles_id: number, reading: boolean, writing: boolean) {
    // Si el permiso es de escritura implica permiso de lectura también
    if (writing && !reading) {
      const permission = this.permissions.find(p => p.id === permissions_id);
      const role = permission.roles.find(r => r.id === roles_id);

      role.reading = true;
      role.writing = true;
      reading = true;
    }

    const RoleHasPermission: RoleHasPermission = {
      permissions_id,
      roles_id,
      reading,
      writing
    };

    this.permissionService.addPermission(RoleHasPermission);
  }

  /**
   * Eliminar permiso al rol
   */
  removePermission(permissions_id: number, roles_id: number) {
    this.permissionService.delPermission(permissions_id, roles_id);
  }

  roleManager() {
    this.roleDialog = true;
  }

  actionHideDialog() {    
    this.roleManagerShareService.changeHideModalRoleManager(true);
  }

  /**
   * Cambiar valor aria-checked para pruebas automáticas de PAN
   */
  changeValueAriaChecked() {
    setTimeout(() => {

      let permChecks = document.getElementsByClassName('perm-checkbox');

      Array.prototype.forEach.call(permChecks, (permCheck) => {
        permCheck.setAttribute('aria-checked', permCheck.checked);
      });
    });
  }  

  /**
   * Observables
   */
  _changeMyPermissions(): void {
    const ob = this.myPermissionShareService.currentMyPermissions.subscribe((myPermissions: RoleHasPermission[]) => {
      this.permission = myPermissions.find(mp => mp.permissions_id === this.permissionViewId);

      this.permissionWriting = false;

      // Se da un tiempo de 2s por si se producen cambios rápidos antes de echar al usuario,
      // además el permiso al inicio de la vista llega 'undefined' y echa al usuario, aunque al regresar datos del backend tenga realmente permisos
      if (!this.loadingPermission) {
        this.loadingPermission = true;
        setTimeout(() => {
          if (!this.permission) {
            this.messageService.add({ severity: 'warn', summary: 'Permiso', detail: 'El usuario no tiene permisos para acceder a "' + this.title + '"', life: 4000 });
            this.router.navigate(['/my-profile']);
            return false;
          }

          this.loadingPermission = false;
        }, 2000);
      }

      if (this.permission) {
        if (this.permission.writing) { 
          this.permissionWriting = true; 
          this.wrPermission = 'W';
          this.changeWRPermission();
        } else {
          if (this.permission.reading) {
            this.wrPermission = 'R';
            this.changeWRPermission();
          }
        }
      }
    });

    this.observables.push(ob);
  }

  _getPermissions() {
    const ob = this.permissionService._getPermissions().subscribe((response: any) => {
      this.permissions = response.data;

      if (this.roles.length > 0) {
        this.getPermissionsHasRoles();
      }
      this.authService.renewToken();
    });

    this.observables.push(ob);
  }

  _getRoles() {
    const ob = this.roleService._getRoles().subscribe((response: any) => {
      if (this.boolGetRoles) {
        this.roles = response.data;

        if (this.permissions.length > 0) {
          this.getPermissionsHasRoles();
        }
      }

      // Una vez leidos al iniciar la vista, dejar de observar para no entrar en conflicto con la gestión de roles
      this.boolGetRoles = false;
    });

    this.observables.push(ob);
  }

  _getPermissionsHasRoles() {
    const ob = this.permissionService._getPermissionsHasRoles().subscribe((response: any) => {
      this.permissionsHasRoles = response.data;

      this.setPermissions();

      this.changeValueAriaChecked();
    });

    this.observables.push(ob);
  }

  _addPermission() {
    const ob = this.permissionService._addPermission().subscribe((response: any) => {
      // #29904. Nota 0080279
      // if (response.message) {
      //   this.messageService.add({ severity: 'success', summary: 'Edición', detail: response.message, life: 1000 });
      // }

      const data: RoleHasPermission = response.data;
      const permission = this.permissions.find(p => p.id === data.permissions_id);
      const role = permission.roles.find(r => r.id === data.roles_id);

      role.reading = data.reading;
      role.writing = data.writing;

      this.changeValueAriaChecked();
    });

    this.observables.push(ob);
  }

  _delPermission() {
    const ob = this.permissionService._delPermission().subscribe((response: any) => {
      // #29904. Nota 0080279
      // if (response.message) {
      //   this.messageService.add({ severity: 'success', summary: 'Eliminación', detail: response.message, life: 1000 });
      // }

      const data: RoleHasPermission = response.data;
      const permission = this.permissions.find(p => p.id === data.permissions_id);
      const role = permission.roles.find(r => r.id === data.roles_id);

      role.reading = false;
      role.writing = false;

      this.changeValueAriaChecked();
    });

    this.observables.push(ob);
  }

  _addRole(): any {
    const ob = this.roleService._addRole().subscribe((response: any) => {
      this.boolGetRoles = true;
      this.permissions = [];
      this.roles = [];
      this.permissionsHasRoles = [];

      this.getRoles();
      this.getPermissions();

      // Mejor solución pero muestra error al mostrar los datos Angular
      // this.printTable = false;
      // this.roles.push(response.data);
      // this.roles = [...this.roles];
      // this.setPermissions();

      this.changeValueAriaChecked();
    });
    this.observables.push(ob);
  }

  _editRole(): any {
    const ob = this.roleService._editRole().subscribe((response: any) => {
      const idx = this.roles.findIndex(r => r.id === response.data.id);

      if (idx >= 0) this.roles[idx].name = response.data.name;
    });
    this.observables.push(ob);
  }

  _delRole(): any {
    const ob = this.roleService._delRole().subscribe((response: any) => {
      this.roles = this.roles.filter(r => r.id !== response.data.roleId);
      this.roles = [...this.roles];

      this.delPermissions(response.data.roleId);
    });
    this.observables.push(ob);
  }

}
