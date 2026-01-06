import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable()
export class RoleManagerShareService {

  private hideModalRoleManager = new BehaviorSubject<boolean>(true);
  currentHideModalRoleManager = this.hideModalRoleManager.asObservable();

  constructor() {}

  changeHideModalRoleManager(hide: boolean = false): any {
    return this.hideModalRoleManager.next(hide);
  }
}
