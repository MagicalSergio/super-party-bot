FROM node:alpine
WORKDIR /app/

COPY package*.json ./

RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

RUN npm i

COPY . .

RUN npm run build
RUN npm run start

CMD ["npm", "run", "dev"]
