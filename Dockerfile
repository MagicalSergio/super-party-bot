# ---------- build stage ----------
FROM node:alpine AS builder

WORKDIR /app

RUN apk add --no-cache git python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- runtime stage ----------
FROM node:alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

CMD ["npm", "run", "start"]
