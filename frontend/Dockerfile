FROM node:18-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ .
COPY webp/ /webp-source/
RUN mkdir -p src/assets/webp && cp /webp-source/* src/assets/webp/
RUN npx ng build --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/vaflete/browser /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

RUN echo '#!/bin/sh' > /docker-entrypoint-init.sh && \
    echo 'sed -i "s|__GOOGLE_MAPS_API_KEY__|$GOOGLE_MAPS_API_KEY|g" /usr/share/nginx/html/index.html' >> /docker-entrypoint-init.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint-init.sh && \
    chmod +x /docker-entrypoint-init.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint-init.sh"]
