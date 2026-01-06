import { Socket } from 'socket.io';

import ControlException from '../../utils/controlException';

import EmailService from '../../services/email';
import RoleService from '../../services/role';
import { UserService } from '../../services/user';

import AuthorizedMiddleware from '../../server/middlewares/authorized.middleware';

const env = process.env.JMD_NODE_ENV || 'development';
const config = require('../../config/config')[env];

export class EmailController {
    private emailService = new EmailService();
    private roleService = new RoleService();
    private userService = new UserService();
    private authorizedMiddleware = new AuthorizedMiddleware();

    private permissionType: string;
    private mode: string;

    constructor(){
        this.permissionType = config.permission_users_manager;
        this.mode = 'reading';
    }

    /**
     * Enviar un email de alta de usuario
     */    
    public async sendEmailUserAdd(req: any, socket: Socket ) {
        const userId = req.userId;
        
        try {
            this.mode = 'writing';

            const tokenDecoded = this.authorizedMiddleware.checkToken(req.token, socket);
            await this.authorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            const user = await this.userService.getUser(userId);
            const role = await this.roleService.getRole(user.role_id);

            const data = await this.emailService.sendEmailUserAdd(user, role);
            
            socket.emit("user/sendEmailUserAdd", { data, message: 'Se ha enviado un email al usuario dado de alta satisfactoriamente' });
        } catch(error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

    /**
     * Enviar un email de edición de usuario
     */    
     public async sendEmailUserEdit(req: any, socket: Socket ) {
        const userId = req.userId;
        const userPrev = req.userPrev;
        
        try {
            this.mode = 'writing';

            const tokenDecoded = this.authorizedMiddleware.checkToken(req.token, socket);
            await this.authorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            const user = await this.userService.getUser(userId);
            const role = await this.roleService.getRole(user.role_id);

            let data = undefined;
            if (user.username !== userPrev.username || user.name !== userPrev.name 
                || user.lastname !== userPrev.lastname || user.email !== userPrev.email
                || user.role_id !== userPrev.role_id) {
                data = await this.emailService.sendEmailUserEdit(user, role);
            }

            if (user.email  !== userPrev.email)  await this.emailService.sendEmailUserEditEmail(userPrev);
            if (user.active !== userPrev.active) await this.emailService.sendEmailUserEditActivate(user);            
            
            socket.emit("user/sendEmailUserEdit", { data, message: 'Se ha enviado un email al usuario editado satisfactoriamente' });
        } catch(error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

    /**
     * Enviar un email de edición de contraseña al usuario
     */    
    public async sendEmailUserEditPassword(req: any, socket: Socket ) {
        const userId = req.userId;        
        
        try {    
            const user = await this.userService.getUser(userId);
    
            const data = await this.emailService.sendEmailUserEditPassword(user);
            
            socket.emit("user/sendEmailUserEditPassword", { data, message: 'Se ha enviado un email al usuario editado contraseña satisfactoriamente' });
        } catch(error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

    /**
     * Enviar un email de restaruación de contraseña al usuario
     */    
     public async sendEmailUserRestorePassword(req: any, socket: Socket ) {
        const userId = req.userId;        
        
        try {
            this.mode = 'writing';
    
            const tokenDecoded = this.authorizedMiddleware.checkToken(req.token, socket);
            await this.authorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);
    
            const user = await this.userService.getUser(userId);
    
            const data = await this.emailService.sendEmailUserRestorePassword(user);
            
            socket.emit("user/sendEmailUserRestorePassword", { data, message: 'Se ha enviado un email al usuario restaurado contraseña satisfactoriamente' });
        } catch(error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }    
    
    /**
     * Enviar un email de eliminación de usuario
     */    
     public async sendEmailUserDelete(req: any, socket: Socket ) {
        const user = req.user;
        
        try {
            this.mode = 'writing';

            const tokenDecoded = this.authorizedMiddleware.checkToken(req.token, socket);
            await this.authorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            const data = await this.emailService.sendEmailUserDelete(user);
            
            socket.emit("user/sendEmailUserDelete", { data, message: 'Se ha enviado un email al usuario eliminado satisfactoriamente' });
        } catch(error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }       

}
