FROM node:24.20.0-alpine

WORKDIR /cygnus
COPY package.json package-lock.json ./
RUN npm ci
COPY .next .next
COPY scripts/ scripts/
COPY src/ src/
COPY tsconfig.json tsconfig.json
RUN PAYLOAD_SECRET=migration-schema-check npm run migration:check

EXPOSE 3000

CMD ["sh", "scripts/docker-entrypoint.sh"]
