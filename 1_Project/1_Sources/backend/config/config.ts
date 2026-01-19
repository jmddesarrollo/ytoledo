module.exports = {
    "development": {
        "url": "http://localhost:4200",
        "autocommit": false,
        "roleAdmin": 1,
        "userIdAdmin": 1,
        "emailTest": "jmddesarrollo@gmail.com",
        "folderLogs": "./data/logs/",
        "folderFiles": "./data/files/",
        "folderSH": "./files/sh/",
        "permission_permissions_manager": 1,
        "permission_users_manager": 2,
        "permission_files_manager": 3,
        "permission_routes_manager": 4,
        "YTO": {
            "username": process.env.YTO_BD_USER,
            "password": process.env.YTO_BD_PASSWORD,
            "database": `y-toledo`,
            "options": {
                "host": process.env.YTO_BD_HOST,
                "port": "3306",
                "dialect": "mysql",
                "logging": false,
                "pool": {
                    "max": 5,
                    "min": 0,
                    "idle": 30000,
                    "acquire": 30000
                }
            }
        }
    },
    "production": {
        "url": `http://194.164.165.161:${process.env.YTO_SERVER_PORT}`,
        "autocommit": false,
        "roleAdmin": 1,
        "userIdAdmin": 1,
        "emailTest": "jmddesarrollo@gmail.com",
        "folderLogs": "/home/ytoledo/files/logs/",
        "folderFiles": `/home/ytoledo/files/`,
        "folderSH": `/home/ytoledo/files/sh/`,
        "permission_permissions_manager": 1,
        "permission_users_manager": 2,
        "permission_files_manager": 3,
        "permission_routes_manager": 4,
        "YTO": {
            "username": process.env.YTO_BD_USER,
            "password": process.env.YTO_BD_PASSWORD,
            "database": "y-toledo",
            "options": {
                "host": process.env.YTO_BD_HOST,
                "port": "3306",
                "dialect": "mysql",
                "logging": false,
                "pool": {
                    "max": 5,
                    "min": 0,
                    "idle": 30000,
                    "acquire": 30000
                }
            }
        }
    }
}