import { Socket } from "socket.io";

import ControlException from "../../utils/controlException";
import FileService from "../../services/file";

import AuthorizedMiddleware from "../../server/middlewares/authorized.middleware";

const env = process.env.JMD_NODE_ENV || "development";
const config = require("../../config/config")[env];

export default class FileController {
  private folderFiles: string;
  private extValidate: string[];
  private fileService: any;
  private AuthorizedMiddleware: any;

  private permissionType: string;
  private mode: string;

  constructor() {
    this.folderFiles = config.folderFiles;
    this.permissionType = config.permission_files_manager;
    this.mode = "reading";
    this.extValidate = ["jpg", "jpeg", "JPG", "JPEG", "png", "ico", "PNG", "ICO", "zip"];

    this.fileService = new FileService(this.folderFiles, this.extValidate);
    this.AuthorizedMiddleware = new AuthorizedMiddleware();
  }

  /**
   * Subida de archivos
   */
  public async uploadFiles(req: any, socket: Socket) {
    const files: any = req.files;

    try {
      this.mode = "writing";

      const tokenDecoded = this.AuthorizedMiddleware.checkToken( req.token, socket );
      await this.AuthorizedMiddleware.isAllowed( tokenDecoded, this.permissionType, this.mode, socket );

      const identifier = this.fileService.generateIdentifier();

      for (const file of files) {
        this.fileService.uploadFile(file, identifier);
      }

      if (files.length > 1) {
        const folder = `${this.folderFiles}/${identifier}`;
        const outPath = `${this.folderFiles}/zip/${identifier}`;
        const nameFile = "lotes";
        this.fileService.zipFolder(folder, outPath, nameFile);
      }

      socket.emit("file/upload", { files, identifier, message: "El archivo ha subido correctamente" });
    } catch (error) {
      if (error instanceof ControlException) {
        socket.emit("error_message", { message: error.message, code: error.code });
      } else {
        socket.emit("error_message", { message: "Error no controlado" });
      }
    }
  }

  /**
   * Descargar archivos de licencias
   */
  public async downloadFile(req: any, socket: Socket) {
    const identifier: number = req.identifier;
    let name: string = req.name;
    const unique: boolean = req.unique;
    const productName: string = req.productName;

    try {
      this.mode = "writing";

      const tokenDecoded = this.AuthorizedMiddleware.checkToken( req.token, socket );
      await this.AuthorizedMiddleware.isAllowed( tokenDecoded, this.permissionType, this.mode, socket );

      let nameComplete = `${name}.lic`;
      let path: string = identifier.toString();
      if (!unique) {
        nameComplete = `${config.nameFileZIP}.zip`;
        path = `zip/${identifier}`;

        name = config.nameFileZIP;
      }

      const file = this.fileService.downloadFile(path, nameComplete);

      this.fileService.writeLog( productName, `Descarga de archivo ${name} con identificador ${identifier} por usuario ${tokenDecoded.user.username} (${tokenDecoded.user.id})` );

      socket.emit("file/download", { file, name: nameComplete, message: "El archivo de licencia se ha generado correctamente" });
    } catch (error) {
      if (error instanceof ControlException) { socket.emit("error_message", { message: error.message, code: error.code });
      } else {
        socket.emit("error_message", { message: "Error no controlado" });
      }
    }
  }

  /**
   * Eliminación de archivos
   */
  public async delFiles(req: any, socket: Socket) {
    const identifier: number = req.identifier;

    try {
      this.mode = "writing";

      const tokenDecoded = this.AuthorizedMiddleware.checkToken( req.token, socket );
      await this.AuthorizedMiddleware.isAllowed( tokenDecoded, this.permissionType, this.mode, socket );

      // Elimina todos los archivos y la carpeta
      this.fileService.delFiles(identifier);
      // Eliminar archivo zip y carpeta
      this.fileService.delFiles(`zip/${identifier}`);

      socket.emit("file/delete", { identifier, message: "El archivo ha sido eliminado correctamente" });
    } catch (error) {
      if (error instanceof ControlException) { socket.emit("error_message", { message: error.message, code: error.code });
      } else {
        socket.emit("error_message", { message: "Error no controlado" });
      }
    }
  }
}
