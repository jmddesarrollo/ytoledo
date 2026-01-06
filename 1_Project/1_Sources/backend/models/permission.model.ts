import ControlException from '../utils/controlException';

module.exports = (sequelize: any, DataTypes: any) => {
    var Permissions = sequelize.define('permissions', {
        id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(45),
            allowNull: false,
            unique: true,
            defaultValue: '',
            validate: {
                validateCustom: (value:any) => {
                    value = value.trim();

                    if (!value) { throw new ControlException('El nombre debe estar informado', 500); }
                    if (value.length > 45) { throw new ControlException('El nombre no debe superar los 45 caracteres', 500); }

                    const regexp = new RegExp('^([A-Za-zñÑÁÉÍÓÚÄËÏÖÜáéíóúäëïöüÇç&\'._-]+[\\s]*)+$');
                    if (!value.match(regexp)) { throw new ControlException('El formato del nombre es incorrecto', 500); }                    
                }
            }
        },
        detail: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: '',
            validate: {
                validateCustom: (value:any) => {
                    value = value.trim();

                    if (value.length > 100) { throw new ControlException('El detalle no debe superar los 100 caracteres', 500); }                
                }
            }
        }     
    }, {
        tableName: 'permissions',
        timestamps: false
    });

    Permissions.associate = (models: any) => {
        Permissions.belongsToMany(
            models.roles, {
                through: 'role_has_permission',
                foreignKey: 'permissions_id',
                otherKey: 'roles_id'
            }
        )
    };

    return Permissions;
};