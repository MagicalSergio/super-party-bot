FROM node:alpine AS app

WORKDIR /app

RUN apk add --no-cache git python3 make g++ netcat-openbsd

COPY package*.json ./
RUN npm ci

COPY . .

# Копируем sslocal из официального образа shadowsocks-rust
FROM ghcr.io/shadowsocks/sslocal-rust:latest AS sslocal

FROM node:alpine

WORKDIR /app

# Копируем бинарник sslocal
COPY --from=sslocal /usr/bin/sslocal /usr/local/bin/sslocal

# Копируем собранное приложение
COPY --from=app /app /app

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY entrypoint.dev.sh /entrypoint.dev.sh
RUN chmod +x /entrypoint.dev.sh
