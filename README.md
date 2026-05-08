# Muvi - Plataforma de Fletes y Mudanzas

## Estructura del Proyecto

```
proyectoFlete-Muvi/
├── backend/          (Spring Boot - Java 17)
│   └── src/main/java/com/muvi/
│       ├── config/         → Configuración CORS
│       ├── controller/     → REST Controllers
│       ├── dto/            → Request/Response DTOs
│       ├── model/          → Entidades JPA
│       ├── repository/     → Repositorios Spring Data
│       └── service/        → Lógica de negocio
├── frontend/         (Angular 17 - Standalone)
│   └── src/app/
│       ├── pages/landing/  → Landing page con animación canvas
│       ├── pages/admin/    → Dashboard de administración
│       ├── pages/pago-resultado/ → Resultado del pago
│       └── services/       → Servicios HTTP
```

## Requisitos

- Java 17+
- Node.js 18+
- Maven 3.8+

## Configuración

### Variables de entorno (Backend)

```bash
GOOGLE_MAPS_API_KEY=tu_api_key_de_google_maps
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_de_mercadopago
```

### Google Maps API

Habilitar en Google Cloud Console:
- Maps JavaScript API (frontend - autocomplete)
- Distance Matrix API (backend - cálculo de distancia)

### Mercado Pago

Obtener credenciales en: https://www.mercadopago.com.ar/developers

## Ejecución

### Backend

```bash
cd backend
mvn spring-boot:run
```

El servidor arranca en `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
ng serve
```

La aplicación arranca en `http://localhost:4200`

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/cotizacion` | Calcula precio según origen/destino |
| POST | `/api/reservas` | Crea reserva y genera link de pago |
| GET | `/api/reservas` | Lista todas las reservas (admin) |
| POST | `/api/payments/webhook` | Webhook de Mercado Pago |

## Lógica de Cotización

1. Se calcula la ruta cerrada: Base → Origen → Destino → Base
2. Base fija: Adolfo Alsina 2034, Capital Federal
3. Precio: km totales × $4.025
4. Seña: 15% del total (se paga via Mercado Pago)

## Para producción

Cambiar en `application.yml`:
- Datasource a PostgreSQL
- URLs de back_urls de Mercado Pago al dominio real
- notification_url al endpoint público del webhook
