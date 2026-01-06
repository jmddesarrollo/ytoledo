import { Socket } from 'socket.io';

import ControlException from '../../utils/controlException';
import RoleService from '../../services/role';

const sequelize = require('../../models').sequelize;

import AuthorizedMiddleware from '../../server/middlewares/authorized.middleware';

const env = process.env.JMD_NODE_ENV || 'development';
const config = require('../../config/config')[env];

export default class RoleController {
    private roleService = new RoleService();
    private AuthorizedMiddleware = new AuthorizedMiddleware();

    private permissionType: string; 
    private mode: string; 

    constructor(){
        this.permissionType = config.permission_permissions_manager;
        this.mode = 'reading';
    }

    /**
     * Consultar todos los roles
     */        
    public async getRoles(req: any, socket: Socket ) {
        try {
            this.AuthorizedMiddleware.checkToken(req.token, socket);
                   
            const data = await this.roleService.getRoles();            
            
            socket.emit("role/getRoles", { data, message: "Los roles se han consultado correctamente" });
        } catch(error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }    

    /**
     * Consultar un rol
     */        
    public async getRole(req: any, socket: Socket ) {
        try {      
            this.AuthorizedMiddleware.checkToken(req.token, socket);            

            const data = await this.roleService.getRole(req.id);
            
            socket.emit("role/getRole", { data, message: "El rol se ha consultado correctamente" });
        } catch(error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    } 
    
    /**
     * Añadir un rol
     */        
    public async addRole(req: any, socket: Socket) {
        const role = req.role;

        // Iniciar transacción
        let t = await sequelize.transaction(); 

        try {
            this.mode = 'writing';

            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);
            
            const data = await this.roleService.addRole(role, t);
    
            t.commit();
    
            socket.emit("role/addRole", { data, message: 'El rol se ha registrado correctamente' });
            socket.broadcast.emit('role/addRole', { data });
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
     * Editar un rol
     */        
    public async editRole(req: any, socket: Socket) {
        const role = req.role;

        // Iniciar transacción
        let t = await sequelize.transaction(); 

        try {
            this.mode = 'writing';

            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            const data = await this.roleService.editRole(role, t);
    
            t.commit();
    
            socket.emit("role/editRole", { data, message: 'El rol se ha editado correctamente' });
            socket.broadcast.emit('role/editRole', { data });
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
     * Eliminar un rol
     */        
    public async delRole(req: any, socket: Socket) {
        const roleId = req.roleId;

        // Iniciar transacción
        let t = await sequelize.transaction(); 

        try {
            this.mode = 'writing';

            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            if (roleId == config.roleAdmin) { throw new ControlException('El rol Administrador no se permite eliminar', 500); }

            await this.roleService.delRole(roleId, t);

            const data = { roleId }
    
            t.commit();
    
            socket.emit("role/delRole", { data, message: 'El rol se ha eliminado correctamente' });
            socket.broadcast.emit('role/delRole', { data });
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
