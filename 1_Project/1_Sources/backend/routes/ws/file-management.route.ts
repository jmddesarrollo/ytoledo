import { Socket } from 'socket.io';

import { FileManagementController } from '../../controllers/ws/file-management.controller';

export const FileManagementRoutes = (socket: Socket) => {

    const fileManagementController = new FileManagementController();        
    
    socket.on('fileManagement/getAttachedFiles', (req: Request) => { 
        fileManagementController.getAttachedFiles(req, socket);
    });
    
    socket.on('fileManagement/getRoutesWithFiles', (req: Request) => { 
        fileManagementController.getRoutesWithFiles(req, socket);
    });
    
    socket.on('fileManagement/deleteAttachedFiles', (req: Request) => { 
        fileManagementController.deleteAttachedFiles(req, socket);
    });
    
    socket.on('fileManagement/deleteAttachedFile', (req: Request) => { 
        fileManagementController.deleteAttachedFile(req, socket);
    });
    
    socket.on('fileManagement/getAttachedFile', (req: Request) => { 
        fileManagementController.getAttachedFile(req, socket);
    });
    
    socket.on('fileAttachment/downloadAttachedFile', (req: Request) => { 
        fileManagementController.downloadAttachedFile(req, socket);
    });
}