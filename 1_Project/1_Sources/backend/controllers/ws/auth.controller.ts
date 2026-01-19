import { Socket } from 'socket.io';

import ControlException from '../../utils/controlException';
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
            const data = await this.authService.login(req.userName, req.password, t);

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
            const decoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
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
            const decoded = this.AuthorizedMiddleware.checkToken(req.token, socket);

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

        const userName = req.userName;

        try {
            const user = await this.userService.getUserByNameOrEmail(userName);

            if (!user) { throw new ControlException('El usuario no está registrado', 500); }
            if (!user.active) { throw new ControlException('El usuario está deshabilitado', 500); }

            req.user = { id: user.id, username: user.username };

            const token = await this.authService.recoveryToken(req);

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

    public async validateTokenRecovery(req: any, socket: Socket) {
        try {
            const decoded = this.AuthorizedMiddleware.checkToken(req.tokenRecovery, socket, true);

            if (!decoded.user) { throw new ControlException('No ha sido encontrado el usuario', 500); }

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

