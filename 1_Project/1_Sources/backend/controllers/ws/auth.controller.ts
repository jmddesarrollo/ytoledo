import { Socket } from 'socket.io';

import ControlException from '../../utils/controlException';
import InputSanitizer from '../../utils/inputSanitizer';
import { AuthService, UserService } from '../../services/user';

import AuthorizedMiddleware from '../../server/middlewares/authorized.middleware';

// EMAIL
import mailSMTPClass from '../../server/mail/sendSMTP.mail';
const env = process.env.YTO_NODE_ENV || 'development';
const config = require('../../config/config')[env];
var path = require('path');
//

const fs = require('fs');
const signatureFile = `./files/templates/signature.html`;
const signatureHTML = fs.readFileSync(signatureFile);

const sequelize = require('../../models').sequelize;

export class AuthController {
    private authService = new AuthService();
    private userService = new UserService();

    private AuthorizedMiddleware = new AuthorizedMiddleware();

    constructor() { }

    public async login(req: any, socket: Socket) {
        // Iniciar transacción
        let t = await sequelize.transaction(); 

        try {
            // Sanitización de inputs (Requisitos 9.1, 9.2, 9.4)
            InputSanitizer.requireField(req.userName, 'userName');
            InputSanitizer.requireField(req.password, 'password');
            const userName = InputSanitizer.sanitizeString(req.userName, 45);
            const password = InputSanitizer.sanitizeString(req.password, 100);

            const ip = socket.handshake && socket.handshake.address ? socket.handshake.address : 'unknown';
            const data = await this.authService.login(userName, password, t, ip);

            t.commit();

            socket.emit("auth/login", { data, message: 'Inicio de la sesión realizado satisfactoriamente' });
        } catch (error) {
            // Commit excepcional. Aunque haya generado error se debe de actualizar el número de intentos de acceso
            t.commit();

            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

    public async logout(req: any, socket: Socket) {
        try {
            socket.emit("auth/logout", { message: 'Finalización de la sesión realizado satisfactoriamente' });
        } catch (error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

    /**
     * Consultar el perfil del usuario
     */
    public async getMyProfile(req: any, socket: Socket) {
        try {
            const decoded = await this.AuthorizedMiddleware.checkToken(req.token, socket);
            const user = await this.userService.getUser(decoded.user.id);
            user.password = undefined;

            const data = user;

            socket.emit("auth/getMyProfile", { data });
        } catch (error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

    /**
     * Renovar token      
     */
    public async renewToken(req: any, socket: Socket) {
        try {
            const decoded = await this.AuthorizedMiddleware.checkToken(req.token, socket);

            req.user = decoded.user;
            const data = await this.authService.renewToken(req);

            socket.emit("auth/renewToken", { data });
        } catch (error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

    /**
     * Tratar solicitud para generación de nueva contraseña. Envío de email al usuario.
     */
    public async recoveryPassword(req: any, socket: Socket) {
        const mailSMTP = new mailSMTPClass();

        try {
            // Sanitización de inputs (Requisitos 9.1, 9.2, 9.4)
            InputSanitizer.requireField(req.userName, 'userName');
            const userName = InputSanitizer.sanitizeString(req.userName, 45);

            const user = await this.userService.getUserByNameOrEmail(userName);

            if (!user) { throw new ControlException('El usuario no está registrado', 500); }
            if (!user.active) { throw new ControlException('El usuario está deshabilitado', 500); }

            req.user = { id: user.id, username: user.username, role_id: user.role_id };

            const ip = socket.handshake && socket.handshake.address ? socket.handshake.address : 'unknown';
            const token = await this.authService.recoveryToken(req, ip);

            const route = config.url + '/recovery/' + token;

            const dirLogo = path.resolve('./files/images/logo_YToledo.png');
            const dirLogoGreen = path.resolve('./files/images/logo_green.jpg');

            let message = {
                from: process.env.YTO_MAILER_USER,
                to: user.email,
                subject: '[YToledo - Club de Senderismo] Regenerar la contraseña',
                html: `
                    <div>                        
                        <div>Se ha realizado una solicitud para regenerar la contraseña para la cuenta vinculada a tu email en la aplicación de <a href="${config.url}">"Club YToledo de Senderismo"</a>. </div>
                        <div>Por favor, si no has solicitado la regeneración de la contraseña, omite este correo electrónico.</div>
                        <br>
                        <div>Puedes usar este enlace para regenerar tu contraseña:</div>
                        <div><a href="${route}">${route}</a></div>
                        <br>
                        <div>El enlace será válido durante una hora. Si caduca, puedes solicitar de nuevo la regeneración de la contraseña desde la aplicación.</div>
                        <br>
                    </div>
                    ${signatureHTML}
            `,
                attachments: [{
                    filename: 'logo_YToledo.png',
                    path: dirLogo,
                    cid: 'logo'
                },
                {
                    filename: 'logo_green.jpg',
                    path: dirLogoGreen,
                    cid: 'green'
                }]
            }

            await mailSMTP.sendMailSMTP(message);

            socket.emit("auth/recoveryPassword", { message: 'Se ha enviado un email al usuario para el procedimiento de la generación de la contraseña' });
        } catch (error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

    /**
     * Cambio de contraseña usando token de recuperación.
     * Valida el token contra BD, cambia la contraseña e invalida el token (Requisitos 5.3, 5.4).
     */
    public async changePasswordWithRecoveryToken(req: any, socket: Socket) {
        let t = await sequelize.transaction();

        try {
            // Sanitización de inputs (Requisitos 9.1, 9.4)
            InputSanitizer.requireField(req.tokenRecovery, 'tokenRecovery');
            InputSanitizer.requireField(req.user?.password, 'password');
            const tokenRecovery = InputSanitizer.sanitizeString(req.tokenRecovery, 500);
            const user = { ...req.user, password: req.user?.password }; // password se valida en BLL con regex

            const decoded = await this.AuthorizedMiddleware.checkToken(tokenRecovery, socket, true);

            if (!decoded.user) { throw new ControlException('No ha sido encontrado el usuario', 500); }

            // Verificar hash del token en BD antes de cambiar la contraseña (Requisito 5.3)
            await this.authService.validateRecoveryToken(decoded.user.id, tokenRecovery);

            const data = await this.userService.editPasswordUser(user, t);

            // Invalidar el token tras cambio exitoso (Requisito 5.4)
            const ip = socket.handshake && socket.handshake.address ? socket.handshake.address : 'unknown';
            await this.authService.consumeRecoveryToken(decoded.user.id, decoded.user.username, ip);

            t.commit();

            socket.emit("auth/changePasswordWithRecoveryToken", { data, message: 'La contraseña se ha cambiado correctamente' });
        } catch (error) {
            t.rollback();

            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

    public async validateTokenRecovery(req: any, socket: Socket) {
        try {
            // Sanitización de inputs (Requisitos 9.1, 9.4)
            InputSanitizer.requireField(req.tokenRecovery, 'tokenRecovery');
            const tokenRecovery = InputSanitizer.sanitizeString(req.tokenRecovery, 500);

            const decoded = await this.AuthorizedMiddleware.checkToken(tokenRecovery, socket, true);

            if (!decoded.user) { throw new ControlException('No ha sido encontrado el usuario', 500); }

            // Verificar que el hash del token coincide con el almacenado en BD (Requisito 5.3)
            await this.authService.validateRecoveryToken(decoded.user.id, tokenRecovery);

            const user = await this.userService.getUserByNameOrEmail(decoded.user.username);
            if (!user) { throw new ControlException('No ha sido encontrado el usuario', 500); }

            const data = {user: null};
            data.user = user;

            socket.emit("auth/validateTokenRecovery", { data, message: 'Token válido' });
        } catch (error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

}
