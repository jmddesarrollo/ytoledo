module.exports = (sequelize: any, DataTypes: any) => {
    const Routes = sequelize.define('routes', {
        id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false
        },
        start_point: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        distance_km: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: true
        },
        elevation_gain: {
            type: DataTypes.INTEGER(11),
            allowNull: true
        },
        max_height: {
            type: DataTypes.INTEGER(11),
            allowNull: true
        },
        min_height: {
            type: DataTypes.INTEGER(11),
            allowNull: true
        },
        estimated_duration: {
            type: DataTypes.STRING(5),
            allowNull: true
        },
        type: {
            type: DataTypes.TINYINT(1),
            allowNull: true
        },
        difficulty: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        sign_up_link: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        wikiloc_link: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        wikiloc_map_link: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        user_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'routes',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Routes.associate = (models: any) => {
        Routes.belongsTo(models.users, { foreignKey: 'user_id' });
    };

    return Routes;
};