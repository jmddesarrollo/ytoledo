import { RoleModel } from "./role.model";

export class PermissionModel {
    constructor(
        public id: number,
        public name: string,
        public detail: string,
        public roles?: RoleModel[]
    ) {}
}
