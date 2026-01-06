import ControlException from '../../utils/controlException';

const db = require("../../models");

const Roles = db.roles;
const roleHasPermission = db.role_has_permission;

export default class RoleDAL {

    constructor() {}

    /**
     * Consulta de todos los roles
     */    
    public getRoles() { 
        const roles = Roles.findAll({raw: true})
                        .catch(() => { throw new ControlException('Ha ocurrido un error al buscar los roles', 500); });
        
        return roles;
    }

    /**
     * Consulta de un rol
     */    
    public getRole(id: number) {
        const role = Roles.findOne({where: {id} })
                        .catch(() => { throw new ControlException('Ha ocurrido un error al buscar el rol', 500); });
        return role;
    }

    /**
     * Alta de un rol
     */
    public addRole(role: any, t: any) {
        const roleDB = Roles.create(role, { transaction: t })
                        .catch((err: any) => { 
                            if (err.errors[0].path === 'name_UNIQUE') throw new ControlException('El nombre del rol ya existe', 500);
                            if (err && err.errors[0] && err.errors[0].message) throw new ControlException(err.errors[0].message, 500); 
                            throw new ControlException('Ha ocurrido un error al crear el rol', 500); 
                        });
    
        return roleDB;
    }

    /**
     * Editar un rol
     */
    public editRole(role: any, t: any) {        
        const roleDB = role.save({ transaction: t })
                    .catch((err: any) => {
                        if (err.errors[0].path === 'name_UNIQUE') throw new ControlException('El nombre del rol ya existe', 500);
                        if (err && err.errors[0] && err.errors[0].message) throw new ControlException(err.errors[0].message, 500); 
                        throw new ControlException('Ha ocurrido un error al editar el rol', 500);                    
                    });

        return roleDB;
    }

    /**
     * Eliminación de los permisos asociados a un rol
     */
     public delRoleHasPermission(roleId: number, t: any) {
        const roleDB = roleHasPermission.destroy({ where: { roles_id: roleId } , transaction: t})
                        .catch((err: any) => {  
                            throw new ControlException('Ha ocurrido un error al eliminar los permisos asociados a el rol', 500); 
                        }); 
    
        return roleDB;
    }

    /**
     * Eliminación de un rol
     */
    public delRole(roleId: number, t: any) {
        const roleDB = Roles.destroy({ where: { id: roleId } , transaction: t})
                        .catch((err: any) => {
                            if (err.name === 'SequelizeForeignKeyConstraintError') 
                                throw new ControlException('No se puede eliminar el rol. Se encuentra asoaciado con algún usuario', 500);  
                                
                            throw new ControlException('Ha ocurrido un error al eliminar el rol', 500); 
                        }); 
    
        return roleDB;
    }
}
