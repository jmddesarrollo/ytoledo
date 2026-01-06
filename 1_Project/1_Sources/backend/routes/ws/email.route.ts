import { Socket } from 'socket.io';

import { EmailController } from '../../controllers/ws/email.controller';

export const EmailRoutes = (socket: Socket) => {
    const emailController = new EmailController();        
    
    socket.on('email/sendEmailUserAdd', (req: Request) => { emailController.sendEmailUserAdd(req, socket)});
    socket.on('email/sendEmailUserEdit', (req: Request) => { emailController.sendEmailUserEdit(req, socket)});
    socket.on('email/sendEmailUserEditPassword', (req: Request) => { emailController.sendEmailUserEditPassword(req, socket)});
    socket.on('email/sendEmailUserRestorePassword', (req: Request) => { emailController.sendEmailUserRestorePassword(req, socket)});    
    socket.on('email/sendEmailUserDelete', (req: Request) => { emailController.sendEmailUserDelete(req, socket)});
}
