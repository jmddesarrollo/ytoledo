import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable()
export class WRPermissionShareService {

  private objWRPermission = new BehaviorSubject<any>('');
  currentWRPermission = this.objWRPermission.asObservable();

  constructor() {}

  changeWRPermission(wrPermission: string): any {
    this.objWRPermission.next(wrPermission);
  }
}
