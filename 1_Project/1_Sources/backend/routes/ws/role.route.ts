import { Socket } from 'socket.io';

import RoleController from '../../controllers/ws/role.controller';

export const RoleRoutes = (socket: Socket) => {
    const roleController = new RoleController();
    
    socket.on('role/getRoles', (req: Request) => { roleController.getRoles(req, socket)});
    socket.on('role/addRole', (req: Request) => { roleController.addRole(req, socket)});
    socket.on('role/editRole', (req: Request) => { roleController.editRole(req, socket)});
    socket.on('role/delRole', (req: Request) => { roleController.delRole(req, socket)});
}
