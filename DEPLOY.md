# Deploy — Fletea (producción)

Arquitectura objetivo:

```
fletea.com.ar / www.fletea.com.ar    →  Vercel        (frontend Angular)
api.fletea.com.ar                     →  VPS + Caddy   (backend Spring + Postgres)
```

El frontend hace requests cross-origin contra el backend. CORS está configurado en el backend para permitir el dominio de Vercel.

---

## 1. DNS (registrar del dominio)

Configurá en el panel de tu registrar (NIC.ar, GoDaddy, Cloudflare, etc.):

| Tipo  | Nombre         | Valor                                   | TTL  |
|-------|----------------|-----------------------------------------|------|
| A     | `@` (apex)     | `76.76.21.21` (Vercel anycast)          | 3600 |
| CNAME | `www`          | `cname.vercel-dns.com`                  | 3600 |
| A     | `api`          | `<IP pública del VPS>`                  | 3600 |

**Verificá la propagación** antes de continuar (puede tardar 5–60 min):
```bash
dig fletea.com.ar +short
dig www.fletea.com.ar +short
dig api.fletea.com.ar +short
```

---

## 2. Frontend en Vercel

### 2.1 Conectar el repo
1. Importá el repo a Vercel (https://vercel.com/new) — seleccioná esta carpeta.
2. **Root Directory**: `frontend`
3. **Framework Preset**: deciálo en blanco / Other (ya tenés `vercel.json` con todo configurado).
4. Build command, output dir, install command los toma automático del `vercel.json`.

### 2.2 Variables de entorno (Project Settings → Environment Variables)

Agregalas con scope **Production** (y opcionalmente Preview):

| Variable               | Valor                                          |
|------------------------|------------------------------------------------|
| `GOOGLE_MAPS_API_KEY`  | `AIza...` (tu API key restringida por dominio) |

> El script `scripts/inject-env.js` corre después de `ng build` y reemplaza el placeholder `__GOOGLE_MAPS_API_KEY__` en `dist/fletea/browser/index.html` con el valor de la variable.

### 2.3 Restringir la API key de Google Maps

En Google Cloud Console → APIs & Services → Credentials → tu key:
- **Application restrictions**: HTTP referrers (web sites)
- Restricciones permitidas:
  - `https://fletea.com.ar/*`
  - `https://www.fletea.com.ar/*`
  - `https://*.vercel.app/*` (para previews)
- **API restrictions**: Maps JavaScript API + Places API

### 2.4 Dominios

En Project Settings → Domains:
- Agregá `fletea.com.ar` y `www.fletea.com.ar`.
- Vercel verifica automáticamente y emite el certificado.

### 2.5 Trigger del primer deploy
Vercel deploya en cada push. El primer build te debería mostrar:
```
[inject-env] Injected GOOGLE_MAPS_API_KEY into .../index.html
```

### 2.6 URL del backend

`environment.prod.ts` apunta a `https://api.fletea.com.ar/api`. Si necesitás cambiarlo, editá ese archivo y volvés a deployar.

---

## 3. Backend en el VPS

### 3.1 Pre-requisitos en el VPS
- Ubuntu 22.04 / Debian 12 / similar
- Docker + Docker Compose plugin
- Puertos 80 y 443 abiertos (firewall)
- A-record `api.fletea.com.ar` → IP del VPS **propagado** (Caddy lo necesita para el ACME challenge)

```bash
# Instalar Docker (si no lo tenés)
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker

# Verificar puertos
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 3.2 Clonar el repo y configurar `.env`

```bash
git clone <tu-repo> /opt/fletea
cd /opt/fletea
cp .env.example .env
```

Editá `.env` con valores reales:

```bash
GOOGLE_MAPS_API_KEY=AIza...
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
FLETEA_FRONTEND_URL=https://www.fletea.com.ar
MERCADOPAGO_NOTIFICATION_URL=https://api.fletea.com.ar/api/payments/webhook
CORS_ALLOWED_ORIGINS=https://www.fletea.com.ar,https://fletea.com.ar,https://*.vercel.app
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<<password fuerte único>>
JWT_SECRET=<<openssl rand -base64 48>>
DB_PASSWORD=<<password fuerte único>>
```

> Generar JWT_SECRET fuerte: `openssl rand -base64 48`

### 3.3 Editar `Caddyfile`

Verificá el email para Let's Encrypt:
```caddy
{
    email tu-email-real@fletea.com.ar
}
```

### 3.4 Levantar todo

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Caddy va a:
1. Pedir el cert de Let's Encrypt para `api.fletea.com.ar` (HTTP-01 challenge en :80)
2. Empezar a servir HTTPS en :443

Verificar:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs caddy
docker compose -f docker-compose.prod.yml logs backend
```

### 3.5 Smoke test

```bash
# Desde tu laptop
curl -i https://api.fletea.com.ar/api/cotizacion \
  -H "Content-Type: application/json" \
  -d '{"origen":"Adolfo Alsina 2034, CABA","destino":"Belgrano, CABA"}'
```

Debería responder con un JSON `{ distanciaKm, costoTotal, montoSena }`.

### 3.6 Auto-restart en boot
Los services tienen `restart: unless-stopped`, así que si reiniciás el VPS, todo vuelve solo.

---

## 4. MercadoPago

### 4.1 Webhook
En tu app de MercadoPago (https://www.mercadopago.com.ar/developers/panel):
- **URL de notificaciones**: `https://api.fletea.com.ar/api/payments/webhook`
- Eventos: `payment`

### 4.2 Auto-return
Como `FLETEA_FRONTEND_URL=https://www.fletea.com.ar` ya **no** es localhost, el `MercadoPagoService` activa automáticamente `autoReturn=approved`. El usuario será redirigido tras el pago a:
- `https://www.fletea.com.ar/pago-exitoso`
- `https://www.fletea.com.ar/pago-fallido`
- `https://www.fletea.com.ar/pago-pendiente`

### 4.3 Test en sandbox
Usá las tarjetas de prueba de MercadoPago Argentina antes del go-live:
https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards

---

## 5. Operación

### Logs en vivo
```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f caddy
```

### Restart después de cambios en `.env`
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Update tras un push (backend)
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build backend
```

### Backup de Postgres
```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U fletea fleteadb | gzip > /opt/backups/fletea-$(date +%F).sql.gz
```

Recomendado: cron diario + sync a S3/B2/Backblaze.

### Renovación de certs
Caddy lo hace solo (renueva ~30 días antes del expire). No requiere acción manual.

---

## 6. Rollback rápido

### Frontend
En Vercel → Deployments → encontrá el último deploy bueno → "Promote to Production".

### Backend
```bash
cd /opt/fletea
git checkout <commit-sha-anterior>
docker compose -f docker-compose.prod.yml up -d --build backend
```

---

## 7. Checklist pre-go-live

- [ ] DNS A/CNAME propagados (`dig` confirma)
- [ ] Vercel project con dominios verificados y `GOOGLE_MAPS_API_KEY` seteada
- [ ] Google Maps key restringida por dominio (referrer)
- [ ] VPS con `.env` real, `docker-compose.prod.yml up -d` funcional
- [ ] Caddy emitió cert (no quedó en staging) — `curl -I https://api.fletea.com.ar/api/cotizacion` 200
- [ ] CORS funcional — desde el browser en `www.fletea.com.ar`, una request a `api.fletea.com.ar` pasa sin error
- [ ] MercadoPago webhook configurado con la URL del backend
- [ ] Probada una reserva end-to-end con tarjeta de test de MP
- [ ] `ADMIN_PASSWORD` y `JWT_SECRET` cambiados de los defaults
- [ ] Backup de Postgres programado
