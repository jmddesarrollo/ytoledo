import { Socket } from 'socket.io';

import ControlException from '../../utils/controlException';

const jwt = require('jsonwebtoken');

import PermissionService from '../../services/permission';
import { UserService } from '../../services/user';

export default class AuthorizedMiddleware {
    private permissionService = new PermissionService();
    private userService = new UserService();

    constructor() {}

    // =====================================
    // Verificar token - Middleware
    // =====================================
    /**
     * Check pensado por si se usa middleware ('use') en server.ts antes del connect     
     */
    public checkTokenNameSpace = (socket: Socket, next: Function) => {
        if (socket.handshake.query && !socket.handshake.query.token) {            
            next(new Error('El usuario o contraseña no son correctos'));
        }
            
        const token = socket.handshake.query.token;

        if (!token) { 
            next(new Error('El usuario no ha iniciado sesión')); 
        }
    
        jwt.verify(token, process.env.YTO_SEED, (err: any, decoded: any) => {
            if (err) {
                if (err.name && err.name === 'TokenExpiredError') {
                    next(new Error('El tiempo de conexión ha expirado'));                                      
                }

                next(new Error('El usuario o contraseña no son correctos'));               
            }
    
            socket.handshake.query.decoded = decoded;
    
            next();
        });
    }

    /**
     * Verificar token      
     */
    public checkToken (token: string, socket: Socket, recovery: boolean = false): any {        
        var data = null;
        if (!token) {
            socket.emit("auth/logout", {});
            throw new ControlException('El usuario no tiene inicio de sesión', 401); 
        }
    
        jwt.verify(token, process.env.YTO_SEED, (err: any, decoded: any) => {
            if (err) {
                if (err.name && err.name === 'TokenExpiredError') {
                    socket.emit("auth/logout", {});
                    if (recovery) throw new ControlException('El enlace de recuperación de la contraseña ha expirado', 401);
                    throw new ControlException('El tiempo de conexión ha expirado', 401);
                }
                socket.emit("auth/logout", {});
                throw new ControlException('El usuario o contraseña no son correctos', 401);                 
            }
    
            data = decoded;
        });

        return data;
    }


    /**
     * Validar si el usuario tiene permiso   
     */
    public async isAllowed (tokenDecoded: any, permissionType: string, mode: string, socket: Socket) {
        let boolPermission: boolean = false;
        let permissions: any[];

        permissions = await this.permissionService.getPermissionsHasRoles();

        const user = await this.userService.getUser(tokenDecoded.user.id);

        for (let permission of permissions) {
            if (user.role_id === permission.roles_id && permissionType == permission.permissions_id) {
                if ( (mode === 'reading' && permission.reading) || permission.writing){
                    boolPermission = true;
                }                
            }            
        }

        if (!boolPermission) {
            socket.emit("auth/notAllowed", {mode});
            throw new ControlException('El usuario no tiene permiso para la petición', 405); 
        }

        return true;
    }

    /**
     * Validar si el usuario tiene permiso validando entre varios permisos
     */
     public async isAllowedMultiple (tokenDecoded: any, permissionTypes: string[], mode: string, socket: Socket) {
        let boolPermission: boolean = false;
        let permissions: any[];

        permissions = await this.permissionService.getPermissionsHasRoles();

        const user = await this.userService.getUser(tokenDecoded.user.id);
        
        for (const permissionType of permissionTypes) {

            for (let permission of permissions) {
                if (user.role_id === permission.roles_id && permissionType == permission.permissions_id) {
                    if ( (mode === 'reading' && permission.reading) || permission.writing) {
                        boolPermission = true;
                    }                
                }            
            }
        }

        if (!boolPermission) {
            socket.emit("auth/notAllowed", {mode});
            throw new ControlException('El usuario no tiene permiso para la petición', 405); 
        }

        return true;
    }    

}
