import { Injectable } from '@angular/core';
import { WebsocketService } from '../websocket.service';
import { Observable } from 'rxjs';

import { PermissionModel } from '../../models/permission.model';
import { RoleHasPermission } from '../../models/roleHasPermission.model';

@Injectable()
export class PermissionService {
    constructor(private wsService: WebsocketService) {
    }

    getPermissions(): void {      
      this.wsService.emit('permission/getPermissions', {});
    }
    _getPermissions(): Observable<PermissionModel[]> {
        return this.wsService.listen('permission/getPermissions');
    }

    getPermissionsHasRoles(): void {      
      this.wsService.emit('permission/getPermissionsHasRoles', {});
    }
    _getPermissionsHasRoles(): Observable<PermissionModel[]> {
        return this.wsService.listen('permission/getPermissionsHasRoles');
    }

    getMyPermissionsHasRoles(): void {      
      this.wsService.emit('permission/getMyPermissionsHasRoles', {});
    }
    _getMyPermissionsHasRoles(): Observable<PermissionModel[]> {
        return this.wsService.listen('permission/getMyPermissionsHasRoles');
    }
    
    addPermission(RoleHasPermission: RoleHasPermission): void {      
      this.wsService.emit('permission/addPermission', { RoleHasPermission } );
    }
    _addPermission(): Observable<any> {
      return this.wsService.listen('permission/addPermission');
    }

    delPermission(permissions_id: number, roles_id: number): void {      
      this.wsService.emit('permission/delPermission', { permissions_id, roles_id });
    }
    _delPermission(): Observable<any> {
      return this.wsService.listen('permission/delPermission');
    }
}
