import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';

import { FormGroup, FormControl, Validators } from '@angular/forms';

// Servicios
import { EmailService } from '../../../services/websockets/email.service';
import { MessageService } from 'primeng/api';
import { RoleService } from '../../../services/websockets/role.service';
import { UserService } from '../../../services/websockets/user.service';
import { ValidateService } from '../../../services/help/validate.service';

// Modelos
import { RoleModel } from '../../../models/role.model';
import { UserModel } from '../../../models/user.model';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit, OnDestroy {
  @Input() user: UserModel;
  @Output() cancel: EventEmitter<boolean> = new EventEmitter();

  public forma: FormGroup;

  public roles: RoleModel[];
  public selectedRole: RoleModel;

  private observables = new Array();

  constructor(    
    private emailService: EmailService,
    private messageService: MessageService,
    private roleService: RoleService,
    private userService: UserService,
    private validateService: ValidateService
  ) { 
    this.forma = new FormGroup({
      'id': new FormControl(''),
      'name': new FormControl('', [Validators.required, this.validateService.textMax100, Validators.pattern('^([A-Za-zñÑÁÉÍÓÚÄËÏÖÜáéíóúäëïöüÇç&\'._-]+[\\s]*)+$')]),
      'lastname': new FormControl('', [this.validateService.textMax100, Validators.pattern('^([A-Za-zñÑÁÉÍÓÚÄËÏÖÜáéíóúäëïöüÇç&\'._-]+[\\s]*)+$')]),
      'email': new FormControl('', [Validators.required, this.validateService.textMax100, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]),
      'username': new FormControl('', [Validators.required, this.validateService.textMax45, Validators.pattern('^[0-9A-Za-zñÑ._-]+$')]),
      'member_num': new FormControl(0),
      'password': new FormControl(''),      
      'active': new FormControl(false),
      'attempts': new FormControl(0),
      'createdAt': new FormControl(null),
      'updatedAt': new FormControl(null),
      'role_id': new FormControl(''),
      'role': new FormControl(null),
      'confirmPass': new FormControl(null),
    });
  }

  ngOnInit(): void {
    this.roles = [];    

    this.forma.setValue(this.user);

    this.selectedRole = this.user.role;

    this._getRoles();
    this.getRoles();

    this._addUser();
    this._editUser();
    this._delUser();

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

  getRoles(): void {
    this.roleService.getRoles();
  }

  saveData() {
    if (this.selectedRole.id === 0) {
      this.messageService.add({ severity: 'error', summary: 'Alta', detail: 'Debe seleccionar un rol al usuario', life: 5000 });      
      return false;
    }

    this.user = this.forma.value;
    this.user.role_id = this.selectedRole.id;
    this.user.role = this.selectedRole;

    if (this.user.id) {
      this.userService.editUser(this.user);
    } else {
      this.userService.addUser(this.user);
    }    
  }

  onInputMemberNum(event) {
    const forma = this.forma.value;
    forma['member_num'] = event.value;
    this.forma.setValue(forma);
  }

  cancelEmmiter() {
    this.cancel.emit(false);    
  }

  changeSelRole() {
    // Quitar rol añadido por defecto una vez se cambia de rol    
    this.roles = this.roles.filter(r => r.id !== 0);
  }

  /**
   * Observables
   */
  _getRoles(): any {
    const ob = this.roleService._getRoles().subscribe((response: any) => {
      const data = response.data;

      this.roles = data;

      if (!this.user.id) {
        const roleDefault: RoleModel = {
          id: 0,
          name: 'Seleccionar rol'
        }
        this.roles.unshift(roleDefault);
        
        this.selectedRole = this.roles[0];
      }      
    });
    this.observables.push(ob);
  }

  _addUser(): any {
    const ob = this.userService._addUser().subscribe((response: any) => {
      if (response.message) {
        this.messageService.add({ severity: 'success', summary: 'Alta', detail: response.message, life: 2000 });
        this.cancelEmmiter(); 
        
        const data = response.data;
        this.emailService.sendEmailUserAdd(data.id);
      }
    });
    this.observables.push(ob);
  }
  _editUser(): any {
    const ob = this.userService._editUser().subscribe((response: any) => {
      if (response.message) {
        this.messageService.add({ severity: 'success', summary: 'Edición', detail: response.message, life: 2000 });
        this.cancelEmmiter();

        const data = response.data;
        const userPrev = response.userPrev;
        this.emailService.sendEmailUserEdit(data.id, userPrev);
      }
    });
    this.observables.push(ob);
  }
  _delUser(): any {
    const ob = this.userService._delUser().subscribe((response: any) => {
      const data = response.data;

      if (this.user.id === data.user.id) {
        this.messageService.add({ severity: 'warn', summary: 'Edición', detail: 'El usuario que estaba siendo gestionado ha sido eliminado', life: 4000 });
        this.cancelEmmiter();
      }      
    });
    this.observables.push(ob);
  }

  _addRole(): any {
    const ob = this.roleService._addRole().subscribe((response: any) => {
      this.roles.push(response.data);
      this.roles = [...this.roles];
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
      this.roles.filter(r => r.id !== response.data.id);
    });
    this.observables.push(ob);
  }

}
