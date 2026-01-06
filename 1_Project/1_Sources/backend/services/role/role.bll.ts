import ControlException from '../../utils/controlException';

import RoleDAL from './role.dal';

export default class RoleService {
    private roleDAL = new RoleDAL();

    constructor() {}

    /**
     * Consulta de todos los roles
     */       
    public async getRoles() {
        const roles = await this.roleDAL.getRoles();

        return roles;
    }

    /**
     * Consulta un rol
     */       
    public async getRole(id: number) {
        const role = await this.roleDAL.getRole(id);

        return role;
    }

    /**
     * Alta de un rol
     */
    public addRole(role: any, t: any) {
        const roleDB = this.roleDAL.addRole(role, t);
    
        return roleDB;
    }

    /**
     * Editar un rol
     */    
    public async editRole(role: any, t:any) {

        const roleDB = await this.getRole(role.id);
        if (!roleDB) throw new ControlException('El rol no ha sido encontrado', 500);

        roleDB.name = role.name;

        const roleOut = await this.roleDAL.editRole(roleDB, t);

        return roleOut;
    }

    /**
     * Eliminar de un rol
     */
    public async delRole(roleId: number, t: any) {
        const roleDB = await this.getRole(roleId);

        if (!roleDB) throw new ControlException('El rol no ha sido encontrado', 500);

        await this.roleDAL.delRoleHasPermission(roleId, t);
        await this.roleDAL.delRole(roleId, t);
    
        return true;
    }
}
