import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// Servicios
import { AuthService } from '../../../services/websockets/auth.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EmailService } from '../../../services/websockets/email.service';
import { MyPermissionShareService } from '../../../services/share/my-permission.service';
import { RoleService } from '../../../services/websockets/role.service';
import { TitleShareService } from '../../../services/share/title.service';
import { UserService } from '../../../services/websockets/user.service';
import { WRPermissionShareService } from '../../../services/share/wr-permission';
import { WebsocketService } from 'src/app/services/websocket.service';

// Modelos
import { RoleModel } from '../../../models/role.model';
import { UserModel } from '../../../models/user.model';
import { RoleHasPermission } from '../../../models/roleHasPermission.model';

import { GLOBAL } from '../../../services/global';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit, OnDestroy {
  private title: string;
  private wrPermission: string;
  
  public roles: RoleModel[];
  public users: UserModel[];
  public user: UserModel;

  public userDialog: boolean;

  public permissionViewId: number;
  public permissionWriting: boolean;
  public permission: RoleHasPermission;
  public loadingPermission: boolean;

  public scrollHeight: string;
  public innerHeight: number;

  private observables = new Array();

  constructor(
    private authService: AuthService,
    private confirmationService: ConfirmationService,
    private emailService: EmailService,
    private myPermissionShareService: MyPermissionShareService,
    private roleService: RoleService,
    private titleShareService: TitleShareService,
    private userService: UserService,
    private router: Router,
    private messageService: MessageService,
    private wrPermissionShareService: WRPermissionShareService,
    private websocketService: WebsocketService
  ) {
    this.title = 'Gestión de usuarios';
    this.wrPermission = '';

    this.users = [];
    this.roles = [];

    this.initUser();

    this.userDialog = false;
    this.permissionViewId = GLOBAL.permission_users_manager;
    this.permissionWriting = false;
    this.permission = null;
    this.loadingPermission = false;

    this.onResize();
  }

  ngOnInit(): void {
    this.changeTitle();

    if (this.websocketService.sessionOn) {
      this._changeMyPermissions();
    }

    this._getUsers();
    this._getRoles();
    this.getRoles();

    this._addUser();
    this._editUser();
    this._delUser();    
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

  changeWRPermission(): void {
    this.wrPermissionShareService.changeWRPermission(this.wrPermission);
  }

  getRoles(): void {
    this.roleService.getRoles();
  }

  getUsers(): void {
    this.userService.getUsers();
  }

  editUser(user: UserModel) {
    this.user = user;
    this.user.confirmPass = '';

    this.userDialog = true;
  }

  addUser() {
    this.initUser();

    this.userDialog = true;
  }

  changeVisibleVersion(valor: boolean) {
    this.userDialog = valor;    
  }

  cancel(event: boolean) {
    this.changeVisibleVersion(event);
  }

  confirm(user: any) {
    this.confirmationService.confirm({
        target: event.target,
        message: '¿Está seguro de proceder con la eliminación del usuario?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: "Si",
        accept: () => {
          this.userService.delUser(user); 
        },
        reject: () => {
          return false;
        }
    });
    
    setTimeout( () => {
      const btns = document.getElementsByClassName('p-confirm-popup-reject');

      Array.prototype.forEach.call(btns, (btn) => {
        btn.focus();
      });
    });
  }  

  initUser() {
    this.user = {
      id: null,
      name: '',
      lastname: '',
      email: '',
      username: '',
      password: '',
      member_num: 0,      
      active: true,
      attempts: 0,
      createdAt: null,
      updatedAt: null,
      role_id: 1,
      role: null,
      confirmPass: ''
    };
  }

  /**
   * Cambiar valor aria-checked para pruebas automáticas de PAN
   */
  changeValueAriaChecked() {
    setTimeout(() => {

      let usersCheck = document.getElementsByClassName('p-checkbox-box');

      Array.prototype.forEach.call(usersCheck, (userCheck) => {
        if (userCheck.getAttribute('aria-checked') == 1 || userCheck.getAttribute('aria-checked') === 'true') {
          userCheck.setAttribute('aria-checked', 'true');
        } else {
          userCheck.setAttribute('aria-checked', 'false');
        }
      });
    });
}  

  /**
   * Observables
   */
  _getRoles(): any {
    const ob = this.roleService._getRoles().subscribe(async (response: any) => {
      const data = await response.data;

      this.roles = data;

      this.getUsers();
    });
    this.observables.push(ob);
  }

  _getUsers(): any {
    const ob = this.userService._getUsers().subscribe(async (response: any) => {
      const data = await response.data;

      this.users = data;

      for(const user of this.users) {
        const roleFind = this.roles.find(r => r.id === user.role_id);
        user.role = roleFind;
      }

      this.changeValueAriaChecked();

      this.authService.renewToken();
    });
    this.observables.push(ob);
  }

  _addUser(): any {
    const ob = this.userService._addUser().subscribe((response: any) => {
      const user = response.data;

      const roleFind = this.roles.find(r => r.id === user.role_id);
      user.role = roleFind;
      user.confirmPass = '';
      
      this.users.push(user);  
      this.users = [...this.users];

      this.changeValueAriaChecked();
    });
    this.observables.push(ob);
  }

  _editUser(): any {
    const ob = this.userService._editUser().subscribe((response: any) => {
      const user = response.data;

      const idx = this.users.findIndex(u => u.id === user.id);
      
      if (idx >= 0) {
        const roleFind = this.roles.find(r => r.id === user.role_id);
        user.role = roleFind;
        user.confirmPass = '';

        this.users[idx] = user;

        this.users = [...this.users];

        this.changeValueAriaChecked();
      }      
    });
    this.observables.push(ob);
  }
  _delUser(): any {
    const ob = this.userService._delUser().subscribe((response: any) => {
      const data = response.data;

      this.users = this.users.filter(u => u.id !== data.user.id);
      this.users = [...this.users];

      if (response.message) {
        this.messageService.add({ severity: 'success', summary: 'Eliminación', detail: response.message, life: 2000 });

        this.emailService.sendEmailUserDelete(data.user);
      }      
    });
    this.observables.push(ob);
  }

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

  onResize() {
    this.scrollHeight = '73vh';
    
    this.innerHeight = window.innerHeight;

    if (this.innerHeight < 768) { this.scrollHeight = '60vh'; }
  }
  
}
