import ControlException from '../../utils/controlException';

const db = require("../../models");

const Permissions = db.permissions;
const Role_has_permission = db.role_has_permission;
const Roles = db.roles;

export default class PermissionDAL {

    constructor() {}

    /**
     * Consulta de todos los permisos
     * Debe venir ordenado por id para una correcta gestión
     */    
    public getPermissions() {
        const permissions = Permissions.findAll({raw: true, order: [['detail', 'ASC']]})
                                .catch(() => { throw new ControlException('Ha ocurrido un error al buscar los permisos', 500); });
        
        return permissions;
    }

    /**
     * Consulta un permiso
     */    
    public getPermission(permissions_id: number) { 
        const permission = Permissions.findOne({permissions_id})
                                .catch(() => { throw new ControlException('Ha ocurrido un error al buscar el permiso', 500); });
        
        return permission;
    }

    /**
     * Consultar permisos asociados a roles
     */
    public getPermissionsHasRoles() { 
        const permissions = Role_has_permission.findAll({raw: true})
                                .catch(() => { throw new ControlException('Ha ocurrido un error al buscar los permisos asociados a roles', 500); });
        
        return permissions;
    }

    /**
     * Consultar permisos asociados a un rol
     */
    public getPermissionsHasRol(roles_id: number) { 
        const permissions = Role_has_permission.findAll({raw: true, where: { roles_id }})
                                .catch(() => { throw new ControlException('Ha ocurrido un error al buscar los permisos asociados a un rol', 500); });
        
        return permissions;
    }

    /**
     * Alta de un permiso asociado a un rol
     */
    public addRoleHasPermission(role_has_permission: any, t: any) {
        const permission = Role_has_permission.create(role_has_permission, { transaction: t })
                        .catch(() => { throw new ControlException('Ha ocurrido un error al crear el permiso asocado al rol', 500); });
    
        return permission;
    }

    /**
     * Eliminación de un permiso asociado a un rol
     */
    public delRoleHasPermission(permissions_id: number, roles_id: number, t: any) {
        const permission = Role_has_permission.destroy({ where: { permissions_id, roles_id } , transaction: t})
                        .catch(() => { throw new ControlException('Ha ocurrido un error al eliminar el permiso asociado al rol', 500); }); 
    
        return permission;
    }
}
