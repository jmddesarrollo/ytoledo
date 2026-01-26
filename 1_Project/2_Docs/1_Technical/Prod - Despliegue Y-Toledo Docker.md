# DESPLIEGUE DE Y-Toledo a PRODUCCIÓN (Docker)
Pasos para el despliegue en Servidor con Docker + Nginx

---

## Previos
+ Asegurar que el archivo "backend/package.json" y ".env" apunta a la versión correcta
+ Revisar variables del archivo .env, especialmente NODE_ENV y variables de base de datos
+ Revisar archivo "backend/config/config.ts" para configuración de producción
+ En caso necesario ejecutar script de actualización de la base de datos

## Estructura del servidor
```
/home/
├── ytoledo/                 # Código del backend de proyecto Y-Toledo
├── efcastillodelaguila/     # Código del backend de proyecto E.F. Casitillo del Águila
├── docker-compose.yml       # Orquestación de contenedores
├── nginx/
    └── nginx.conf           # Configuración de Nginx
```

## Pasos de despliegue

### 1. Frontend - Compilación
En la carpeta frontend realizar compilación para producción:
```bash
cd 1_Project/1_Sources/frontend
ng build --configuration=production
```

### 2. Backend - Compilación
En la carpeta frontend realizar compilación para producción:
```bash
cd 1_Project/1_Sources/backend
tsc -w
```

### 3. Preparar archivos para despliegue
```bash
# Crear carpeta temporal
mkdir /tmp/ytoledo-deploy
mkdir /tmp/ytoledo-deploy/files

# Copiar backend
cd 1_Project/1_Sources/backend
cp -r dist/* /tmp/ytoledo-deploy/
cp package.json package-lock.json .env.production dockerfile /tmp/ytoledo-deploy/
cp -r files/* /tmp/ytoledo-deploy/files/

# Copiar frontend compilado a public
mkdir -p /tmp/ytoledo-deploy/public
# Posicionarse en la raíz del proyecto
cd 1_Project/1_Sources/
cp -r frontend/dist/* /tmp/ytoledo-deploy/public/
mv /tmp/ytoledo-deploy/.env.production /tmp/ytoledo-deploy/.env 

# Verificar estructura
ls -la /tmp/ytoledo-deploy/
ls -la /tmp/ytoledo-deploy/public/
```

### 3. Servidor - Carga de archivos
Comando por si se necesita realizar la gestión de archivos desde el servidor en linux:
sftp://usuario@IP_DEL_SERVIDOR

### 4. Subir archivos al servidor
```bash
# Comprimir para transferencia más rápida
cd /tmp
tar -czf ytoledo-deploy.tar.gz ytoledo-deploy/

# Subir al servidor
scp ytoledo-deploy.tar.gz usuario@servidor:/home/
# Eliminar archivos temporales
rm -rf ytoledo-deploy ytoledo-deploy.tar.gz

# En el servidor, extraer archivos
ssh usuario@servidor
cd /home
tar -xzf ytoledo-deploy.tar.gz
rm -rf ytoledo/*  # Limpiar versión anterior
# Crear carpeta ytoledo si no existe
mkdir -p ytoledo
# Mover archivos (normales y ocultos)
mv ytoledo-deploy/* ytoledo/
cp ytoledo-deploy/.env ytoledo/.env
# Eliminar archivos temporales
rm -rf ytoledo-deploy ytoledo-deploy.tar.gz
```

### 5. Despliegue con Docker
```bash
# En el servidor, ir al directorio principal
cd /home

# Parar TODOS los servicios y limpiar
docker-compose down

# Levantar TODOS los servicios con rebuild
docker-compose up -d --build

# Verificar que está funcionando
docker-compose logs ytoledo
docker ps
```

### 6. Verificación
```bash
# Verificar logs
docker-compose logs -f ytoledo

# Verificar que responde
curl -k https://ytoledo.es

# Verificar base de datos
docker-compose exec mysql mysql -u root -p -e "SHOW DATABASES;"
```

## Comandos útiles Docker

### Gestión de contenedores
```bash
# Ver estado de todos los servicios
docker-compose ps

# Ver logs de un servicio específico
docker-compose logs ytoledo
docker-compose logs -f ytoledo  # Seguir logs en tiempo real

# Reiniciar un servicio
docker-compose restart ytoledo

# Parar todos los servicios
docker-compose down

# Levantar todos los servicios
docker-compose up -d

# Reconstruir imagen sin cache
docker-compose build --no-cache ytoledo
```

### Gestión de imágenes y limpieza
```bash
# Ver imágenes Docker
docker images

# Limpiar imágenes no utilizadas
docker image prune -f

# Limpiar todo (contenedores, redes, imágenes)
docker system prune -f
```

### Acceso a contenedores
```bash
# Acceder al contenedor de ytoledo
docker-compose exec ytoledo bash

# Acceder a MySQL
docker-compose exec mysql mysql -u root -p

# Ver archivos dentro del contenedor
docker-compose exec ytoledo ls -la /home/ytoledo/
```

## Estructura de archivos en el contenedor
```
/home/ytoledo/
├── dist/           # Código TypeScript compilado
├── public/         # Frontend Angular compilado
├── files/          # Archivos estáticos (logos, scripts)
├── package.json
├── .env
└── node_modules/
```

## Troubleshooting

### Si el contenedor no inicia
```bash
# Ver logs detallados
docker-compose logs ytoledo

# Verificar configuración
docker-compose config

# Reconstruir desde cero
docker-compose down ytoledo
docker-compose build --no-cache ytoledo
docker-compose up -d ytoledo
```

### Si hay problemas de permisos
```bash
# En el servidor, ajustar permisos
sudo chown -R $USER:$USER /home/ytoledo
chmod -R 755 /home/ytoledo
```

### Si MySQL no conecta
```bash
# Verificar que MySQL está corriendo
docker-compose ps mysql

# Verificar logs de MySQL
docker-compose logs mysql

# Reiniciar MySQL
docker-compose restart mysql
```

## Notas importantes
- El contenedor usa Node.js v22 (actualizado desde v20)
- TypeScript se compila automáticamente durante el build
- Los archivos estáticos del frontend se sirven desde `/public/`
- WebSocket funciona a través del path `/ytoledo/`
- SSL/HTTPS está configurado en Nginx

## Acceso a la aplicación
- URL: https://ytoledo.es
- Usuario administrador: admin