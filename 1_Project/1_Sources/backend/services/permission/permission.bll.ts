import ControlException from '../../utils/controlException';

import PermissionDAL from './permission.dal';

export default class PermissionService {
    private permissionDAL = new PermissionDAL();

    constructor() {}

    /**
     * Consulta de todos los permisos
     */       
    public async getPermissions(roles: any) {
        const permissions = await this.permissionDAL.getPermissions();

        // Añadir objetos de Roles asociados a cada Permiso (llegan como raw)
        for (let permission of permissions) {
            permission.roles = [];
            for (let role of roles) {
                role.reading = false;
                role.writing = false;
                permission.roles.push(role);
            } 
        }

        return permissions;
    }

    /**
     * Consulta un permiso
     */       
    public async getPermission(permissions_id: number) {
        const permission = await this.permissionDAL.getPermission(permissions_id);

        return permission;
    }

    /**
     * Consulta de todos los permisos relacionados con roles
     */       
    public async getPermissionsHasRoles() {
        const permissions = await this.permissionDAL.getPermissionsHasRoles(); 

        return permissions;
    }

    /**
     * Consulta de todos los permisos relacionados con un rol
     */       
    public async getPermissionsHasRol(rolId: number) {
        const permissions = await this.permissionDAL.getPermissionsHasRol(rolId);

        return permissions;
    }

    /**
     * Añade un permiso asociado a un rol
     */       
    public async addRoleHasPermission(permissionHasRole: any, t: any) {
        const permissions = await this.permissionDAL.addRoleHasPermission(permissionHasRole, t); 

        return permissions;
    }

    /**
     * Elimina un permiso asociado a un rol
     */       
    public async delRoleHasPermission(permissions_id: number, roles_id: number, t: any) {
        const permissions = await this.permissionDAL.delRoleHasPermission(permissions_id, roles_id, t); 

        return permissions;
    }

}