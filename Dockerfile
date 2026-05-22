FROM node:24.16.0-alpine

WORKDIR /cygnus
COPY package.json package-lock.json ./
RUN npm ci
COPY .next .next
COPY scripts/ scripts/
COPY src/ src/
COPY tsconfig.json tsconfig.json

EXPOSE 3000

CMD ["sh", "scripts/docker-entrypoint.sh"]
