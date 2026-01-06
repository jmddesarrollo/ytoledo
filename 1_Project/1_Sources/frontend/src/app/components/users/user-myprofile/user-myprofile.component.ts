import { Component, OnDestroy, OnInit } from '@angular/core';

// Servicios
import { AuthService } from '../../../services/websockets/auth.service';
import { RoleService } from '../../../services/websockets/role.service';
import { TitleShareService } from '../../../services/share/title.service';
import { UserService } from '../../../services/websockets/user.service';
import { WRPermissionShareService } from '../../../services/share/wr-permission';

// Modelos
import { RoleModel } from '../../../models/role.model';
import { UserModel } from '../../../models/user.model';

@Component({
  selector: 'app-user-myprofile',
  templateUrl: './user-myprofile.component.html',
  styleUrls: ['./user-myprofile.component.css']
})
export class UserMyprofileComponent implements OnInit, OnDestroy {
  public user: UserModel;
  public roles: RoleModel[];

  private title: string;
  private wrPermission: string;

  private observables = new Array();

  constructor(
    private authService: AuthService,
    private roleService: RoleService,
    private titleShareService: TitleShareService,
    private userService: UserService,
    private wrPermissionShareService: WRPermissionShareService
  ) { 
    this.title = 'Mi perfil';
    this.wrPermission = 'U';

    this.user = null;
    this.roles = [];
  }

  ngOnInit(): void {    
    this._getMyProfile();    
    this._getRoles();

    this.getMyProfile();
    
    this.changeTitle();
    this.changeWRPermission();

    this._editUser();
  }
  ngOnDestroy() {
    for (const ob of this.observables) {
      if (ob !== undefined && ob !== null) {
        ob.unsubscribe();
      }
    }
  }

  getMyProfile() {
    this.authService.getMyProfile();
  }

  getRoles(): void {
    this.roleService.getRoles();
  }

  changeTitle(): void {
    this.titleShareService.changeTitle(this.title);
  }

  changeWRPermission(): void {
    this.wrPermissionShareService.changeWRPermission(this.wrPermission);
  }

  cancel(event) {
    return false;
  }

  /**
   * Observables
   */
  _getMyProfile() {
    const ob = this.authService._getMyProfile().subscribe((response: any) => {
      if (response.data) {
        this.getRoles();

        this.user = response.data;
        
        this.user.password = '';
        this.user.confirmPass = '';

        this.authService.renewToken();
      }
    });
    this.observables.push(ob);
  }

  _getRoles(): any {
    const ob = this.roleService._getRoles().subscribe(async (response: any) => {
      const data = await response.data;
      this.roles = data;

      const roleFind = this.roles.find(r => r.id === this.user.role_id);      
      this.user.role = roleFind;
    });

    this.observables.push(ob);
  }

  _editUser(): any {
    const ob = this.userService._editUser().subscribe((response: any) => {
      const data = response.data;

      if (data.id === this.user.id) { 
        this.getMyProfile();
      }

    });
    this.observables.push(ob);
  }

}
