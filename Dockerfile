# Multi-stage Dockerfile for Fidelio production
FROM node:24-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/src/server ./src/server

EXPOSE 3000

CMD ["node", "src/server/prodServer.ts"]
