import { RoleModel } from './role.model';

export class UserModel {
    constructor(
        public id: number,
        public name: string,
        public lastname: string,
        public email: string,
        public password: string,
        public username: string,
        public active: boolean,           
        public attempts: number,
        public createdAt: string,
        public updatedAt: string,
        public member_num: number,
        public role_id: number,
        public confirmPass?: string,
        public role?: RoleModel,        
    ) {}
}
