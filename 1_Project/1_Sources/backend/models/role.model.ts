import ControlException from '../utils/controlException';

module.exports = (sequelize: any, DataTypes: any) => {
    var Roles = sequelize.define('roles', {
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

                    const regexp = new RegExp('^([0-9A-Za-zñÑÁÉÍÓÚÄËÏÖÜáéíóúäëïöüÇç&\'._-]+[\\s]*)+$');
                    if (!value.match(regexp)) { throw new ControlException('El formato del nombre es incorrecto', 500); }                    
                }
            }
        }
    }, {
        tableName: 'roles',
        timestamps: false
    });

    Roles.associate = (models: any) => {
        Roles.hasMany(models.users, { foreignKey: 'role_id' });
        Roles.belongsToMany(
            models.permissions, {
                through: 'role_has_permission',
                foreignKey: 'roles_id',
                otherKey: 'permissions_id'
            }
        );
    };

    return Roles;
};
