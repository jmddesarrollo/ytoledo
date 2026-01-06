import ControlException from '../../utils/controlException';

const bcrypt = require('bcrypt');
const saltRounds = 10;

import UsersDAL from './users.dal';

const env = process.env.JMD_NODE_ENV || 'development';
const config = require('../../config/config')[env];
//

export default class UsersService {
    private usersDAL = new UsersDAL();

    constructor() { }

    /**
     * Consulta de todos los usuarios
     */
    public async getUsers() {
        const users = await this.usersDAL.getUsers();

        for (const user of users) {
            user.password = '';
        }

        return users;
    }

    /**
     * Consulta de un usuario
     */
    public async getUser(id: number) {
        const user = await this.usersDAL.getUser(id);

        return user;
    }

    /**
     * Consulta de un usuario por su nombre de usuario o email
     */
    public async getUserByNameOrEmail(nameOrEmail: string) {
        const user = await this.usersDAL.getUserByNameOrEmail(nameOrEmail);

        if (user) user.password = '';

        return user;
    }

    /**
     * Alta de un usuario
     */
    public async addUser(user: any, t: any) {
        const randomPass = this.generatePasswordRandom();
        user.password = randomPass;

        const passwordNew = bcrypt.hashSync(user.password, saltRounds);
        user.password = passwordNew;

        const userDb = await this.usersDAL.addUser(user, t);

        userDb.password = '';

        return userDb;
    }

    /**
     * Editar un usuario
     */
    public async editUser(user: any, t: any) {
        const userDB = await this.getUser(user.id);

        if (!userDB) throw new ControlException('El usuario no ha sido encontrado', 412);

        userDB.name = user.name;
        userDB.lastname = user.lastname;
        userDB.email = user.email;
        userDB.username = user.username;
        userDB.member_num = user.member_num;
        userDB.active = user.active;
        userDB.role_id = user.role_id;

        const userOut = await this.usersDAL.editUser(userDB, t);

        userOut.password = '';

        return userOut;
    }

    /**
     * Editar contraseña de un usuario
     */
    public async editPasswordUser(user: any, t: any) {
        const userDB = await this.getUser(user.id);

        if (!userDB) throw new ControlException('El usuario no ha sido encontrado', 412);        

        const regexp = new RegExp(/^(?=.*[0-9])(?=.*[A-ZÑ])(?=.*[a-zñ])(?=.*[$€#%&_-])\S{6,15}$/);
        if (!user.password.match(regexp)) { throw new ControlException('El formato de la contraseña es incorrecto', 412); }

        const passwordNew = bcrypt.hashSync(user.password, saltRounds);
        userDB.password = passwordNew;

        const userOut = await this.usersDAL.editUser(userDB, t);

        userOut.password = '';

        return userOut;
    }

    /**
     * Eliminar de un usuario
     */
    public async delUser(userId: number, t: any) {
        const userDB = await this.getUser(userId);

        if (!userDB) throw new ControlException('El usuario no ha sido encontrado', 412);

        await this.usersDAL.delUser(userId, t);

        return true;
    }

    /**
     * Validaciones al editar usuarios por defecto
     */
    public async validateEditUserDefault(user: any, tokenDecoded: any) {
        const admin = await this.getUser(config.userIdAdmin);

        if (tokenDecoded.user.id !== config.userIdAdmin) {
            if (user.id === config.userIdAdmin) {
                throw new ControlException(`El usuario por defecto '${admin.username}' solo está permitido editar por el usuario '${admin.username}'`, 500);
            }
        }

        if (user.id === config.userIdAdmin) {
            if (user.role_id !== config.roleAdmin) {
                throw new ControlException(`No está permitido que el usuario por defecto '${admin.username}' deje de tener permisos de administración global de la aplicación`, 500);
            }

            if (!user.active) {
                throw new ControlException(`No está permitido que el usuario por defecto '${admin.username}' deje de estar activo`, 500);
            }
        }
    }

    /**
     * Validaciones al editar contraseña de usuarios por defecto
     */
    public async validateEditPasswordUserDefault(user: any, tokenDecoded: any) {

        if (tokenDecoded.user.id !== config.userIdAdmin) {
            const admin = await this.getUser(config.userIdAdmin);

            if (user.id === config.userIdAdmin) {
                throw new ControlException(`La contraseña del usuario por defecto '${admin.username}' solo está permitido editar por el usuario '${admin.username}'`, 500);
            }
        }

    }

    /**
     * Validaciones al editar contraseña de usuarios por defecto
     */
    public async validateDeleteUserDefault(userId: number) {
        if (userId === config.userIdAdmin) {
            const admin = await this.getUser(config.userIdAdmin);
            throw new ControlException(`No se permite eliminar al usuario por defecto '${admin.username}'`, 500);
        }
    } 

    /**
     * Generar una contraseña aleatoria. Se añaden al final caracteres obligatorios para cumplir estándar    
     */
    public generatePasswordRandom() {
        const randomPass = Math.random().toString(36).substring(7) + 'zZ0€';
        return randomPass;
    }

}
