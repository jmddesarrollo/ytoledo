import { Socket } from 'socket.io';

import FileController from '../../controllers/ws/file.controller';

export const FileRoutes = (socket: Socket) => {
    const fileController = new FileController();
    
    socket.on('file/download', (req: Request) => { fileController.downloadFile(req, socket)});
    socket.on('file/upload', (req: Request) => { fileController.uploadFiles(req, socket)});
    socket.on('file/delete', (req: Request) => { fileController.delFiles(req, socket)});
}
