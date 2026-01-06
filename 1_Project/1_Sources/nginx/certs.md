Para implementar HTTPS en tu configuración de Docker Compose, debes configurar un certificado SSL/TLS para que el servicio de Nginx actúe como un proxy inverso seguro. Aquí están los pasos detallados:

---

### 1. **Obtener Certificados SSL/TLS**
Puedes obtener certificados válidos de las siguientes maneras:

- **Let’s Encrypt:** Gratis y ampliamente utilizado. Puedes usar herramientas como [Certbot](https://certbot.eff.org/) para obtener certificados.
- **Certificados autofirmados:** Útil solo para pruebas locales.
- **Certificados comprados:** Si necesitas un certificado oficial.

---

### 2. **Actualizar la Configuración de Nginx**

#### a) Crear un directorio para los certificados:
Crea una carpeta `certs` dentro del directorio `nginx` (puedes nombrarla como quieras):

```bash
mkdir -p ./nginx/certs
```

Coloca tus certificados y claves en esa carpeta:
- `fullchain.pem`: El certificado público.
- `privkey.pem`: La clave privada.

#### b) Actualiza `nginx.conf`:
Modifica tu configuración de Nginx para soportar HTTPS. Aquí tienes un ejemplo:

```nginx
events {}

http {
    server {
        listen 80;
        server_name example.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name example.com;

        ssl_certificate /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        location / {
            proxy_pass http://ytoledo:5555;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

---

### 3. **Actualizar `docker-compose.yml`**
Añade un volumen para los certificados al servicio de Nginx y expón el puerto 443:

```yaml
nginx:
  image: nginx:latest
  container_name: nginx
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    - ./nginx/certs:/etc/nginx/certs:ro
  ports:
    - "80:80"
    - "443:443"
  depends_on:
    - ytoledo
```

---

### 4. **Reiniciar el Entorno**
Reinicia tu entorno Docker para aplicar los cambios:

```bash
docker-compose down
docker-compose up -d
```

---

### 5. **Pruebas**
- Asegúrate de que tu dominio apunta correctamente al servidor.
- Accede a tu aplicación desde `https://example.com`. Si usas certificados autofirmados, el navegador mostrará una advertencia.

---

### 6. **Renovar Certificados (Let’s Encrypt)**
Si usas Let’s Encrypt, necesitarás renovar los certificados periódicamente. Esto puede hacerse automáticamente con herramientas como Certbot.

Puedes incluso usar [Certbot con Nginx en Docker](https://certbot.eff.org/instructions) para automatizar la obtención y renovación de certificados.

--- 

Con esta configuración, tu aplicación estará protegida mediante HTTPS.





---------------------------------------------------------------------------------------
Para obtener certificados SSL/TLS de **Let's Encrypt**, puedes usar la herramienta **Certbot**, que facilita el proceso de solicitud y renovación automática de certificados. A continuación, te detallo cómo hacerlo:

---

### **Requisitos previos**

1. **Un dominio válido**: Necesitas un dominio que apunte a la IP de tu servidor.
2. **Acceso al puerto 80 y 443**: Let's Encrypt necesita verificar tu dominio, por lo que el servidor debe estar accesible a través del puerto 80 (HTTP) durante la verificación y 443 (HTTPS) para servir los certificados.
3. **Instalar Certbot**: Puedes instalar Certbot directamente en tu servidor o usar un contenedor Docker.

---

### **Método 1: Usar Certbot en el Servidor**

#### 1. Instalar Certbot en el servidor
Certbot es compatible con varias distribuciones de Linux. Aquí hay ejemplos para sistemas basados en Debian/Ubuntu y CentOS/RHEL:

##### En Ubuntu/Debian:
```bash
sudo apt update
sudo apt install certbot
```

##### En CentOS/RHEL:
```bash
sudo yum install epel-release
sudo yum install certbot
```

---

#### 2. Generar certificados con Certbot (modo standalone)
Si no tienes Nginx configurado aún o está controlado por Docker, puedes usar Certbot en modo *standalone*, que ejecuta un servidor temporal para verificar el dominio:

```bash
sudo certbot certonly --standalone -d example.com -d www.example.com
```

- Reemplaza `example.com` y `www.example.com` con tus dominios.
- Durante el proceso, Certbot almacenará los certificados en `/etc/letsencrypt/live/example.com/`:
  - **`fullchain.pem`**: El certificado completo.
  - **`privkey.pem`**: La clave privada.

---

#### 3. Configurar Nginx para usar los certificados
Una vez generados, sigue los pasos indicados en mi respuesta anterior para configurar Nginx.

---

#### 4. Configurar la renovación automática
Let's Encrypt certifica los dominios por 90 días, pero Certbot incluye una herramienta para renovar los certificados automáticamente. Añade la renovación al *cron*:

```bash
sudo crontab -e
```

Agrega la siguiente línea para renovar cada día:
```bash
0 3 * * * certbot renew --quiet
```

---

### **Método 2: Usar Certbot con Docker**

Si prefieres usar un contenedor Docker para obtener los certificados:

#### 1. Crear un contenedor de Certbot
Ejecuta el siguiente comando para solicitar los certificados:

```bash
docker run -it --rm \
  -v /path/to/certs:/etc/letsencrypt \
  -v /path/to/lib:/var/lib/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly --standalone -d example.com -d www.example.com
```

- **`/path/to/certs`**: Directorio local donde se guardarán los certificados.
- **`example.com`**: Reemplázalo con tu dominio.

Los certificados se guardarán en `/path/to/certs/live/example.com/`.

---

#### 2. Configurar Nginx
Con los certificados generados, sigue los pasos indicados anteriormente para configurarlos en tu archivo `nginx.conf`.

---

#### 3. Renovación automática con Docker
Puedes programar una tarea en *cron* para ejecutar el contenedor de Certbot periódicamente:

```bash
0 3 * * * docker run -it --rm \
  -v /path/to/certs:/etc/letsencrypt \
  -v /path/to/lib:/var/lib/letsencrypt \
  -p 80:80 \
  certbot/certbot renew --standalone
```

---

### **Método 3: Usar Certbot en un Contenedor Nginx con Companion**

Una alternativa más integrada es usar **Docker Compose** junto con [nginx-proxy](https://github.com/nginx-proxy/nginx-proxy) y su companion [letsencrypt-nginx-proxy-companion](https://github.com/nginx-proxy/docker-letsencrypt-nginx-proxy-companion). Este enfoque automatiza completamente la emisión y renovación de certificados.

---

Con estos pasos, podrás generar y gestionar tus certificados SSL con Let's Encrypt. Si eliges usar Certbot en Docker, recuerda asegurarte de que no haya conflictos con otros servicios que usen el puerto 80 durante la validación.



----------------
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/efcastillodelaguila.es/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/efcastillodelaguila.es/privkey.pem
This certificate expires on 2025-02-24.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.


Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/y-toledo.es/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/y-toledo.es/privkey.pem
This certificate expires on 2025-02-24.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.


Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/y-toledo.es/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/y-toledo.es/privkey.pem
This certificate expires on 2025-02-24.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.
