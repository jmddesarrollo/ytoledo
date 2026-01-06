import ControlException from '../../utils/controlException';

// EMAIL
import mailSMTPClass from '../../server/mail/sendSMTP.mail';
const env = process.env.JMD_NODE_ENV || 'development';
const config = require('../../config/config')[env];
const path = require('path');
//

const fs = require('fs');
const signatureFile = `./files/templates/signature.html`;
const signatureHTML = fs.readFileSync(signatureFile);

export default class EmailService {

    constructor() { }

    /**
     * Envio de email al usuario en su alta
     */
    public async sendEmailUserAdd(user: any, role: any) {
        const mailSMTP = new mailSMTPClass();

        const route = config.url;

        const dirLogo = path.resolve('./files/images/logo_YToledo.png');
        const dirLogoGreen = path.resolve('./files/images/logo_green.jpg');

        let plus = `<div>Puedes usar este enlace para generar tu contraseña: </div>`;
        if (user.active) {
            plus = `<div>Inicialmente tu usuario se ha definido deshabilitado. Cuando se encuentre habilitado podrás usar este enlace para generar tu contraseña: </div>`
        }

        let message = {
            from: process.env.JMD_MAILER_USER,
            to: user.email,
            subject: '[YToledo - Club de Senderismo] Alta de usuario',
            html: `
            <div>
                <div>Se ha dado de alta una cuenta de usuario vinculada a tu email en la aplicación de <a href="${config.url}">"Club YToledo de Senderismo"</a>. </div>
                <div>La cuenta creada tiene la siguiente información: </div>
                <table style="width:90%; margin-left: 30px;">
                    <tr>
                      <td style="width:100px;">Usuario</td>
                      <td>${user.username}</td>
                    </tr>
                    <tr>
                      <td style="width:100px;">Nombre</td>
                      <td>${user.name}</td>                      
                    </tr>
                    <tr>
                      <td style="width:100px;">Apellido</td>
                      <td>${user.lastname}</td>                      
                    </tr>   
                    <tr>
                      <td style="width:100px;">Email</td>
                      <td>${user.email}</td>                      
                    </tr>   
                    <tr>
                      <td style="width:100px;">Socio</td>
                      <td>${user.member_num}</td>                      
                    </tr>                     
                    <tr>
                      <td style="width:100px;">Rol</td>
                      <td>${role.name}</td>                      
                    </tr>                                                          
                </table>
                <br>
                ${plus}
                <div><a href="${route}/login">${route}/login</a></div>
                <div>Para ello has de introducir tu usuario o email, y posteriormente solicitar "Regenerar contraseña".</div>
                <div>La propia aplicación te enviará otro email con el procedimiento de regeneración de la contraseña.</div>
                <br>                        
            </div>
            ${signatureHTML}
            `,
            attachments: [{
                filename: 'logo_YToledo.png',
                path: dirLogo,
                cid: 'logo'
            },
            {
                filename: 'logo_green.jpg',
                path: dirLogoGreen,
                cid: 'green'
            }]
        }

        await mailSMTP.sendMailSMTP(message);
    }

    /**
     * Envio de email al usuario en su edición
     */
     public async sendEmailUserEdit(user: any, role: any) {
        const mailSMTP = new mailSMTPClass();        

        const dirLogo = path.resolve('./files/images/logo_YToledo.png');
        const dirLogoGreen = path.resolve('./files/images/logo_green.jpg');

        let message = {
            from: process.env.JMD_MAILER_USER,
            to: user.email,
            subject: '[YToledo - Club de Senderismo] Edición de usuario',
            html: `
            <div>
                <div>Se ha editado la cuenta de usuario vinculada a tu email en la aplicación de <a href="${config.url}">"Club YToledo de Senderismo"</a>. </div>
                <div>La cuenta editada tiene la siguiente información: </div>
                <table style="width:90%; margin-left: 30px;">
                    <tr>
                      <td style="width:100px;">Usuario</td>
                      <td>${user.username}</td>
                    </tr>
                    <tr>
                      <td style="width:100px;">Nombre</td>
                      <td>${user.name}</td>                      
                    </tr>
                    <tr>
                      <td style="width:100px;">Apellido</td>
                      <td>${user.lastname}</td>                      
                    </tr>   
                    <tr>
                      <td style="width:100px;">Email</td>
                      <td>${user.email}</td>                      
                    </tr>
                    <tr>
                      <td style="width:100px;">Socio</td>
                      <td>${user.member_num}</td>                      
                    </tr>                        
                    <tr>
                      <td style="width:100px;">Rol</td>
                      <td>${role.name}</td>                      
                    </tr>                                                          
                </table>
                <br>                        
            </div>
            ${signatureHTML}
            `,
            attachments: [{
                filename: 'logo_YToledo.png',
                path: dirLogo,
                cid: 'logo'
            },
            {
                filename: 'logo_green.jpg',
                path: dirLogoGreen,
                cid: 'green'
            }]
        }

        await mailSMTP.sendMailSMTP(message);
    }

