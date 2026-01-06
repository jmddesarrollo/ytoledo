# TrailManager
Código para la gestión de rutas de senderismo.

## Tecnologías
Frontend:         Angular CLI 10.2.5 con TypeScript  
Backend:          Node 14.18.1 con TypeScript  
Base de datos:    MySQL 5.7 con ORM Sequelize 6  
Comunicación:     Socket.io en tiempo real  

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
