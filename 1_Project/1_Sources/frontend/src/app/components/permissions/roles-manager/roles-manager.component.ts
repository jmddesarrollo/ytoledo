import { Component, OnInit } from '@angular/core';

import { FormGroup, FormControl, Validators } from '@angular/forms';

// Servicios
import { ConfirmationService, MessageService } from 'primeng/api';
import { RoleManagerShareService } from '../../../services/share/role-mananager-share.service';
import { RoleService } from '../../../services/websockets/role.service';
import { ValidateService } from '../../../services/help/validate.service';

// Modelos
import { RoleModel } from '../../../models/role.model';

import { GLOBAL } from '../../../services/global';

@Component({
  selector: 'app-roles-manager',
  templateUrl: './roles-manager.component.html',
  styleUrls: ['./roles-manager.component.css']
})
export class RolesManagerComponent implements OnInit {
  public roles: RoleModel[];
  public role: RoleModel;

  public formaRoleAdd: FormGroup;
  public formaRoleEdit: FormGroup;

  public editId: number;

  public adminRoleId: number;

  private observables = new Array();

  constructor(
    private confirmationService: ConfirmationService,
    private roleManagerShareService: RoleManagerShareService,
    private messageService: MessageService,
    private roleService: RoleService,
    private validateService: ValidateService
  ) {
    this.formaRoleAdd = new FormGroup({
      'id': new FormControl(''),
      'name': new FormControl('', [Validators.required, this.validateService.textMax45, Validators.pattern('^([0-9A-Za-zñÑÁÉÍÓÚÄËÏÖÜáéíóúäëïöüÇç&\'._-]+[\\s]*)+$')])
    });

    this.formaRoleEdit = new FormGroup({
      'id': new FormControl(''),
      'name': new FormControl('', [Validators.required, this.validateService.textMax45, Validators.pattern('^([0-9A-Za-zñÑÁÉÍÓÚÄËÏÖÜáéíóúäëïöüÇç&\'._-]+[\\s]*)+$')])
    });

    this.editId = 0;

    this.adminRoleId = GLOBAL.adminRoleId;
  }

  ngOnInit() {
    this._getRoles();
    this.getRoles();

    this._addRole();
    this._editRole();
    this._delRole();

    this._hideModalRoleManager();
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

  addRole() {
    this.roleService.addRole(this.formaRoleAdd.value);
  }

  editRole() {
    this.roleService.editRole(this.formaRoleEdit.value);
  }

  /**
   * Solicitud para confirmar la eliminación del rol
   */
  confirmDelRole(role: RoleModel, event: Event) {
    this.confirmationService.confirm({
      target: event.target,
      message: '¿Está seguro de proceder con la eliminación del rol?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: "Si",
      accept: () => {
        this.roleService.delRole(role.id);
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

  changeEditId(role: RoleModel) {
    this.editId = role.id;

    this.formaRoleEdit.setValue(role);
  }

  cancelRole() {
    this.editId = 0;

    const roleEdit = {
      id: null,
      name: null
    }

    this.formaRoleEdit.setValue(roleEdit);
  }

  /**
   * Observables
   */
  _getRoles(): any {
    const ob = this.roleService._getRoles().subscribe((response: any) => {
      const data = response.data;

      this.roles = data;
    });
    this.observables.push(ob);
  }

  _addRole(): any {
    const ob = this.roleService._addRole().subscribe((response: any) => {
      if (response.message) {
        const roleAdd = {
          id: null,
          name: ''
        }
        
        this.formaRoleAdd.setValue(roleAdd);

        this.messageService.add({ severity: 'success', summary: 'Alta', detail: response.message, life: 2000 });

        this.roles.push(response.data);

        this.getRoles();
      }
    });
    this.observables.push(ob);
  }

  _editRole(): any {
    const ob = this.roleService._editRole().subscribe((response: any) => {
      if (response.message) {
        this.editId = 0;

        const roleEdit = {
          id: null,
          name: null
        }
    
        this.formaRoleEdit.setValue(roleEdit);

        this.messageService.add({ severity: 'success', summary: 'Edición', detail: response.message, life: 2000 });

        const role = this.roles.find(r => r.id === response.data.id);
        role.name = response.data.name;

        this.roles = [...this.roles];

        this.getRoles();
      }
    });
    this.observables.push(ob);
  }

  _delRole(): any {
    const ob = this.roleService._delRole().subscribe((response: any) => {
      if (response.message) {
        this.messageService.add({ severity: 'success', summary: 'Eliminación', detail: response.message, life: 2000 });

        this.getRoles();
      }
    });
    this.observables.push(ob);
  }

  _hideModalRoleManager(): void {
    const ob = this.roleManagerShareService.currentHideModalRoleManager.subscribe((value) => {
      if (value) {
        this.editId = 0;

        const roleAdd = {
          id: null,
          name: ''
        }
        
        this.formaRoleAdd.setValue(roleAdd);        
      }
    });

    this.observables.push(ob);
  }

}
