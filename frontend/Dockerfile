FROM node:18-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ .
COPY webp/ /webp-source/
RUN mkdir -p src/assets/webp && cp /webp-source/* src/assets/webp/
RUN npx ng build --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/muvi-fletes/browser /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
