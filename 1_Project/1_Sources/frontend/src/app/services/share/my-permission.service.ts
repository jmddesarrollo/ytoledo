import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

// Modelos
import { RoleHasPermission } from '../../models/roleHasPermission.model';

@Injectable()
export class MyPermissionShareService {

  private objMyPermissions = new BehaviorSubject<RoleHasPermission[]>([]);
  currentMyPermissions = this.objMyPermissions.asObservable();

  constructor() {}

  changeMyPermissions(myPermissions: RoleHasPermission[] = []): any {
    return this.objMyPermissions.next(myPermissions);
  }
}