    /**
     * Envio de email al usuario en su edición de email
     */
     public async sendEmailUserEditEmail(user: any) {
        const mailSMTP = new mailSMTPClass();        
    
        const dirLogo = path.resolve('./files/images/logo_YToledo.png');
        const dirLogoGreen = path.resolve('./files/images/logo_green.jpg');
    
        let message = {
            from: process.env.JMD_MAILER_USER,
            to: user.email,
            subject: '[YToledo - Club de Senderismo] Email desvinculado',
            html: `
            <div>
                <div>Se ha desvinculado tu email en la cuenta de usuario de la aplicación de <a href="${config.url}">"Club YToledo de Senderismo"</a>. </div>
                <br>                        
            </div>
            ${signatureHTML}
            `,
            attachments: [{
                filename: 'logo_YToledo.png',
                path: dirLogo,
                cid: 'logo'
            },
            {
                filename: 'logo_green.jpg',
                path: dirLogoGreen,
                cid: 'green'
            }]
        }
    
        await mailSMTP.sendMailSMTP(message);
    }    
    
    /**
     * Envio de email al usuario en su edición de email
     */
     public async sendEmailUserEditActivate(user: any) {
        const mailSMTP = new mailSMTPClass();        
    
        const dirLogo = path.resolve('./files/images/logo_YToledo.png');
        const dirLogoGreen = path.resolve('./files/images/logo_green.jpg');

        let text = "activado";
        if (!user.active) text = 'desactivado'; 
    
        let message = {
            from: process.env.JMD_MAILER_USER,
            to: user.email,
            subject: `[YToledo - Club de Senderismo] Usuario ${text}`,
            html: `
            <div>
                <div>Se ha ${text} tu usuario en la aplicación de <a href="${config.url}">"Club YToledo de Senderismo"</a>. </div>
                <br>                        
            </div>
            ${signatureHTML}
            `,
            attachments: [{
                filename: 'logo_YToledo.png',
                path: dirLogo,
                cid: 'logo'
            },
            {
                filename: 'logo_green.jpg',
                path: dirLogoGreen,
                cid: 'green'
            }]
        }
    
        await mailSMTP.sendMailSMTP(message);
    }     

    /**
     * Envio de email al usuario en su edición de contraseña
     */
     public async sendEmailUserEditPassword(user: any) {
        const mailSMTP = new mailSMTPClass();        
    
        const dirLogo = path.resolve('./files/images/logo_YToledo.png');
        const dirLogoGreen = path.resolve('./files/images/logo_green.jpg');
    
        let message = {
            from: process.env.JMD_MAILER_USER,
            to: user.email,
            subject: '[YToledo - Club de Senderismo] Edición de contraseña',
            html: `
            <div>
                <div>Se ha editado desde tu cuenta la contraseña vinculada a tu email en la aplicación de <a href="${config.url}">"Club YToledo de Senderismo"</a>. </div>
                <br>                        
            </div>
            ${signatureHTML}
            `,
            attachments: [{
                filename: 'logo_YToledo.png',
                path: dirLogo,
                cid: 'logo'
            },
            {
                filename: 'logo_green.jpg',
                path: dirLogoGreen,
                cid: 'green'
            }]
        }
    
        await mailSMTP.sendMailSMTP(message);
    }    

/**
     * Envio de email al usuario en su restauración de contraseña
     */
 public async sendEmailUserRestorePassword(user: any) {
    const mailSMTP = new mailSMTPClass();        

    const route = config.url;
    const dirLogo = path.resolve('./files/images/logo_YToledo.png');
    const dirLogoGreen = path.resolve('./files/images/logo_green.jpg');

    let plus = `<div>Puedes usar este enlace para generar tu contraseña: </div>`;
    if (!user.active) {
        plus = `<div>En estos momentos tu usuario está deshabilitado. Cuando se encuentre habilitado podrás usar este enlace para generar tu contraseña: </div>`
    }

    let message = {
        from: process.env.JMD_MAILER_USER,
        to: user.email,
        subject: '[YToledo - Club de Senderismo] Restauración de contraseña',
        html: `
        <div>
        <div>Un usuario con permisos ha restaurado la contraseña vinculada a tu email en la aplicación de <a href="${config.url}">"Club YToledo de Senderismo"</a>. </div>
        <div>La contraseña generada es aleatoria.</div>
        <br>                        
        </div>
        ${plus}
        <div><a href="${route}/login">${route}/login</a></div>
        <div>Para ello has de introducir tu usuario o email, y posteriormente solicitar "Regenerar contraseña".</div>
        <div>La propia aplicación te enviará otro email con el procedimiento de regeneración de la contraseña.</div>
        <br>
        ${signatureHTML}
        `,
        attachments: [{
            filename: 'logo_YToledo.png',
            path: dirLogo,
            cid: 'logo'
        },
        {
            filename: 'logo_green.jpg',
            path: dirLogoGreen,
            cid: 'green'
        }]
    }

    await mailSMTP.sendMailSMTP(message);
}     

    /**
     * Envio de email al usuario en su edición
     */
     public async sendEmailUserDelete(user: any) {
        const mailSMTP = new mailSMTPClass();        

        const dirLogo = path.resolve('./files/images/logo_YToledo.png');
        const dirLogoGreen = path.resolve('./files/images/logo_green.jpg');

        let message = {
            from: process.env.JMD_MAILER_USER,
            to: user.email,
            subject: '[YToledo - Club de Senderismo] Eliminación de usuario',
            html: `
            <div>
                <div>Se ha eliminado la cuenta de usuario vinculada a tu email en la aplicación de <a href="${config.url}">"Club YToledo de Senderismo"</a>. </div>
                <br>                        
            </div>
            ${signatureHTML}
            `,
            attachments: [{
                filename: 'logo_YToledo.png',
                path: dirLogo,
                cid: 'logo'
            },
            {
                filename: 'logo_green.jpg',
                path: dirLogoGreen,
                cid: 'green'
            }]
        }

        await mailSMTP.sendMailSMTP(message);
    }    

}
