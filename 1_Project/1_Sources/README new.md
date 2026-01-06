# TrailManager
Código para la gestión de rutas de senderismo.

## Tecnologías
Frontend:         Angular CLI 17.1.0 con TypeScript  
Backend:          Node 20.11.0 con TypeScript
Package Manager:  npm 10.2.4  
Base de datos:    MySQL 8 con ORM Sequelize 6  
Comunicación:     Socket.io en tiempo real  

DOCKER
Iniciar contenedor
docker run --name y-mysql-container -e MYSQL_ROOT_PASSWORD=y-toledo-pwd -p 3306:3306 -d mysql:latest

Acceder al contenedor
docker exec -it y-mysql-container bash

mysql -u root -p
SET GLOBAL require_secure_transport=OFF;

DBeaver:
1 - On the "Connection settings" screen (main screen), click on "Edit Driver Settings"
2 - Click on "Driver properties"
3 - Set these two properties: "allowPublicKeyRetrieval" to true and "useSSL" to false

Lanzar el script para crear la base de datos

Backend
npm start
o 
tsc -w

Frontend
npm start


--- 
# Despliegue en entorno de Desarrollo
## Puesta a punto
En la carpeta 1_Sources se encuentra el código de la aplicación.  
En la carpeta 4_Database se encuentra el modelo de la base de datos y el script para generar la base de datos.  
Se presupone que la computadora ya tiene instalado globalmente 'npm' y 'NodeJS'.

## Instalación de modulos en el Frontend
01 - Situarse en la carpeta del proyecto 'frontend' y realizar siguiente comando para la instalación de los módulos necesarios para el FrontEnd.
~~~
    npm install
~~~

02 - Situarse en la carpeta del proyecto 'backend' y realizar siguiente comando para la instalación de los módulos necesarios para el Backend.
~~~
    npm install
~~~


## MySQL
03 - Levantar el servidor que contiene a MySQL y ejecutar en MySQL el script situado en la carpeta 4_Database para generar la base de datos junto con sus tablas.
Genera automáticamente un usuario 'admin' con contraseña '123qwe' para acceder a la aplicación y comenzar su gestión.

## Levantar Backend y FrontEnd
04 - Situarse en la carpeta del 'backend' y poner en la escucha a typscript a través del comando:
~~~
    tsc -w
~~~

05 - Situarse en la carpeta del proyecto 'backend' y realizar siguiente comando para iniciar el BackEnd.
~~~
    npm start
~~~

06 - Situarse en la carpeta del proyecto 'frontend' y realizar siguiente comando para iniciar el FrontEnd. (Saltará la página en el navegador automáticamente)
~~~
    npm start
~~~


## Navegar
07 - Situarse en el navegador.
~~~
    http://localhost:4200/home
~~~
