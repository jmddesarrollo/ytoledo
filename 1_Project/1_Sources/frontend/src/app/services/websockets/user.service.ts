import { Injectable } from '@angular/core';
import { WebsocketService } from '../websocket.service';
import { Observable } from 'rxjs';

import { UserModel } from '../../models/user.model';

@Injectable()
export class UserService {
    constructor(private wsService: WebsocketService) {
    }

    getUsers(): void {      
      this.wsService.emit('user/getUsers', {});
    }
    _getUsers(): Observable<UserModel[]> {
        return this.wsService.listen('user/getUsers');
    }

    getUser(userId): void {
      this.wsService.emit('user/getUser', { userId });
    }
    _getUser(): Observable<UserModel> {
      return this.wsService.listen('user/getUser');
    }

    addUser(user: UserModel): void {      
      this.wsService.emit('user/addUser', { user });
    }
    _addUser(): Observable<UserModel> {
      return this.wsService.listen('user/addUser');
    }

    editUser(user: UserModel): void {      
      this.wsService.emit('user/editUser', { user });
    }
    _editUser(): Observable<UserModel> {
      return this.wsService.listen('user/editUser');
    }

    editPasswordUser(user: UserModel): void {      
      this.wsService.emit('user/editPasswordUser', { user });
    }
    _editPasswordUser(): Observable<UserModel> {
      return this.wsService.listen('user/editPasswordUser');
    }

    delUser(user: UserModel): void {      
      this.wsService.emit('user/delUser', { user });
    }
    _delUser(): Observable<number> {
      return this.wsService.listen('user/delUser');
    }

    _disabledUser(): Observable<number> {
      return this.wsService.listen('user/disabledUser');
    }

    _endSessionChangePasswordUser(): Observable<number> {      
      return this.wsService.listen('user/endSessionChangePasswordUser');
    }         
}
