# Fletea — Plataforma de Fletes y Mudanzas

Servicio web full-stack de cotización y reserva de fletes con animación scroll-driven y pago integrado vía Mercado Pago.

## Estructura del Proyecto

```
proyectoFlete-Muvi/                           ← directorio raíz (legado del nombre)
├── backend/          (Spring Boot - Java 17)
│   └── src/main/java/com/fletea/
│       ├── config/         → CORS, JWT filter
│       ├── controller/     → REST controllers (auth, cotizacion, reservas, webhook)
│       ├── dto/            → Request/Response DTOs
│       ├── model/          → Entidades JPA (Reserva, EstadoReserva)
│       ├── repository/     → Repositorios Spring Data
│       └── service/        → Lógica de negocio (PricingEngine, MercadoPago, JWT)
├── frontend/         (Angular 17 - Standalone components)
│   └── src/app/
│       ├── pages/landing/         → Hero scroll-driven, formulario, modal
│       ├── pages/admin/           → Login JWT + dashboard reservas
│       ├── pages/pago-resultado/  → 3 estados (exitoso/fallido/pendiente)
│       └── services/              → Servicios HTTP + Auth
├── design_handoff_fletea_landing/  → Design reference (no se modifica)
├── docker-compose.yml
└── .env
```

## Requisitos

- Docker + Docker Compose (recomendado)
- Para dev local: Java 17, Maven 3.8+, Node 18+

## Configuración

### Variables de entorno (`.env`)

Copiá `.env.example` → `.env` y completá:

```bash
GOOGLE_MAPS_API_KEY=AIza...
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_NOTIFICATION_URL=https://www.fletea.com.ar/api/payments/webhook
FLETEA_FRONTEND_URL=https://www.fletea.com.ar
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_password_seguro
JWT_SECRET=tu_secreto_jwt_min_32_caracteres
DB_PASSWORD=tu_password_postgres
```

### Google Maps API
Habilitar en Google Cloud Console:
- Maps JavaScript API (frontend - autocomplete)
- Distance Matrix API (backend - cálculo de distancia)

### Mercado Pago
Obtener credenciales en https://www.mercadopago.com.ar/developers

## Ejecución

### Docker (recomendado)
```bash
docker compose up --build
```
- Frontend: http://localhost:4200
- Backend: http://localhost:8080
- PostgreSQL: 127.0.0.1:5432 (bind solo local)

### Dev local
**Backend** (H2 en memoria):
```bash
cd backend
mvn spring-boot:run
```

**Frontend**:
```bash
cd frontend
npm install
npm start
```

## API Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/login` | – | Login admin → JWT |
| GET  | `/api/auth/verify` | JWT | Verifica token |
| POST | `/api/cotizacion` | – | Cotización origen→destino |
| POST | `/api/reservas` | – | Crea reserva + link de pago MP |
| GET  | `/api/reservas` | JWT | Lista todas las reservas |
| POST | `/api/payments/webhook` | – | Webhook Mercado Pago |

## Lógica de Cotización

1. Ruta cerrada: Base → Origen → Destino → Base (Distance Matrix)
2. Base fija: Adolfo Alsina 2034, Capital Federal
3. Precio: algoritmo no lineal (ver `PricingEngine.java`) con descuento del 15%
4. Seña: 15% del costo total, se cobra vía MercadoPago

## Stack

- **Backend**: Spring Boot 3.2 (Java 17), Spring Data JPA, Hibernate, PostgreSQL (prod) / H2 (dev), JJWT, MercadoPago SDK 2.1
- **Frontend**: Angular 17 standalone, Inter font, Canvas-based scroll animation (160 frames WebP), Google Places autocomplete
- **Infra**: Docker, Nginx (frontend reverse proxy + gzip + static cache)

## Producción

1. Comprar dominio (ej. `fletea.com.ar`) y apuntar A-record al servidor
2. Configurar TLS (Let's Encrypt + Certbot, o detrás de un reverse proxy con HTTPS)
3. En el `.env` de producción:
   - `FLETEA_FRONTEND_URL=https://www.fletea.com.ar` (activa `autoReturn` en MercadoPago)
   - `MERCADOPAGO_NOTIFICATION_URL=https://www.fletea.com.ar/api/payments/webhook`
   - Cambiar `ADMIN_PASSWORD`, `JWT_SECRET`, `DB_PASSWORD` por valores fuertes y únicos
4. `docker compose up -d --build`

### Pendientes antes del deploy
- Reemplazar handles sociales en `frontend/src/app/pages/landing/landing.component.ts` (placeholders en `socialLinks`: WhatsApp, Instagram, Facebook, TikTok)
- (Opcional) Sustituir bubbles JPEGs por íconos oficiales de cada red en `frontend/src/assets/social-*.jpeg`
