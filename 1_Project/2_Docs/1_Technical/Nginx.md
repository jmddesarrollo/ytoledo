# NGINX - Servidor Web y Proxy Reverso

## 🎯 **¿Qué es Nginx?**

**Nginx** (pronunciado "engine-x") es un **servidor web** y **proxy reverso** de alto rendimiento.

### **Analogía simple:**
Nginx es como un **recepcionista de hotel** que:
- **Recibe** a todos los visitantes (peticiones HTTP)
- **Decide** a qué habitación dirigirlos (frontend o backend)
- **Gestiona** el tráfico de manera eficiente

## 🏢 **¿Qué hace Nginx en tu servidor?**

```
Internet → Nginx (Puerto 443/80) → Decide dónde enviar la petición
                    ↓
            ┌───────────────┐
            │   ¿Qué tipo   │
            │ de petición?  │
            └───────────────┘
                    ↓
        ┌───────────────────────────┐
        ↓                           ↓
┌─────────────┐              ┌─────────────┐
│  Archivos   │              │     API     │
│  estáticos  │              │  WebSocket  │
│ (Frontend)  │              │ (Backend)   │
└─────────────┘              └─────────────┘
```

## 📋 **Funciones principales de Nginx:**

### **1. Servidor Web (Archivos estáticos)**
```
Usuario solicita: https://ytoledo.es/index.html
                     ↓
Nginx busca: /usr/share/nginx/html/index.html
                     ↓
Nginx responde: Archivo HTML al navegador
```

### **2. Proxy Reverso (APIs dinámicas)**
```
Usuario solicita: https://ytoledo.es/ytoledo/socket.io/
                     ↓
Nginx detecta: "Esto es para el backend"
                     ↓
Nginx reenvía: http://ytoledo:5555/ytoledo/socket.io/
                     ↓
Backend responde: Datos dinámicos
                     ↓
Nginx reenvía: Respuesta al usuario
```

### **3. Terminación SSL/HTTPS**
```
Usuario: https://ytoledo.es (cifrado)
                     ↓
Nginx: Descifra HTTPS → HTTP
                     ↓
Backend: Recibe HTTP simple (sin cifrado)
                     ↓
Nginx: Cifra respuesta → HTTPS
                     ↓
Usuario: Recibe respuesta cifrada
```

## 🔍 **Análisis de tu configuración Nginx:**

### **Configuración actual:**
```nginx
# Redirección HTTP → HTTPS
server {
    listen 80;
    server_name ytoledo.es www.ytoledo.es;
    return 301 https://$host$request_uri;  # Fuerza HTTPS
}

# Servidor HTTPS principal
server {
    listen 443 ssl;
    server_name ytoledo.es www.ytoledo.es;
    
    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/y-toledo.es/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/y-toledo.es/privkey.pem;
    
    # Archivos estáticos (Frontend)
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    
    # API y WebSocket (Backend)
    location /ytoledo/ {
        proxy_pass http://ytoledo_backend;
        # Configuración de proxy...
    }
}
```

## 🚦 **¿Cómo decide Nginx qué hacer?**

### **Flujo de decisión:**
```
1. ¿Es HTTP? → Redirigir a HTTPS
2. ¿Es HTTPS? → Continuar
3. ¿Empieza con /ytoledo/? → Enviar al backend
4. ¿Cualquier otra cosa? → Servir archivo estático
```

### **Ejemplos prácticos:**
```
https://ytoledo.es/
→ Nginx sirve: /usr/share/nginx/html/index.html

https://ytoledo.es/main.js
→ Nginx sirve: /usr/share/nginx/html/main.js

https://ytoledo.es/ytoledo/socket.io/
→ Nginx proxy: http://ytoledo:5555/ytoledo/socket.io/

https://ytoledo.es/ytoledo/api/users
→ Nginx proxy: http://ytoledo:5555/ytoledo/api/users
```

## ⚡ **¿Por qué usar Nginx y no solo Node.js?**

### **Comparación:**

| Aspecto | Solo Node.js | Nginx + Node.js |
|---------|-------------|-----------------|
| **Archivos estáticos** | ❌ Lento | ✅ Ultra rápido |
| **SSL/HTTPS** | ❌ Complejo | ✅ Simple |
| **Múltiples dominios** | ❌ Difícil | ✅ Fácil |
| **Balanceador de carga** | ❌ No | ✅ Sí |
| **Caché** | ❌ Manual | ✅ Automático |
| **Compresión** | ❌ Manual | ✅ Automática |

### **Rendimiento:**
```
Servir imagen de 1MB:
├── Node.js: ~100ms, usa mucha CPU
└── Nginx: ~10ms, usa poca CPU

Servir 1000 archivos CSS/JS:
├── Node.js: Se satura, lento
└── Nginx: Sin problemas, rápido
```

## 🏗️ **Arquitectura de tu servidor:**

```
Internet (Puerto 443)
        ↓
┌─────────────────┐
│     NGINX       │ ← Punto de entrada único
│  (Recepcionista)│
└─────────────────┘
        ↓
┌───────────────────────────┐
│    ¿Qué solicita?         │
└───────────────────────────┘
        ↓
┌─────────────┬─────────────┐
│ Archivos    │ APIs/       │
│ estáticos   │ WebSocket   │
│             │             │
│ index.html  │ /ytoledo/   │
│ main.js     │ socket.io   │
│ styles.css  │ api calls   │
│             │             │
│ ✅ Nginx    │ ✅ Proxy a  │
│ los sirve   │ Node.js     │
│ directamente│ (Puerto     │
│             │ 5555)       │
└─────────────┴─────────────┘
```

## 🔧 **Configuraciones importantes:**

