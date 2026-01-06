#Instalaciones necesarias
--- 

## NODE 
Instalación de la versión de node:

1 - Actualizar repositorios del servidor linux
~~~
    sudo apt update
    sudo apt install npm
~~~

2 - Instalar Node.js y NPM en su versión estable
~~~
    sudo npm cache clean -f        -- En caso de tener node instalado previamente
    sudo npm install -g n
    sudo n stable
~~~
* Si se quiere instalar la últimar versión seria con comando 'sudo n latest'

3 - Necesario cerrar y abrir nueva sesión en terminal porque cambia la ruta al binario node

4 - Verificar versión Node.js 
~~~
    node --version
~~~

5 - Verificar versión NPM
~~~
    npm --version
~~~

6 - Permitir a Node.js ejecutar aplicaciones en puertos inferiores al 1024  
6a - Instalación de paquete libcap2
~~~
    sudo apt-get install libcap2-bin
~~~

6b - Establecer permisos
~~~
    sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\``

## PM2
Instalación de PM2 (en caso de necesitar versión superior o inferior cambiar número de setup):
~~~
    sudo npm install pm2 -g
~~~
