import ControlException from '../../utils/controlException';

const env = process.env.JMD_NODE_ENV || 'development';
const config = require('../../config/config')[env];

import FileService from '../../services/file';

const nodemailer = require("nodemailer");

export default class mailSMTPClass {
    private mailConfig: any;
    private smtpTransport: any;

    private fileService = new FileService('', []);

    constructor() { }

    public async sendMailSMTP(message: any) {
        // En entorno de pruebas
        if (process.env.JMD_NODE_ENV !== 'production') {
            message.html = `<div>Correo originalmente dirigido a ${message.to}</div> <br>${message.html}`;
            message.to = config.emailTest;            
        }
        
        this.mailConfig = {
            host: process.env.JMD_MAILER_HOST,
            port: process.env.JMD_MAILER_PORT,
            secure: false,
            auth: {
                user: process.env.YTO_MAILER_USER,
                pass: process.env.YTO_MAILER_PASSWORD
            },
            connectionTimeout: 120000
        };

        this.smtpTransport = nodemailer.createTransport(this.mailConfig);

        await this.smtpTransport.sendMail(message, (error: any) => {
            if (error) {                
                if (error.response) {
                    this.fileService.writeLog('mail', `Error. To: ${message.to}. Subject: ${message.subject}. Message: ${error.message}`);
                } else {
                    const errString = error.toString();

                    // TimeOut
                    const idx = errString.indexOf('Connection timeout');
                    if (idx >= 0) this.fileService.writeLog('mail', `Error. To: ${message.to}. Subject: ${message.subject}. Message: Connection timeout` ); 

                    this.retrySendMail(this.mailConfig, message);
                }
            } else {
                this.fileService.writeLog('mail', `Success. To: ${message.to}. Subject: ${message.subject}`);
            }
        });
    }

    /**
     * Reintento de envío de email
     * @param mailConfig 
     * @param message 
     */
    public async retrySendMail(mailConfig: any, message: any) {
        this.mailConfig.connectionTimeout = 180000;
        this.smtpTransport = nodemailer.createTransport(mailConfig, message);

        await this.smtpTransport.sendMail(message, (error: any) => {
            if (error) {
                if (error.response) {
                    this.fileService.writeLog('mail', `Error Retry. To: ${message.to}. Subject: ${message.subject}. Message: ${error.message}`);                    
                } else {
                    const errString = error.toString();

                    // TimeOut
                    const idx = errString.indexOf('Connection timeout');
                    if (idx >= 0) this.fileService.writeLog('mail', `Error Retry. To: ${message.to}. Subject: ${message.subject}. Message: Connection timeout` );                    
                }                               
            } else {
                this.fileService.writeLog('mail', `Success. To: ${message.to}. Subject: ${message.subject}`);
            }
        });
    }

}
