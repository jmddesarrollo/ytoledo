import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

// API
import { MessageService } from 'primeng/api';

// Al inyectarse en providedIn root no tiene que declararse en module
@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  public socketStatus: boolean;
  public token: string;
  public sessionOn: boolean;
  public userId: number;

  constructor(
    private socket: Socket,
    private messageService: MessageService
  ) {
    this.socketStatus = false;
    this.token = '';
    this.userId = null;
    this.sessionOn = false;

    if (localStorage.getItem('token')) {
      this.token = localStorage.getItem('token');
      this.sessionOn = true;
    }
    if (localStorage.getItem('id')) {
      this.userId = Number(localStorage.getItem('id'));
    }

    this.socket.on('error_message', (data) => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: data.message, life: 5000 });
    });
    this.socket.on('error', (data) => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: data.replace('Validation error:', ''), life: 4000 });
    });

    this.checkStatus();
  }

  checkStatus(): any {
    this.socket.on('connection', () => {
      console.log('Conectado con el Servidor');
      this.socketStatus = true;
    });
    this.socket.on('connect', () => {
      console.log('Conectado con el Servidor');
      this.socketStatus = true;
    });
    this.socket.on('disconnect', () => {
      console.log('Desconectado con el Servidor');
      this.socketStatus = false;
    });
  }

  setToken(token: string): void {
    this.token = token;
  }
  setSessionOn(value: boolean): void {
    this.sessionOn = value;
  }
  setUserId(userId: number): void {
    this.userId = userId;
  }

  emit(event: string, payload: any): any {
    const token = this.token;

    this.socket.ioSocket.io.opts.query = { token };
    if (!this.socketStatus) {
      this.socket.connect();
    }

    payload.token = this.token;

    this.socket.emit(event, payload);
  }

  listen(event: string): Observable<any> {
    return this.socket.fromEvent(event);
  }
}
