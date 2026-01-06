import ControlException from '../utils/controlException';

module.exports = (sequelize: any, DataTypes: any) => {
    var Users = sequelize.define('users', {
        id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: '',
            validate: {
                validateCustom: (value:any) => {
                    if (!value) { throw new ControlException('El nombre debe estar informado', 500); }

                    value = value.trim();
                    if (value.length < 1) { throw new ControlException('El nombre debe estar informado', 500); }
                    if (value.length > 100) { throw new ControlException('El nombre no debe superar los 45 caracteres', 500); }

                    const regexp = new RegExp('^([A-Za-zñÑÁÉÍÓÚÄËÏÖÜáéíóúäëïöüÇç&\'._-]+[\\s]*)+$');                    
                    if (!value.match(regexp)) { throw new ControlException('El formato del nombre es incorrecto', 500); }                    
                }
            }
        },
        lastname: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: '',
            validate: {
                validateCustom: (value:any) => {
                    if (value) {
                        value = value.trim();
                        if (value.length > 100) { throw new ControlException('Los apellidos no deben superar los 100 caracteres', 500); }
    
                        const regexp = new RegExp('^([A-Za-zñÑÁÉÍÓÚÄËÏÖÜáéíóúäëïöüÇç&\'._-]+[\\s]*)+$');
                        if (!value.match(regexp)) { throw new ControlException('El formato de los apellidos es incorrecto', 500); }                    
                    }                    
                }
            }
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            defaultValue: '',
            validate: {
                notEmpty: { msg: 'El email debe estar informado' },
                validateCustom: (value: any) => {                    
                    if (!value) { throw new ControlException('El email debe estar informado', 500); }

                    value = value.trim();
                    if (value.length < 1) { throw new ControlException('El email debe estar informado', 500); }
                    if (value.length > 100) { throw new ControlException('El email no debe superar los 100 caracteres', 500); }

                    const regexp = new RegExp('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$');

                    if (!value.match(regexp)) { throw new ControlException('El formato del email es incorrecto', 500); }                    
                }
            }
        },
        username: {
            type: DataTypes.STRING(45),
            allowNull: false,
            unique: true,
            defaultValue: '',
            validate: {
                notEmpty: { msg: 'El nombre de usuario debe estar informado' },
                validateCustom: (value:any) => {                    
                    if (!value) { throw new ControlException('El nombre del usuario debe estar informado', 500); }

                    value = value.trim();
                    if (value.length < 1) { throw new ControlException('El nombre del usuario debe estar informado', 500); }
                    if (value.length > 45) { throw new ControlException('El nombre de usuario no debe superar los 45 caracteres', 500); }

                    const regexp = new RegExp('^[0-9A-Za-zñÑ._-]+$');
                    if (!value.match(regexp)) { throw new ControlException('El formato del nombre del usuario es incorrecto', 500); }
                }
            }
        },
        member_num: {
            type: DataTypes.INTEGER(11),
            allowNull: true,
            defaultValue: 0,
        },
        password: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: '',
        },
        active: {
            type: DataTypes.INTEGER(1),
            allowNull: false,
            defaultValue: '1'
        },
        attempts: {
            type: DataTypes.INTEGER(1),
            allowNull: false,
            defaultValue: '0'
        },        
        role_id: {
            type: DataTypes.INTEGER(10),
            allowNull: false,
            references: {
                model: 'roles',
                key: 'id'
            }
        }
    }, {
        tableName: 'users'
    });

    Users.associate = (models: any) => {
        Users.belongsTo(models.roles, { foreignKey: 'role_id' });
    }

    return Users;
};