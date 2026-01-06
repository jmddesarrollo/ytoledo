import { Injectable } from '@angular/core';
import { WebsocketService } from '../websocket.service';
import { Observable } from 'rxjs';

import { UserModel } from '../../models/user.model';

@Injectable()
export class EmailService {
    constructor(private wsService: WebsocketService) {
    }

    sendEmailUserAdd(userId): void {
        this.wsService.emit('email/sendEmailUserAdd', { userId });
    }
    _sendEmailUserAdd(): Observable<UserModel> {
        return this.wsService.listen('email/sendEmailUserAdd');
    }
    sendEmailUserEdit(userId, userPrev: UserModel): void {
        this.wsService.emit('email/sendEmailUserEdit', { userId, userPrev });
    }
    _sendEmailUserEdit(): Observable<UserModel> {
        return this.wsService.listen('email/sendEmailUserEdit');
    }
    sendEmailUserEditPassword(userId): void {
        this.wsService.emit('email/sendEmailUserEditPassword', { userId });
    }
    _sendEmailUserEditPassword(): Observable<UserModel> {
        return this.wsService.listen('email/sendEmailUserEditPassword');
    }
    sendEmailUserRestorePassword(userId): void {
        this.wsService.emit('email/sendEmailUserRestorePassword', { userId });
    }
    _sendEmailUserRestorePassword(): Observable<UserModel> {
        return this.wsService.listen('email/sendEmailUserRestorePassword');
    }    
    sendEmailUserDelete(user: UserModel): void {
        this.wsService.emit('email/sendEmailUserDelete', { user });
    }
    _sendEmailUserDelete(): Observable<UserModel> {
        return this.wsService.listen('email/sendEmailUserDelete');
    }
}
