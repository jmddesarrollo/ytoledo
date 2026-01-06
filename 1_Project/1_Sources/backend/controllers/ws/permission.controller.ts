import { Socket } from 'socket.io';

import ControlException from '../../utils/controlException';

import PermissionService from '../../services/permission';
import RolesService from '../../services/role';

const sequelize = require('../../models').sequelize;

import AuthorizedMiddleware from '../../server/middlewares/authorized.middleware';

const env = process.env.JMD_NODE_ENV || 'development';
const config = require('../../config/config')[env];

export default class PermissionController {
    private permissionService = new PermissionService();
    private roleService = new RolesService();
    private AuthorizedMiddleware = new AuthorizedMiddleware();

    private permissionType: string;    
    private mode: string;   

    constructor(){
        this.permissionType = config.permission_permissions_manager;
        this.mode = 'reading';
    }

    /**
     * Consultar todos los permisos
     */        
    public async getPermissions(req: any, socket: Socket ) {
        try {
            this.mode = 'reading';

            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            const roles = await this.roleService.getRoles();

            const data = await this.permissionService.getPermissions(roles);

            socket.emit("permission/getPermissions", { data, message: "Los permisos se han consultado correctamente" });
        } catch(error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

    /**
     * Consultar todos los permisos relacionados con roles
     */        
    public async getPermissionsHasRoles(req: any, socket: Socket ) {
        try {
            this.mode = 'reading';

            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            const data = await this.permissionService.getPermissionsHasRoles();

            socket.emit("permission/getPermissionsHasRoles", { data, message: "Los permisos relacionados con roles se han consultado correctamente" });
        } catch(error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

    /**
     * Consultar todos los permisos relacionados con mi rol
     */        
    public async getMyPermissionsHasRoles(req: any, socket: Socket ) {
        try {            
            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);

            let data = {};
            let userId = undefined;
            let roleId = undefined;

            if (tokenDecoded && tokenDecoded.user && tokenDecoded.user.id) {
                userId = tokenDecoded.user.id;
                roleId = tokenDecoded.user.role_id;
                data = await this.permissionService.getPermissionsHasRol(roleId);
            }
                
            const user = { userId, roleId };

            socket.emit("permission/getMyPermissionsHasRoles", { 
                data, 
                user, 
                message: "Los permisos relacionados con roles se han consultado correctamente" 
            });

        } catch(error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

    /**
     * Añadir un permiso asociado a un rol
     */
    public async addPermission(req: any, socket: Socket) {
        const RoleHasPermission = req.RoleHasPermission;

        // Iniciar transacción
        let t = await sequelize.transaction();

        try {
            this.mode = 'writing';

            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            const permission = this.permissionService.getPermission(RoleHasPermission.permissions_id);
            if(!permission) throw new ControlException('El permiso no ha sido encontrado', 500);

            const role = await this.roleService.getRole(RoleHasPermission.roles_id);
            if (!role) throw new ControlException('El rol no ha sido encontrado', 500);
            
            // primero se elimina el permiso y luego se da de alta con los nuevos valores
            await this.permissionService.delRoleHasPermission(RoleHasPermission.permissions_id, RoleHasPermission.roles_id, t);
            const data = await this.permissionService.addRoleHasPermission(RoleHasPermission, t);
    
            t.commit();
    
            socket.emit("permission/addPermission", { data, message: 'El permiso se ha registrado correctamente' });
            socket.broadcast.emit('permission/addPermission', { data });
        } catch(error) {
            t.rollback();

            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

    /**
     * Eliminar un permiso asociado a un rol
     */
    public async delPermission(req: any, socket: Socket) {
        const permissions_id = req.permissions_id;
        const roles_id       = req.roles_id;

        // Iniciar transacción
        let t = await sequelize.transaction();

        try {
            this.mode = 'writing';

            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            if (roles_id === config.roleAdmin) throw new ControlException('El Administrador debe tener todos los permisos', 500);

            const permission = this.permissionService.getPermission(permissions_id);
            if(!permission) throw new ControlException('El permiso no ha sido encontrado', 500);

            const role = await this.roleService.getRole(roles_id);
            if (!role) throw new ControlException('El rol no ha sido encontrado', 500);
            
            await this.permissionService.delRoleHasPermission(permissions_id, roles_id, t);
            const data = {permissions_id, roles_id};            
    
            t.commit();
    
            socket.emit("permission/delPermission", { data, message: 'El permiso se ha eliminado correctamente' });
            socket.broadcast.emit('permission/delPermission', { data });
        } catch(error) {
            t.rollback();

            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

}
