# IMPLEMENTACIÓN DE CERTIFICADO TLS (VERSION MÁS MODERNA DE SSL)

Aplicar siempre el paso para entorno de desarrollo porque se ha decidido que los certificados sean auto firmados en todos los entornos y no intervenga Agencia Certificadora
Se conserva pasos con Agencia Certificadora por si en algún momento se decide aplicar de esa manera

--- 
### PASOS PARA ENTORNO DE DESARROLLO / PRUEBAS
##### Generador de certificado Auto-Firmado
* Acceder a url parga generación  
https://www.selfsignedcertificate.com/

Por ejemplo generar 'preproduccion'. Descargar archivos key y cert que se encuentran encriptados en Base-64

* Colocar archivos en la ruta indicada en archivo .env de la carpeta 'apiCloud' donde indican los campos 'KEY_PATH' y 'CERT_PATH'.

** Nota: El redireccionado de http a https se ha comentado porque Express redirecciona a método GET. No se ha encontrado el modo de indicar el método de la petición.


### PASOS PARA ENTORNO DE PRODUCCIÓN
##### Generador de certificado con Autoridad Certificadora Let's Encrypt
* Descargar herramienta CertBot para automatizar la interacción entre la Autoridad de certificación y el Servidor.   
~~~
    wget https://dl.eff.org/certbot-auto
~~~

* Mover el archivo descargado a la carpeta de binarios y cambiar al usuario 'root' el propietario, junto con los permisos de ejecución:
~~~
    sudo mv certbot-auto /usr/local/bin/cerbot-auto
    sudo chown root /usr/local/bin/certbot-auto
    sudo chmod 0755 /usr/local/bin/certbot-auto
~~~

* Ejecutar la herramienta cerbot-auto para instalar las dependencias de las que requiere:
~~~
    cerbot-auto
~~~

Pasos previos que debe cerciorarse antes de usar certificado :  
* El dominio o subdominio ya deben redireccionar a nuestro servidor
* Se debe de detener el proceso con el gestor de procesos PM2
~~~
    sudo pm2 stop {processName}
~~~

* El puerto 80 debe estar libre para que la organización del certificado se pueda conectar y validar que poseemos ese dominio. Para obtener el certificado, hay que agregar todos los dominios y subdominios requeridos, para ello por ssh se debe dar el comando:
~~~
    certbot-auto certonly --standalone -d {dominio.com} -d {www.dominio.com}
~~~

** Es importante dar un email para poder recibir notificaciones del estado del certificado, cuando va a caducar, etc.

* Con el siguiente comando se puede consultar los certificados solicitados en nuestro servidor con información sobre los dominios, caducidad y alojamiento:
~~~
    certbot-auto certificates
~~~

* Asignación de permisos, tanto en archivos físicos como en los enlaces simbólicos del certificado y clave privada según path del paso previo:
~~~
    sudo chmod -R 755 /etc/letsencrypt/live/
    sudo chmod -R 755 /etc/letsencrypt/archive/
~~~


* Implementación de los Certificados en Producción

* Editar con nano el archivo .env para colocar enlaces simbólicos del certificado y clave privada en los campos 'KEY_PATH' y 'CERT_PATH'.
* El puerto http debe ser 80 y https el puerto 443

* Comenzar el proceso
~~~
    sudo pm2 start {processName}
~~~

* AWS tiene un firewall con reglas de puertos en la configuración de AWS. Por defecto tiene el puerto 22 para SSH y 80 para http. Hay que crear nueva regla para abrir el puerto 443.

* Probar que la API funciona correctamente con el HHTPS.

** Nota: La renovación del certificado SSL se realiza por Cron desde la propia herramienta
