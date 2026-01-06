import { Socket } from 'socket.io';

import ControlException from '../../utils/controlException';

import RoleService from '../../services/role';
import { UserService } from '../../services/user';

import AuthorizedMiddleware from '../../server/middlewares/authorized.middleware';

const env = process.env.JMD_NODE_ENV || 'development';
const config = require('../../config/config')[env];

const sequelize = require('../../models').sequelize;

export class UsersController {
    private roleService = new RoleService();
    private userService = new UserService();
    private AuthorizedMiddleware = new AuthorizedMiddleware();

    private permissionType: string;
    private mode: string;

    constructor(){
        this.permissionType = config.permission_users_manager;
        this.mode = 'reading';
    }

    /**
     * Consultar todos los usuarios
     */        
    public async getUsers(req: any, socket: Socket ) {
        try {
            this.mode = 'reading';

            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            const data = await this.userService.getUsers();
            
            socket.emit("user/getUsers", { data, message: 'Los usuarios se han consultado correctamente' });
        } catch(error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }
    
    /**
     * Consultar un usuario
     */    
    public async getUser(req: any, socket: Socket ) {
        const userId = req.userId;
        
        try {
            this.mode = 'reading';

            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            const data = await this.userService.getUser(userId);
            data.password = '';
            
            socket.emit("user/getUser", { data, message: 'El usuario se ha consultado correctamente' });
        } catch(error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

    /**
     * Añadir un usuario
     */        
    public async addUser(req: any, socket: Socket) {
        const user = req.user;

        // Iniciar transacción
        let t = await sequelize.transaction(); 

        try {
            this.mode = 'writing';

            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            const role = await this.roleService.getRole(user.role_id);
            if (!role) throw new ControlException('El rol asociado no existe', 500);
            
            const data = await this.userService.addUser(user, t);
    
            t.commit();
    
            socket.emit("user/addUser", { data, message: 'El usuario se ha registrado correctamente' });
            socket.broadcast.emit('user/addUser', { data });
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
     * Editar un usuario
     */        
    public async editUser(req: any, socket: Socket) {
        const user = req.user;

        // Iniciar transacción
        let t = await sequelize.transaction(); 

        try {
            this.mode = 'writing';

            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            const userPrev = await this.userService.getUser(user.id);
            const role = await this.roleService.getRole(user.role_id);
            if (!role) throw new ControlException('El rol asociado no existe', 500);

            await this.userService.validateEditUserDefault(user, tokenDecoded);

            const data     = await this.userService.editUser(user, t);
    
            t.commit();
    
            socket.emit("user/editUser", { data, userPrev, message: 'El usuario se ha editado correctamente' });
            socket.broadcast.emit('user/editUser', { data });

            if (!data.active) {
                socket.broadcast.emit('user/disabledUser', { data, message: 'El usuario ha sido deshabilitado' });
            }
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
     * Editar la contraseña de un usuario
     */        
    public async editPasswordUser(req: any, socket: Socket) {
        const user = req.user;

        // Iniciar transacción
        let t = await sequelize.transaction(); 

        try {
            this.mode = 'writing';

            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);

            if (tokenDecoded.user.id !== user.id) {
                await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

                // Si el usuario conectado es distinto del usuario a editar, la contraseña generada será aleatoria
                user.password = this.userService.generatePasswordRandom();
            }     
            
            await this.userService.validateEditPasswordUserDefault(user, tokenDecoded);

            const data = await this.userService.editPasswordUser(user, t);
    
            t.commit();            
    
            socket.emit("user/editPasswordUser", { data, message: 'La contraseña se ha editado correctamente' });
            socket.broadcast.emit('user/editPasswordUser', { data });

            socket.emit('user/endSessionChangePasswordUser', { data, message: 'Necesario iniciar sesión por cambio de contraseña' });
            socket.broadcast.emit('user/endSessionChangePasswordUser', { data, message: 'Necesario iniciar sesión por cambio de contraseña' });
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
     * Eliminar un usuario
     */        
    public async delUser(req: any, socket: Socket) {
        const user = req.user;
        const userId = user.id;

        // Iniciar transacción
        let t = await sequelize.transaction(); 

        try {
            this.mode = 'writing';

            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            await this.userService.validateDeleteUserDefault(userId);            

            await this.userService.delUser(userId, t);

            const data = { user };
    
            t.commit();
    
            socket.emit("user/delUser", { data, message: 'El usuario se ha eliminado correctamente' });
            socket.broadcast.emit('user/delUser', { data });
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
