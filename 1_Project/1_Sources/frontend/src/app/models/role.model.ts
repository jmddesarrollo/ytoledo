export class RoleModel {
    constructor(
        public id: number,
        public name: string,
        public reading?: boolean,
        public writing?: boolean
    ) {}
}
