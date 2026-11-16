# TransPort 3000 S.A

Aplicación para administrar vehículos, conductores y viajes de una empresa de transporte. El proyecto separa la API REST y la interfaz, como en los trabajos prácticos anteriores.

## Requisitos

- Node.js y npm.
- MySQL con la base `transporte_tp3`.

El backend se conecta exclusivamente a `transporte_tp3`. No crea ni selecciona otras bases de datos.

## Preparación

1. Verificar que existan las tablas `usuarios`, `vehiculos`, `conductores` y `viajes` en `transporte_tp3`. Las definiciones están en `backend/schema.sql`; ejecutar ese archivo solo si todavía no existen.
2. Copiar `backend/.env.example` como `backend/.env` y completar los datos de conexión de MySQL y una clave JWT aleatoria.
3. En una terminal, ejecutar `cd backend`, `npm install` y `npm run dev`.
4. En otra terminal, ejecutar `cd frontend`, `npm install` y `npm run dev`.
5. Abrir la dirección que indique Vite (por defecto `http://localhost:5173`).

La API escucha en el puerto `3001` por defecto. El registro y el inicio de sesión son públicos; el resto de las rutas requieren un token JWT válido, que vence a las cuatro horas.

## API

| Recurso | Métodos | Acceso |
|---|---|---|
| `/api/auth/register`, `/api/auth/login` | POST | Público |
| `/api/auth/me` | GET | Autenticado |
| `/api/vehiculos`, `/api/vehiculos/:id` | GET, POST, PUT, DELETE | Autenticado |
| `/api/conductores`, `/api/conductores/:id` | GET, POST, PUT, DELETE | Autenticado |
| `/api/viajes`, `/api/viajes/:id` | GET, POST, PUT, DELETE | Autenticado |
| `/api/viajes/resumen` | GET | Autenticado |

Las listas admiten `limit` (1–100) y `offset` (0 o mayor). Los viajes se pueden filtrar por `vehiculoId` o `conductorId`. El resumen devuelve los kilómetros acumulados para cada vehículo y conductor. Los errores de validación responden 400; las credenciales inválidas, 401; los recursos inexistentes, 404; las duplicaciones y restricciones de claves foráneas, 409; y los errores inesperados, 500.

Los ejemplos para probar la API están en `backend/api.http`. Las contraseñas se almacenan con bcrypt y nunca se incluyen en las respuestas. En un entorno publicado, el servidor debe exponerse mediante HTTPS para proteger las credenciales durante el transporte.
