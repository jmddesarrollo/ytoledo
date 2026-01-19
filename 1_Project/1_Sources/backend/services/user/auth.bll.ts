import ControlException from '../../utils/controlException';

import UsersDAL from './users.dal';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

import momentTZ from 'moment-timezone';
import moment from 'moment';

export default class AuthService {
    private usersDAL = new UsersDAL();

    constructor() {}

    public async login(userName: string, password: string, t: any) {

        if (!userName) { throw new ControlException('El nombre de usuario no puede estar vacío', 402); }
        if (!password) { throw new ControlException('La contraseña no puede estar vacía', 402); }
        
        const user = await this.usersDAL.getUserByNameOrEmail(userName);            
    
        // Verificar usuario
        if (!user) { throw new ControlException('El usuario no está registrado', 403); }
        if (!user.active) { throw new ControlException('El usuario está deshabilitado', 403); }

        // Al superar los tres intentos de acceso incorrectamente
        if (user.attempts >= 3) {
            momentTZ.tz.setDefault('Europe/Madrid');
            const today = momentTZ().format('YYYY-MM-DD HH:mm:ss');
            const dateMin = moment(today).subtract(1, 'minute').format('YYYY-MM-DD HH:mm:ss');

            const diff = moment(user.updatedAt).unix() - moment(dateMin).unix();
        
            if (diff > 0) {
                throw new ControlException(`El usuario está bloqueado durante un minuto por superar el número máximo de intentos fallidos (${diff} sg pendientes)`, 403);
            }   

            user.attempts = 0;
            await this.usersDAL.editUser(user, t);       
        }
        
        user.attempts ++;
        await this.usersDAL.editUser(user, t);
    
        // Verificar la contraseña
        if (!bcrypt.compareSync(password, user.password)) { throw new ControlException('La contraseña no es correcta', 403); }

        user.attempts = 0;
        await this.usersDAL.editUser(user, t);
    
        // // Quitar contraseña de objeto de salida
        user.password = undefined;
    
        // Crear token: objeto, contraseña secreta general de encriptación, tiempo de expiración
        var token = jwt.sign({ user }, process.env.YTO_SEED, { expiresIn: process.env.YTO_EXPIRATION_TOKEN });
    
        let data = new Object;
        data = {
            user,
            token
        }        
    
        return data;
    }
    
    // =====================================
    // Renovar el token
    // =====================================
    public async renewToken(req: any) {
        const user = await this.usersDAL.getUser(req.user.id); 
        user.password = undefined;

        var token = jwt.sign({ user }, process.env.YTO_SEED, { expiresIn: process.env.YTO_EXPIRATION_TOKEN });

        let data = new Object;
        data = {
            user,
            token
        }
    
        return data;
    }

    // =====================================
    // Token para recuperar contraseña
    // =====================================
    public recoveryToken(req: any) {
        var token = jwt.sign({ user: req.user }, process.env.YTO_SEED, { expiresIn: process.env.YTO_EXPIRATION_TOKEN_RECOVERY });
    
        return token;
    }

}