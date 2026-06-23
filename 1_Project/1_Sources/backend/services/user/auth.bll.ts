import ControlException from '../../utils/controlException';
import SecurityLogger from '../../utils/securityLogger';

import UsersDAL from './users.dal';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

import momentTZ from 'moment-timezone';
import moment from 'moment';

// Tiempo de expiración del token de recuperación en milisegundos (1 hora)
const RECOVERY_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

export default class AuthService {
    private usersDAL = new UsersDAL();

    constructor() {}

    private getTokenPayload(user: any) {
        return {
            user: {
                id: user.id,
                username: user.username,
                role_id: user.role_id,
            },
        };
    }

    public async login(userName: string, password: string, t: any, ip: string = 'unknown') {

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
                // La cuenta sigue bloqueada — registrar el intento mientras está activo el bloqueo
                SecurityLogger.logAccountLocked(ip, user.username);
                throw new ControlException(`El usuario está bloqueado durante un minuto por superar el número máximo de intentos fallidos (${diff} sg pendientes)`, 403);
            }   

            user.attempts = 0;
            await this.usersDAL.editUser(user, t);       
        }
        
        user.attempts ++;
        await this.usersDAL.editUser(user, t);
    
        // Verificar la contraseña
        if (!bcrypt.compareSync(password, user.password)) {
            SecurityLogger.logFailedLogin(ip, user.username, 'Contraseña incorrecta');
            // Registrar el bloqueo en el momento exacto en que se alcanza el límite de intentos
            if (user.attempts >= 3) {
                SecurityLogger.logAccountLocked(ip, user.username);
            }
            throw new ControlException('La contraseña no es correcta', 403);
        }

        user.attempts = 0;
        await this.usersDAL.editUser(user, t);
    
        // // Quitar contraseña de objeto de salida
        user.password = undefined;
    
        // Crear token: objeto, contraseña secreta general de encriptación, tiempo de expiración
        var token = jwt.sign(this.getTokenPayload(user), process.env.YTO_SEED, { expiresIn: process.env.YTO_EXPIRATION_TOKEN });
        SecurityLogger.logSuccessfulLogin(ip, user.username);
    
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

        var token = jwt.sign(this.getTokenPayload(user), process.env.YTO_SEED, { expiresIn: process.env.YTO_EXPIRATION_TOKEN });

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
    public async recoveryToken(req: any, ip: string = 'unknown') {
        // Incluir jti único para garantizar tokens distintos aunque se generen en el mismo segundo
        const payload = {
            ...this.getTokenPayload(req.user),
            jti: crypto.randomBytes(16).toString('hex'),
        };
        const token = jwt.sign(payload, process.env.YTO_SEED, { expiresIn: process.env.YTO_EXPIRATION_TOKEN_RECOVERY });

        // Guardar el hash SHA-256 del token en BD (invalida cualquier token anterior)
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await this.usersDAL.saveRecoveryToken(req.user.id, tokenHash, new Date());

        SecurityLogger.logPasswordRecoveryRequested(ip, req.user.username);

        return token;
    }

    // =====================================
    // Validar token de recuperación contra el hash almacenado en BD
    // =====================================
    public async validateRecoveryToken(userId: number, token: string): Promise<void> {
        const tokenData = await this.usersDAL.getRecoveryTokenData(userId);

        if (!tokenData || !tokenData.hash) {
            throw new ControlException('El enlace de recuperación no es válido', 401);
        }

        // Comparar hash
        const incomingHash = crypto.createHash('sha256').update(token).digest('hex');
        if (incomingHash !== tokenData.hash) {
            throw new ControlException('El enlace de recuperación no es válido', 401);
        }

        // Verificar expiración (1 hora)
        const createdAt = new Date(tokenData.createdAt).getTime();
        if (Date.now() - createdAt > RECOVERY_TOKEN_EXPIRY_MS) {
            throw new ControlException('El enlace de recuperación ya ha expirado', 401);
        }
    }

    // =====================================
    // Consumir (invalidar) el token de recuperación tras cambio exitoso
    // =====================================
    public async consumeRecoveryToken(userId: number, username: string = '', ip: string = 'unknown'): Promise<void> {
        await this.usersDAL.clearRecoveryToken(userId);
        SecurityLogger.logPasswordRecoveryCompleted(ip, username);
    }

}
