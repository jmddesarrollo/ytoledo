# DESPLIEGUE DE API-CLOUD a AWS
Pasos a seguir para el despliegue de la aplicación en servidor AWS

--- 
# Pasos
##### Servidor - Preparación
Crear carpeta en el servidor donde se alojará la aplicación, cambiar permisos y propietario
~~~
    sudo mkdir /var/node/apiCloudZnpLM/{{version}}/
    cd /var/node/apiCloudZnpLM/{{version}}/                -- En formato 1_0_0
    sudo mkdir cert
    cd ..
    sudo chmod -R 777 {{version}}/
~~~

##### Certificados Autofirmados
Copiar archivos en "apiCloud/cert/" o bien generar certificados auto firmados para https. Seguir indicaciones de documento "Pasos Certificado SSL-TSL" en '1_Project\3_Resources\4_RemoteServer'

##### Revisar Configuración en Carpeta app "apiCloud"
* Revisar archivo .env de variables de entorno

* Eliminar la carpeta dist y ejecutar en la raíz del backend
~~~
    tsc -w
~~~ 
Para generar nuevo código limpio después de compilar el código de typescript a javascript

#### Nota - Solo si no se usa servidor AWS y se usa servidor común como el 55
* Solo en el caso de públicación en Preproduccion, no en servidor AWS, como el puerto 443 está ocupado es necesario modificar la variable global 'HTTPS_PORT' a un puerto libre (ej. 5560) y para probar la petición hay que llamar a 'https://preproduccion:5560/lic' 
* Y en el archivo "backend/.env" modificar LM_API_CLOUD_AWS_URL="0.0.0.0:5560"


##### Servidor - Carga de archivos
Con el programa WinSCP copiar de local al servidor:

1.	Copiar todo el contenido de la carpeta 'apiCloud/dist/' a la carpeta del servidor 'apiCloudZnpLM/{{version}}/'
2.	Copiar los archivos package.json, package-lock.json y .env de 'apiCloud' en la carpeta del servidor 'apiCloudZnpLM/{{version}}/'

* Asegurar que el archivo .env apunta bien las variables de entorno

##### Servidor - Instalación
Entrar en el servidor por sh y acceder hasta carpeta del proyecto:  
a.	Instalar módulos situados en la carpeta raíz del proyecto
~~~
    npm install
~~~
b.	En caso de problemas porque se quede en cache instalaciones de modulos previos, se puede reconstruir eliminando la carpeta “node_modules” y ejecutando comandos
~~~
    npm ci
    npm rebuild
~~~
* Con ‘ci’ no intentará actualizar las versiones de las dependencias, manteniendo el package.json sin cambios

#### Permisos carpeta versión
Reducir permisos a la carpeta de la versión
~~~
sudo chmod -R 755 {{version}}/
~~~

##### PM2 en el servidor
Hacer uso de administrador de procesos PM2 para aplicaciones node que contiene un balanceador de carga incorporado. Permite mantener las aplicaciones activas en segundo plano, para que el funcionamiento de la aplicación se mantenga, aunque salga el usuario de sh. 
Para ello, situarse en la carpeta raíz de la versión del proyecto ('apiCloudZnpLM/{{version}}/') en el servidor:
~~~
    sudo pm2 start index.js --name apiCloudZnpLM

    # Consultar listado de aplicaciones en ejecución
    sudo pm2 ls
    # Eliminar ejecución de la aplicación
    sudo pm2 delete apiCloudZnpLM
    # Parar visualizar estado de las aplicaciones
    sudo pm2 [status|ls|list]
    # Consultar información completa de la aplicación
    sudo pm2 show apiCloudZnpLM
    sudo pm2 describe apiCloudZnpLM
    # Para iniciar el proceso de una aplicación con un nombre personalizado
    Sudo pm2 start index.js -–name apiCloudZnpLM
    # Parar la aplicación
    sudo pm2 stop apiCloudZnpLM
    # Restaurar ejecución de la aplicación
    Sudo pm2 restart apiCloudZnpLM
    # Consultar log
    sudo pm2 logs apiCloudZnpLM
    # Monitorizar consumo de CPU y memoria de las aplicaciones
    sudo pm2 monit
~~~

##Notas
El servidor debe tener Node y PM2 instalado. De no ser así sería necesario su instalación globalmente:
* Observar documento "Instalación de NodeJS.md"

La versión Node usada en desarrollo ha sido v10.16.3. 


## Petición por API
Uso de PostMan
~~~
    https://preproduccion/lic
~~~
Nota: Mirar documento 'API test con PostMan' junto a este markdown para ayuda de configuración de recogida de archivos