import { Socket } from 'socket.io';

import { AuthController } from '../../controllers/ws/auth.controller';

export const AuthRoutes = (socket: Socket) => {
    const authController = new AuthController();
    
    socket.on('auth/login', (req: Request) => { authController.login(req, socket)});
    socket.on('auth/logout', (req: Request) => { authController.logout(req, socket)});
    socket.on('auth/getMyProfile', (req: Request) => { authController.getMyProfile(req, socket)});
    socket.on('auth/renewToken', (req: Request) => { authController.renewToken(req, socket)});
    socket.on('auth/recoveryPassword', (req: Request) => { authController.recoveryPassword(req, socket)});
    socket.on('auth/validateTokenRecovery', (req: Request) => { authController.validateTokenRecovery(req, socket)});    
}