### **1. try_files**
```nginx
try_files $uri $uri/ /index.html;
```
**¿Qué hace?**
1. Busca el archivo exacto (`$uri`)
2. Si no existe, busca como directorio (`$uri/`)
3. Si no existe, sirve `index.html` (para Angular routing)

### **2. Proxy headers**
```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```
**¿Para qué?** El backend sabe:
- Qué dominio pidió el usuario
- Cuál es la IP real del usuario
- Que la conexión original era HTTPS

### **3. WebSocket support**
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```
**¿Para qué?** Permite que Socket.io funcione correctamente.

## 🚀 **Ventajas de tu configuración:**

### **1. Rendimiento**
- **Archivos estáticos**: Nginx los sirve ultra-rápido
- **Compresión**: Automática para CSS/JS
- **Caché**: Headers optimizados

### **2. Seguridad**
- **SSL/TLS**: Certificados automáticos con Let's Encrypt
- **Headers de seguridad**: HSTS, X-Frame-Options
- **Proxy**: Backend no expuesto directamente

### **3. Escalabilidad**
- **Múltiples backends**: Fácil agregar más contenedores
- **Balanceador**: Distribuir carga entre servidores
- **Dominios**: ytoledo.es y efcastillodelaguila.es

## 💡 **Analogías para recordar:**

### **Nginx = Recepcionista de hotel**
- **Recibe** todas las peticiones
- **Decide** dónde enviar cada una
- **Gestiona** certificados y seguridad
- **Optimiza** el tráfico

### **Sin Nginx = Cada habitación con su puerta**
- **Confuso** para los visitantes
- **Inseguro** (cada puerta necesita cerradura)
- **Ineficiente** (cada habitación gestiona todo)

## 🎯 **Resumen:**

```
Nginx en tu servidor:
├── Puerto 80 → Redirige a HTTPS
├── Puerto 443 → Punto de entrada principal
├── Archivos estáticos → Los sirve directamente
├── /ytoledo/* → Proxy al backend Node.js
├── SSL/HTTPS → Gestiona certificados
└── Múltiples dominios → ytoledo.es + efcastillodelaguila.es
```

## 🎯 **Resumen final:**

```
Nginx en tu servidor:
├── Puerto 80 → Redirige a HTTPS
├── Puerto 443 → Punto de entrada principal
├── Archivos estáticos → Los sirve directamente
├── /ytoledo/* → Proxy al backend Node.js
├── SSL/HTTPS → Gestiona certificados
└── Múltiples dominios → ytoledo.es + efcastillodelaguila.es
```

**Nginx = El director de orquesta que coordina todo tu servidor web**

## 🔄 **Flujo completo de una petición:**

### **Ejemplo 1: Cargar la página principal**
```
1. Usuario escribe: https://ytoledo.es
2. Nginx recibe petición en puerto 443
3. Nginx busca: /usr/share/nginx/html/index.html
4. Nginx sirve: Archivo HTML + CSS + JS
5. Navegador ejecuta JavaScript (Angular)
6. ✅ Página cargada
```

### **Ejemplo 2: Login de usuario**
```
1. Usuario hace login en Angular
2. Angular envía: POST https://ytoledo.es/ytoledo/api/auth/login
3. Nginx detecta: "/ytoledo/" → Es para backend
4. Nginx proxy: POST http://ytoledo:5555/ytoledo/api/auth/login
5. Node.js procesa login
6. Node.js responde: { token: "abc123" }
7. Nginx reenvía respuesta al navegador
8. ✅ Usuario logueado
```

### **Ejemplo 3: WebSocket para tiempo real**
```
1. Angular conecta: wss://ytoledo.es/ytoledo/socket.io/
2. Nginx detecta: WebSocket upgrade
3. Nginx proxy: ws://ytoledo:5555/ytoledo/socket.io/
4. Node.js acepta conexión WebSocket
5. ✅ Comunicación en tiempo real establecida
```

## 🚀 **¿Por qué esta arquitectura es tan eficiente?**

### **División de responsabilidades:**
```
NGINX (Especialista en HTTP):
├── ⚡ Archivos estáticos (ultra rápido)
├── 🔒 SSL/HTTPS (optimizado)
├── 🌐 Múltiples dominios
├── 📦 Compresión automática
└── 🛡️ Seguridad y headers

NODE.JS (Especialista en lógica):
├── 🧠 Lógica de negocio
├── 🗄️ Base de datos
├── 🔌 WebSockets
├── 📧 Emails
└── 🔐 Autenticación
```

### **Rendimiento optimizado:**
```
Sin Nginx (solo Node.js):
├── Archivos estáticos: 100ms por archivo
├── SSL: Complejo de configurar
├── Múltiples dominios: Difícil
└── Escalabilidad: Limitada

Con Nginx + Node.js:
├── Archivos estáticos: 5ms por archivo
├── SSL: Automático con Let's Encrypt
├── Múltiples dominios: Fácil
└── Escalabilidad: Excelente
```

## 💡 **Analogías finales para recordar:**

### **Nginx = Recepcionista de hotel de lujo**
- **Eficiente**: Atiende múltiples huéspedes simultáneamente
- **Inteligente**: Sabe exactamente dónde enviar cada petición
- **Seguro**: Maneja todas las llaves (certificados SSL)
- **Rápido**: Entrega inmediatamente lo que tiene a mano

### **Node.js = Chef especializado**
- **Experto**: Prepara platos complejos (lógica de negocio)
- **Personalizado**: Cada petición es única
- **Conectado**: Acceso a la despensa (base de datos)
- **Comunicativo**: Habla con otros chefs (APIs externas)

### **Juntos = Restaurante de 5 estrellas**
- **Nginx**: Recibe, organiza, optimiza
- **Node.js**: Procesa, calcula, responde
- **Resultado**: Experiencia perfecta para el usuario
