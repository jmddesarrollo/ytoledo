import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { FormGroup, FormControl, Validators } from '@angular/forms';

// Servicios
import { EmailService } from '../../../services/websockets/email.service';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../services/websockets/user.service';
import { ValidateService } from '../../../services/help/validate.service';
import { WebsocketService } from '../../../services/websocket.service';

// Modelos
import { UserModel } from '../../../models/user.model';

@Component({
  selector: 'app-user-form-password',
  templateUrl: './user-form-password.component.html',
  styleUrls: ['./user-form-password.component.css']
})
export class UserFormPasswordComponent implements OnInit, OnDestroy {

  @Input() user: UserModel;
  @Output() cancel: EventEmitter<boolean> = new EventEmitter();  

  public forma: FormGroup;

  public repeatPassword: string;

  public restore: boolean;
  public myUserId: number;

  private observables = new Array();

  constructor(
    private emailService: EmailService,
    private messageService: MessageService,
    private userService: UserService,
    private validateService: ValidateService,
    private websocketService: WebsocketService,
    private router: Router
  ) {    
    this.forma = new FormGroup({
      'id': new FormControl(''),
      'name': new FormControl(''),
      'lastname': new FormControl(''),
      'email': new FormControl(''),
      'username': new FormControl(''),
      'member_num': new FormControl(0),
      'password': new FormControl('', [Validators.required, this.validateService.textMin06, this.validateService.textMax15, Validators.pattern(/^(?=.*[0-9])(?=.*[A-ZÑ])(?=.*[a-zñ])(?=.*[$€#%&_-])\S{6,15}$/)]),      
      'confirmPass': new FormControl('', [Validators.required]),      
      'active': new FormControl(false),
      'attempts': new FormControl(0),
      'createdAt': new FormControl(null),
      'updatedAt': new FormControl(null),      
      'role_id': new FormControl(''),
      'role': new FormControl(null)
    }, { validators: this.validateService.checkPasswords });

    this.myUserId = this.websocketService.userId;
    
    this.restore = false;        
  }

  ngOnInit(): void {
    this._editPasswordUser();

    this.forma.setValue(this.user);

    if (this.myUserId && (this.myUserId !== this.user.id)) this.restore = true;
  }
  ngOnDestroy() {
    for (const ob of this.observables) {
      if (ob !== undefined && ob !== null) {
        ob.unsubscribe();
      }
    }
  }

  saveData() {    
    this.user = this.forma.value;

    this.userService.editPasswordUser(this.user);
  }

  cancelEmmiter() {
    this.cancel.emit(false);    
  }

  /**
   * Observables
   */
  _editPasswordUser(): any {
    const ob = this.userService._editPasswordUser().subscribe((response: any) => {
      if (response.message) {    
        this.forma.reset();

        this.user.password = '';
        this.user.confirmPass = '';
        this.forma.setValue(this.user);
        this.messageService.add({ severity: 'success', summary: 'Edición', detail: response.message, life: 2000 });
        this.cancelEmmiter();

        const data = response.data;
        if (this.restore) {
          this.emailService.sendEmailUserRestorePassword(data.id);
        } else {
          this.emailService.sendEmailUserEditPassword(data.id);
        }        

        if (!this.websocketService.sessionOn) {
          this.router.navigate(['/login']);
        }
      }      
    });
    this.observables.push(ob);
  }
}
