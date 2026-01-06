export class RoleHasPermission {
    constructor(
        public permissions_id: number,
        public roles_id: number,
        public reading: boolean,
        public writing: boolean
    ) {}
}
