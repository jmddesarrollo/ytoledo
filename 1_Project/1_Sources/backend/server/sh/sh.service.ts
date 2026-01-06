// const { spawn, exec } = require('child_process');
import ControlException from '../../utils/controlException';

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const env = process.env.LM_NODE_ENV || 'development';
const config = require('../../config/config')[env];

import FileService from '../../services/file';

export default class ShService {
    private fileService = new FileService('', []);

    private nameFile = 'licenses';    

    constructor() {}

    /**
     * Firmar con clave privada un conjunto de datos, donde previamente son convertidos a un hash
     */
     public async signData(folder: string) {
        //  Example: `sudo openssl dgst -sign key.pem -keyform PEM -sha256 -out dataSHA256.sign -binary data.json`
                
        // console.log(`sh ${config.folderSH}os_sign.sh ${config.folderKeys}${config.ownerPrivateKey} ${folder}`);
        await exec(`sh ${config.folderSH}os_sign.sh ${config.folderKeys}${config.ownerPrivateKey} ${folder}`);

        const result: string = this.fileService.readFile(`${folder}/resultSign.dat`);

        return result;

        // Parece que Node 10.X no puede ejecutar este comando directamente. Según investigación apunta por la versión OpenSSL en el servidor que es "1.0.1f" y se recomienda al menos "1.0.2"
        // console.log(`sudo openssl dgst -sign ${config.folderKeys}${config.ownerPrivateKey}/key.pem -keyform PEM -sha256 -out ${folder}dataSHA256.sign -binary ${folder}data.json`);
        // const { stderr, stdout } = await exec(`sudo openssl dgst -sign ${config.folderKeys}${config.ownerPrivateKey}key.pem -keyform PEM -sha256 -out ${folder}dataSHA256.sign -binary ${folder}data.json`);

        // if (stderr) {
        //     this.fileService.writeLog(this.nameFile, `Entidad: ${config.ownerPrivateKey}. Error al generar la firma. Error: ${stderr}`);
        //     // console.log(`stderr: ${stderr}`);
        //     return;
        // }

        // return stdout;        
    }    

    /**
     * Verificar firma     
     */
    public async verifySign(folder: string, clientName: string) {
        let response: any = {
            result: true,
            message: null
        }
        //  Example: `sudo openssl dgst -verify key.public.pem -keyform PEM -sha256 -signature data.sign -binary data.json`

        // console.log(`sh ${config.folderSH}os_verify.sh ${config.folderKeys}${clientName} ${folder}`);
        const result = await exec(`sh ${config.folderSH}os_verify.sh ${config.folderKeys}${clientName} ${folder}`);
        if (!result) { 
            response.result = false;
            response.message = 'Ha ocurrido un error al verificar la firma';
        }

        const stderr = result.stderr;
        const stdout = result.stdout;
        if (!stdout || stderr ) {
            response.result = false;
            response.message = 'Ha ocurrido un error al verificar la firma';
        }

        const idx = stdout.indexOf('Verified OK');
        if (idx < 0)  {
            response.result = false;
            response.message = 'Verificación de la firma insatisfactoria';
        }

        return response;


        // Parece que Node 10.X no puede ejecutar este comando directamente. Según investigación apunta por la versión OpenSSL en el servidor que es "1.0.1f" y se recomienda al menos "1.0.2"
        // const { stderr, stdout } = await exec(`sudo openssl dgst -verify ${config.folderKeys}${clientName}/key.public.pem -keyform PEM -sha256 -signature ${folder}dataSHA256.sign -binary ${folder}data.json`);

        // if (stderr) {
        //     this.fileService.writeLog(this.nameFile, `Entidad: ${clientName}. Error al verificar la firma. Error: ${stderr}`);
        //     // console.log(`stderr: ${stderr}`);
        //     return;
        // }

        // return stdout;
    }

    /**
     * Convertir el fichero firmado a formato base64 
     */
     public async convertBase64(folder: string, clientName: string) {
        //  Example: `sudo openssl base64 -in datasSHA256.sign -out dataB64.sign`
       
        await exec(`sh ${config.folderSH}os_base64Conv.sh ${folder}`);

        return true;        

        // Parece que Node 10.X no puede ejecutar este comando directamente. Según investigación apunta por la versión OpenSSL en el servidor que es "1.0.1f" y se recomienda al menos "1.0.2"
        // const { stderr, stdout } = await exec(`sudo openssl base64 -in ${folder}dataSHA256.sign -out ${folder}dataB64.sign`);

        // if (stderr) {
        //     this.fileService.writeLog(this.nameFile, `Entidad: ${clientName}. Error al convertir la firma en formato Base64. Error: ${stderr}`);
        //     // console.log(`stderr: ${stderr}`);
        //     return;
        // }

        // return stdout;
    }

    /**
     * Desconvertir el fichero en formato Base64 a un fichero firmado con clave privada
     */
     public async desconvertBase64(folder: string, clientName: string) {
        //  Example: `sudo openssl base64 -d -in dataB64.sign -out dataSHA256.sign`

        await exec(`sh ${config.folderSH}os_base64Desc.sh ${folder}`);

        return true;          
        
        // Parece que Node 10.X no puede ejecutar este comando directamente. Según investigación apunta por la versión OpenSSL en el servidor que es "1.0.1f" y se recomienda al menos "1.0.2"
        // const { stderr, stdout } = await exec(`sudo openssl base64 -d -in ${folder}dataB64.sign -out ${folder}dataSHA256.sign`);

        // if (stderr) {
        //     this.fileService.writeLog(this.nameFile, `Entidad: ${clientName}. Error al desconvertir fichero con formato Base64. Error: ${stderr}`);
        //     // console.log(`stderr: ${stderr}`);
        //     return;
        // }

        // return stdout;
    }
    /**
     * #30000
     * Restaurar el servicio de la aplicación
     */
    public async execRestartService() {
        let serviceName = `${process.env.LM_SERVICE_NAME}${process.env.LM_SERVER_PORT}`;

        // En entorno de Producción el servicio no tiene el puerto en el nombre
        if (process.env.LM_NODE_ENV === 'production') {
            serviceName = `${process.env.LM_SERVICE_NAME}`
        } 

        const { stderr, stdout } = await exec(`pm2 restart ${serviceName}`);

        if (stderr) {
            this.fileService.writeLog(this.nameFile, `Fallo al restaurar el servicio`);
            return;
        }

        return stdout;
    }

}
