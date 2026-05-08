# VaFlete - Plataforma de Fletes y Mudanzas

## Estructura del Proyecto

```
proyectoFlete-VaFlete/
├── backend/          (Spring Boot - Java 17)
│   └── src/main/java/com/vaflete/
│       ├── config/         → Configuración CORS y JWT
│       ├── controller/     → REST Controllers
│       ├── dto/            → Request/Response DTOs
│       ├── model/          → Entidades JPA
│       ├── repository/     → Repositorios Spring Data
│       └── service/        → Lógica de negocio
├── frontend/         (Angular 17 - Standalone)
│   └── src/app/
│       ├── pages/landing/         → Landing page con animación canvas
│       ├── pages/admin/           → Panel admin con login JWT
│       ├── pages/pago-resultado/  → Resultado del pago
│       └── services/              → Servicios HTTP + Auth
```

## Requisitos

- Docker + Docker Compose
- (opcional) Java 17 + Maven 3.8 para correr el backend localmente

## Configuración

### Variables de entorno

Copiá `.env.example` a `.env` y completá los valores:

```bash
GOOGLE_MAPS_API_KEY=tu_api_key
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_NOTIFICATION_URL=https://vaflete.com/api/payments/webhook
VAFLETE_FRONTEND_URL=https://vaflete.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_password_seguro
JWT_SECRET=secreto_min_32_caracteres
DB_PASSWORD=password_postgres
```

### Google Maps API
Habilitar en Google Cloud Console:
- Maps JavaScript API (frontend - autocomplete)
- Distance Matrix API (backend - cálculo de distancia)

### Mercado Pago
Obtener credenciales en: https://www.mercadopago.com.ar/developers

## Ejecución

### Con Docker (recomendado)
```bash
docker compose up --build
```
- Frontend: http://localhost:4200
- Backend: http://localhost:8080
- PostgreSQL: localhost:5432 (solo bind local)

### Local (dev)

**Backend:**
```bash
cd backend
mvn spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
ng serve
```

## API Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/login` | – | Login admin → devuelve JWT |
| POST | `/api/cotizacion` | – | Calcula precio según origen/destino |
| POST | `/api/reservas` | – | Crea reserva y genera link de pago |
| GET | `/api/reservas` | JWT | Lista todas las reservas (admin) |
| POST | `/api/payments/webhook` | – | Webhook de Mercado Pago |

## Lógica de Cotización

1. Se calcula la ruta cerrada: Base → Origen → Destino → Base
2. Base fija: Adolfo Alsina 2034, Capital Federal
3. Precio: algoritmo no lineal con descuento del 15%
4. Seña: 15% del total (se paga vía Mercado Pago)

## Producción

1. Comprar dominio (ej. `vaflete.com`) y apuntar al servidor
2. Configurar TLS (Let's Encrypt + Certbot, o detrás de un reverse proxy con HTTPS)
3. En `.env`:
   - `VAFLETE_FRONTEND_URL=https://vaflete.com` (activa `autoReturn` en MercadoPago)
   - `MERCADOPAGO_NOTIFICATION_URL=https://vaflete.com/api/payments/webhook`
   - Cambiar `ADMIN_PASSWORD`, `JWT_SECRET`, `DB_PASSWORD` por valores fuertes y únicos
4. `docker compose up -d --build`
