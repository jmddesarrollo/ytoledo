import { Socket } from 'socket.io';

import { UsersController } from '../../controllers/ws/user.controller';

export const UserRoutes = (socket: Socket) => {
    const userController = new UsersController();        
    
    socket.on('user/getUsers', (req: Request) => { userController.getUsers(req, socket)});
    socket.on('user/getUser', (req: Request) => { userController.getUser(req, socket)});    
    socket.on('user/addUser', (req: Request) => { userController.addUser(req, socket)});
    socket.on('user/editUser', (req: Request) => { userController.editUser(req, socket)});
    socket.on('user/editPasswordUser', (req: Request) => { userController.editPasswordUser(req, socket)});
    socket.on('user/delUser', (req: Request) => { userController.delUser(req, socket)});
}
