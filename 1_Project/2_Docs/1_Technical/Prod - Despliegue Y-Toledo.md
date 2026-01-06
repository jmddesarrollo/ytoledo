# DESPLIEGUE DE Y-Toledo a PRODUCCIÓN
Pasos a seguir para el despliegue de la aplicación en servidor de producción

--- 
# Previos  
+ Asegurar que el archivo "backend/package.json" y ".env" apunta a la versión correcta

* Revisar que las variables del archivo .env de variables de entorno apuntan correctamente, especialmente la variable NODE_ENV para indicar el entorno de destino, así como las variables de YTO_BD_X de base de datos 

* Revisar archivo "backend/config/config.ts" para asegurar que las variables globales apuntan correctamente en su apartado "production"

* Especialmente asegurar en configuración que los datos y logs apuntan a su carpeta universal:  
"folderFiles":        "/var/data/ytoledo/files/"  
"folderLogs":         "/var/log/ytoledo/"  

# Pasos
##### Base de datos
La base de datos se denomina 'y-toledo'

Ejecutar script de edición de la base de datos, si la versión a publicar así lo requiere

##### Frontend - Configuración 
Cambiar en el archivo ‘src/environments/environment.ts’ la ip:puerto del servidor de despliegue ‘ws://{IPserver}:5555’  
En el archivo "/services/global.ts" asegurar que la versión es la correcta

##### Frontend - Compilación: 
En la carpeta frontend realizar compilación:
~~~
    cd /frontend
    ng build
~~~
* No usar atributo --prod’ porque da errores de momento en preproducción

##### Backend - Configuración
* En el archivo "backend/server/server.ts" asegurar que se encuentra descomentado las líneas para usar la carpeta ‘public’

~~~
    this.app.use(express.static(path.resolve(__dirname, '../public')));
    this.app.use('*', express.static(path.resolve(__dirname, '../public/index.html')));
~~~ 

* Eliminar la carpeta dist y generar nuevo código limpio después de transpilar el código de typescript a javascript. Para ello hay que ejecutar en la raíz del backend  

~~~ 
    tsc -w
~~~ 
 
##### Servidor - Preparación
En el servidor crear carpetas donde se alojará la aplicación y otorgar permisos:
~~~
    sudo mkdir /var/node/YToledo                      -- En caso de no existir
    sudo mkdir /var/node/YToledo/{version}            -- En formato 1_0_0
    sudo mkdir /var/node/YToledo/{version}/public
~~~

Asegurar que existen las siguiente carpetas y poseen permiso global (777). Solo debería aplicar al desplieuge de la primera versión.
~~~
    /data/YToledo/    
    /var/log/YToledo/
           
    sudo chmod -R 777 {version}/
~~~

##### Servidor - Carga de archivos
Con el programa WinSCP copiar del proyecto a la carpeta destino en el servidor:

1.	Copiar todo el contenido de la carpeta 'backend/dist/' a la raíz de la carpeta "/var/node/YToledo/{version}/"
2.	Copiar de 'backend/' los archivos package.json, package-lock.json, '.env' a la raíz de la carpeta "/var/node/YToledo/{version}/"
3.	Copiar la carpeta ‘files’, que contiene archivos no typescript como el logo o los comandos shell para Linux, a la raíz de la carpeta "/var/node/YToledo/{version}/"
4.	Copiar el contenido de la carpeta 'frontend/dist/' dentro de la carpeta "/var/node/YToledo/{version}/public/"
5.  Copiar el archivo .nvmrc para indicar la versión Node a usar en el proyecto


##### SH - Cambiar a formato Unix
Cambiar formato a archivos SH de dos a unix:
~~~
    cd /var/node/YToledo/{version}/files/sh/
    sudo dos2unix os_base64Conv.sh
    sudo dos2unix os_base64Desc.sh
    sudo dos2unix os_sign.sh
    sudo dos2unix os_verify.sh
~~~

##### NVM para usar versión de Node
Hacer uso de NVM (Node Version Manager) para uso de la versión de Node en la aplicación.

Dentro del proyecto, donde existe el archivo '.nvmrc' que contiene únicamente la versión especifica de Node sobre la que actúa, se debe de ejecutar el siguiente comando:
~~~
    nvm use
~~~

