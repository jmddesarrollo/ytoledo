import { Injectable } from '@angular/core';
import { WebsocketService } from '../websocket.service';
import { Observable } from 'rxjs';

import { UserModel } from '../../models/user.model';

@Injectable()
export class AuthService {
    constructor(private wsService: WebsocketService) {
    }

    login(data: Login): void {
        this.wsService.emit('auth/login', data);
    }
    _login(): Observable<UserModel[]> {
        return this.wsService.listen('auth/login');
    }

    logout(): void {
        this.wsService.emit('auth/logout', {});
    }
    _logout(): Observable<UserModel[]> {
        return this.wsService.listen('auth/logout');
    }

    _notAllowed(): Observable<UserModel[]> {
        return this.wsService.listen('auth/notAllowed');
    }

    getMyProfile(): void {
        this.wsService.emit('auth/getMyProfile', {});
    }
    _getMyProfile(): Observable<UserModel> {
        return this.wsService.listen('auth/getMyProfile');
    }

    renewToken(): void {
        this.wsService.emit('auth/renewToken', {});
    }
    _renewToken(): Observable<UserModel[]> {
        return this.wsService.listen('auth/renewToken');
    }

    recoveryPassword(data: Login): void {
        this.wsService.emit('auth/recoveryPassword', data);
    }
    _recoveryPassword(): Observable<UserModel[]> {
        return this.wsService.listen('auth/recoveryPassword');
    }
    validateTokenRecovery(data: any): void {
        this.wsService.emit('auth/validateTokenRecovery', data);
    }
    _validateTokenRecovery(): Observable<any[]> {
        return this.wsService.listen('auth/validateTokenRecovery');
    }
}

interface Login {
    userName: string;
    password: string;
}
