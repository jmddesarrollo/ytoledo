import { Socket } from 'socket.io';

import ControlException from '../../utils/controlException';
import SecurityLogger from '../../utils/securityLogger';

const jwt = require('jsonwebtoken');

import PermissionService from '../../services/permission';
import { UserService } from '../../services/user';

export default class AuthorizedMiddleware {
    private permissionService = new PermissionService();
    private userService = new UserService();

    constructor() {}

    private getSocketIp(socket: Socket): string {
        return socket.handshake && socket.handshake.address ? socket.handshake.address : 'unknown';
    }

    private getTokenUsername(tokenDecoded: any): string {
        if (tokenDecoded && tokenDecoded.user) {
            return tokenDecoded.user.username || String(tokenDecoded.user.id || 'unknown');
        }

        return 'unknown';
    }

    // =====================================
    // Verificar token - Middleware
    // =====================================
    /**
     * Check pensado por si se usa middleware ('use') en server.ts antes del connect     
     */
    public checkTokenNameSpace = (socket: Socket, next: Function) => {
        if (socket.handshake.query && !socket.handshake.query.token) {
            SecurityLogger.logAccessDenied(this.getSocketIp(socket), 'unknown', 'Token ausente');
            return next(new Error('El usuario o contraseña no son correctos'));
        }
            
        const token = socket.handshake.query.token;

        if (!token) { 
            SecurityLogger.logAccessDenied(this.getSocketIp(socket), 'unknown', 'Token ausente');
            return next(new Error('El usuario no ha iniciado sesión')); 
        }
    
        jwt.verify(token, process.env.YTO_SEED, (err: any, decoded: any) => {
            if (err) {
                if (err.name && err.name === 'TokenExpiredError') {
                    SecurityLogger.logTokenExpired(this.getSocketIp(socket));
                    return next(new Error('El tiempo de conexión ha expirado'));                                      
                }

                SecurityLogger.logTokenInvalid(this.getSocketIp(socket));
                return next(new Error('El usuario o contraseña no son correctos'));               
            }
    
            socket.handshake.query.decoded = decoded;
    
            next();
        });
    }

    /**
     * Verificar token      
     */
    public async checkToken (token: string, socket: Socket, recovery: boolean = false): Promise<any> {        
        if (!token) {
            socket.emit("auth/logout", {});
            SecurityLogger.logAccessDenied(this.getSocketIp(socket), 'unknown', 'Token ausente');
            throw new ControlException('El usuario no tiene inicio de sesión', 401); 
        }

        try {
            const decoded = jwt.verify(token, process.env.YTO_SEED);
            const user = await this.userService.getUser(decoded.user.id);

            if (!user || !user.active) {
                socket.emit("auth/logout", {});
                SecurityLogger.logAccessDenied(this.getSocketIp(socket), this.getTokenUsername(decoded), 'Usuario inactivo o inexistente');
                throw new ControlException('El usuario no tiene inicio de sesión', 401);
            }

            decoded.user = {
                id: user.id,
                username: user.username,
                role_id: user.role_id,
            };

            return decoded;
        } catch (err: any) {
            if (err instanceof ControlException) {
                throw err;
            }

            if (err.name && err.name === 'TokenExpiredError') {
                socket.emit("auth/logout", {});
                SecurityLogger.logTokenExpired(this.getSocketIp(socket));
                if (recovery) throw new ControlException('El enlace de recuperación de la contraseña ha expirado', 401);
                throw new ControlException('El tiempo de conexión ha expirado', 401);
            }

            socket.emit("auth/logout", {});
            SecurityLogger.logTokenInvalid(this.getSocketIp(socket));
            throw new ControlException('El usuario o contraseña no son correctos', 401);
        }
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
            SecurityLogger.logAccessDenied(this.getSocketIp(socket), this.getTokenUsername(tokenDecoded), permissionType);
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
            SecurityLogger.logAccessDenied(this.getSocketIp(socket), this.getTokenUsername(tokenDecoded), permissionTypes.join(','));
            throw new ControlException('El usuario no tiene permiso para la petición', 405); 
        }

        return true;
    }    

}
