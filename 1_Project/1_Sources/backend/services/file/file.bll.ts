import ControlException from '../../utils/controlException';

const fs = require('fs');
const archiver = require('archiver');

import momentTZ from 'moment-timezone';

const env = process.env.JMD_NODE_ENV || 'development';
const config = require('../../config/config')[env];

const uuid = require('uuid');
const short = require('short-uuid');

export default class FileService {
    private directory: string;
    private extValidate: string[];

    constructor(directory: string, extValidate: string[]) {
        this.directory = directory;
        this.extValidate = extValidate;
    }

    public downloadFile(folder: string, name: string) {
        const file = `${ this.directory }${ folder }/${ name }`;

        if (!fs.existsSync(file)) throw new ControlException('El archivo no ha sido encontrado', 500);

        return fs.readFileSync(file);
    }

    /**
     * Subir archivo al servidor 
     */
    public uploadFile(file: any, folder: string) {
        if (!file) throw new ControlException('No se han encontrado archivo de subida', 500);

        const splitNameFile = file.name.split('.');
        const extFile = splitNameFile[splitNameFile.length - 1];

        // Validar que el archivo tiene extensión válida
        if (this.extValidate.indexOf(extFile) < 0) {
            this.delFiles(folder);
            throw new ControlException('La extensión del archivo no es válida', 500);
        }        

        // Mover el archivo a ubicación
        const path = `${ this.directory }${ folder }`;

        // Si no existe la ubicación se crea
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }

        fs.writeFileSync(path + '/' + file.name, file.data);
    }

    /**
     * Crear un archivo con el contenido y ubicación indicados de entrada
     */
    public createFile(nameFile: string, content: string, folder: string) {
        const path = `${ this.directory }${ folder }`;

        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }

        const out = `${path}/${nameFile}`;

        // a: add; w: write; => Con 'w' sustituye lo existente, y con 'a' añade línea
        const file = fs.createWriteStream(out, {flags: 'w'});

        file.write(content);
    }

    /**
     * Crear una carpeta
     */
    public createFolder(folder: string) {
        const path = `${ this.directory }${ folder }`;

        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
    }

    /**
     * Preguntar si existe carpeta
     */
    public existsFolder(folder: string): boolean {
        const path = `${folder}`;

        if (!fs.existsSync(path)) {
            return false;
        }
        return true;
    }

    /**
     * Leer un archivo
     */
     public readFile(file: string) {        
        if (!fs.existsSync(file)) {
            return false;
        }

        const content = fs.readFileSync(file, 'utf8');
        
        return content;
    }    

    /**
     * Copiar un archivo de origen a destino     
     */
    public copyFile(fileOrigin: string, fileDestinity: string) {        
        if (!fs.existsSync(fileOrigin)) {
            return false;
        }

        fs.copyFileSync(fileOrigin, fileDestinity, (err: any) => {
            if (err) {
                return false;
            }
        });
        
        return true;
    }

    /**
     * Eliminación de todos los archivos de una carpeta
     */
    public delFiles(folder: string) {
        const path = `${ this.directory }${ folder }`;

        if (fs.existsSync(path)) {
            const files = fs.readdirSync(path);

            // Eliminación de archivos
            for (const file of files) {
                this.delFile(file, folder);
            }
    
            // Eliminación de la carpeta
            this.delFolderEmpty(folder);
        }
    }
        
    /**
     * Eliminación de un archivo
     */
    public delFile(nameFile: any, folder: string) {
        const pathAndFile = `${ this.directory }${ folder }/${ nameFile }`;

        if (fs.existsSync(pathAndFile)) {
            fs.unlinkSync(pathAndFile);
        }
    }

    /**
     * Eliminación de una carpeta
     * Nota: rmdir -> Solo elimina carpeta si está vacía, sino daría error no controlado
     */
    private delFolderEmpty(folder: string) {
        const path = `${ this.directory }${ folder }`;

        if (fs.existsSync(path)) {
            fs.rmdirSync(path);
        }
    }

    /**
     * Guardar en archivo zip todos los archivos de una carpeta
     * @param path         Directorio origen
     * @param outPath      Directorio destino     
     * @param nameFile     Nombre del archivo zip (sin .zip)
     */
    public zipFolder(path: string, outPath: string, nameFile: string) {
        if (!fs.existsSync(outPath)) {
            fs.mkdirSync(outPath, { recursive: true });
        }

        const out = `${outPath}/${nameFile}.zip`;

        const stream = fs.createWriteStream(out);  
        const archive = archiver('zip');
        // const archive = archiver('zip', { zlib: { level: 9 }});
            
        return new Promise((resolve, reject) => {
          archive
            .directory(path, false)
            .on('error', (err: any) => reject(err))
            .pipe(stream)
          ;
      
          stream.on('close', () => {
            // console.log(archive.pointer() + ' total bytes');
            // console.log('archiver has been finalized and the output file descriptor has closed.');

            resolve(true);
          });

          archive.finalize();
        });
    }

    /**
     * Escribir línea dentro de carpeta de logs para almacenar ciertas acciones no guardadas en BD
     * @param nameFile Nombre del archivo
     * @param line     Contenido de la línea a escribir
     */
    public writeLog(nameFile: string, line: string) {
        momentTZ.tz.setDefault('Europe/Madrid');

        const today = momentTZ().format('YYYY-MM-DD HH:mm:ss');

        line = today + ' - ' + line;

        const path = config.folderLogs;

        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }

        const out = `${path}/${nameFile}.log`;

        // a: add; w: write; => Con 'w' sustituye lo existente, y con 'a' añade línea
        const log_file = fs.createWriteStream(out, {flags: 'a'});

        log_file.write(line + '\n');
    }
    
    /**
     * Generar un identificador único universal de manera aleatoria
     */
    public generateIdentifier() {
        const identifier = uuid.v4();

        return identifier;
    }

    /**
     * Generar un identificador único universal de manera aleatoria con formato corto (22 caracteres)
     */
     public generateIdentifierShort() {        
        const identifier = short.generate();        

        return identifier;
    }    

}