Otros comandos de ayuda para la gestión de versiones Node
~~~
    ## Comandos de ayuda para NVM
    # Consultar versión de NVM
    nvm --version
    # Consultar lista de versiones Node instaladas
    nvm list
    # Consultar lista de versiones Node que pueden ser instaladas
    nvm ls-remote
    # Consultar lista de versiones LTS de Node (con soporte) que pueden ser instaladas 
    nvm ls-remote --lts    
    # Instalación de versión Node en la lista de NVM (la última versión instalada será la que NVM ponga en uso)
    nvm install vX.Y.Z
    # Cambiar versión en uso en el servidor
    nvm use vX.Y.Z
    # Cambiar versión en uso en el ¿terminal? sin cambiar la versión del sistema
    nvm exec vX.Y.Z node --version    
~~~

##### Servidor - Instalación
En el servidor situarse en la carpeta del proyecto "/var/node/YToledo/{version}/":  
a.	Instalar módulos del backend
~~~
    npm install
~~~
b.	No debería ocurrir, pero en caso de problemas porque se quede en cache instalaciones de modulos previos, se puede reconstruir eliminando la carpeta “node_modules” y ejecutando comandos, pero no es normal que suceda esto
~~~
    npm ci
    npm rebuild
~~~
* Con ‘ci’ no intentará actualizar las versiones de las dependencias, manteniendo el package.json sin cambios

* Posteriormente a la instalación se puede regresar en NVM a la versión previa de Node si se considera oportuno


##### Permisos - Version
Cambiar permisos en la carpeta de versión desde la carpeta del proyecto:  
~~~
    sudo chmod -R 755 /var/node/YToledo/{version}/ 
~~~


##### PM2 para lanzar el servicio en el servidor en segundo plano
Hacer uso de administrador de procesos PM2 para aplicaciones node que contiene un balanceador de carga incorporado. Permite mantener las aplicaciones activas en segundo plano, para que el funcionamiento de la aplicación se mantenga, aunque salga el usuario de sh. 

Eliminar la versión previa desplegada
~~~
    sudo pm2 delete ytoledo
~~~
Lanzar nuevo proceso desplegado. Para ello, situarse en raíz de la versión del proyecto '/var/node/YToledo/{version}/', donde se encuentra index.js, y ejecutar siguiente comando:
~~~
    sudo pm2 start index.js --name ytoledo
~~~

Otros comandos de ayuda para la gestión del proceso
~~~
    ## Comandos de ayuda para PM2
    # Consultar listado de aplicaciones en ejecución
    pm2 ls
    # Lanzar el proceso a ejecución
    sudo pm2 start index.js --name ytoledo   
    # Eliminar ejecución de la aplicación
    pm2 delete ytoledo
    # Parar visualizar estado de las aplicaciones
    pm2 [status|ls|list]
    # Consultar información completa de la aplicación
    pm2 show ytoledo
    pm2 describe ytoledo
    # Para iniciar el proceso de una aplicación con un nombre personalizado
    pm2 start index.js -–name ytoledo
    # Parar la aplicación
    pm2 stop ytoledo
    # Restaurar ejecución de la aplicación
    pm2 restart ytoledo
    # Consultar log
    pm2 logs ytoledo
    # Monitorizar consumo de CPU y memoria de las aplicaciones
    pm2 monit
~~~
Nota: Es importante que contenga el proceso el mismo nombre asigando en la variable global (.env) "LM_SERVICE_NAME", pues la propia aplicación puede requerir reiniciar su proceso en el servidor.



##Notas generales
El servidor debe tener Node y PM2 instalado. De no ser así sería necesario su instalación globalmente:
~~~
    npm install pm2	-g
~~~
Se han rebajado versiones de modulos ‘bcrypt’ de ‘5.0.0’ a ‘4.0.1’, y modulo ‘archiver’ de ‘5.2.0’ a ‘4.0.2’ por incompatibilidades con versión node en preproducción ‘v8.11.3’


## Navegar
Previamente en el archivo hosts de Windows ('C:\Windows\System32\drivers\etc\') debe añadirse la línea:  
192.168.1.56		ytoledo.produccion
  
Navegar hacia la url en el navegador
~~~
    http://ytoledo.produccion
~~~

### Nota
Usuario: admin
Contraseña: 123qwe