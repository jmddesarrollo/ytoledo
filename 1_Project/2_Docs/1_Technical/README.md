🚀 Rutina diaria de desarrollo
Después de reiniciar tu portátil, tu rutina será simplemente:

Verificar que MySQL esté corriendo (debería estar automáticamente):
sudo systemctl status mysql

Levantar el backend en dos sesiones:
cd 1_Project/1_Sources/backend
-- Compilar typescript
tsc -w
-- Levantar el servicio de Backend
npm start

Levantar el frontend:
cd 1_Project/1_Sources/frontend
ng serve
