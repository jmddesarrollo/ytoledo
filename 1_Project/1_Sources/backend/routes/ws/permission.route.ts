import { Socket } from 'socket.io';

import PermissionController from '../../controllers/ws/permission.controller';

export const PermissionRoutes = (socket: Socket) => {
    const permissionController = new PermissionController();
    
    socket.on('permission/getPermissions', (req: Request) => { permissionController.getPermissions(req, socket)});
    socket.on('permission/getPermissionsHasRoles', (req: Request) => { permissionController.getPermissionsHasRoles(req, socket)}); 
    socket.on('permission/getMyPermissionsHasRoles', (req: Request) => { permissionController.getMyPermissionsHasRoles(req, socket)});        
    socket.on('permission/addPermission', (req: Request) => { permissionController.addPermission(req, socket)});  
    socket.on('permission/delPermission', (req: Request) => { permissionController.delPermission(req, socket)});  
}
