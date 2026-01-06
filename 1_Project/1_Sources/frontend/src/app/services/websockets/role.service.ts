import { Injectable } from '@angular/core';
import { WebsocketService } from '../websocket.service';
import { Observable } from 'rxjs';

import { RoleModel } from '../../models/role.model';

@Injectable()
export class RoleService {
    constructor(private wsService: WebsocketService) {
    }

    getRoles(): void {      
      this.wsService.emit('role/getRoles', {});
    }
    _getRoles(): Observable<any> {
        return this.wsService.listen('role/getRoles');
    }

    addRole(role: RoleModel): void {      
      this.wsService.emit('role/addRole', { role });
    }
    _addRole(): Observable<any> {
      return this.wsService.listen('role/addRole');
    }

    editRole(role: RoleModel): void {      
      this.wsService.emit('role/editRole', { role });
    }
    _editRole(): Observable<any> {
      return this.wsService.listen('role/editRole');
    }

    delRole(roleId: number): void {
      this.wsService.emit('role/delRole', { roleId });
    }
    _delRole(): Observable<number> {
      return this.wsService.listen('role/delRole');
    }
}
