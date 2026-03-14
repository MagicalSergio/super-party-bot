#!/bin/sh -x

sslocal \
  -b 127.0.0.1:1080 \
  -s "$SS_SERVER:$SS_PORT" \
  -m "$SS_METHOD" \
  -k "$SS_PASSWORD" &

# Ждём пока порт 1080 откроется
echo "Waiting for sslocal..."
until nc -z 127.0.0.1 1080; do
  sleep 0.5
done
echo "sslocal is ready"

npm run build

exec npm run start
