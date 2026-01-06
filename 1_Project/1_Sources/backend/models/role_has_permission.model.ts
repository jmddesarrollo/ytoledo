module.exports = (sequelize: any, DataTypes: any) => {
    var Role_has_permission = sequelize.define('role_has_permission', {
        roles_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'roles',
                key: 'id'
            }
        },
        permissions_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'permissions',
                key: 'id'
            }
        },
        reading: {
            type: DataTypes.INTEGER(1),
            allowNull: false,
            defaultValue: '0'
        }, 
        writing: {
            type: DataTypes.INTEGER(1),
            allowNull: false,
            defaultValue: '0'
        }     
    }, {
        tableName: 'role_has_permission',
        timestamps: false
    });

    return Role_has_permission;
};
