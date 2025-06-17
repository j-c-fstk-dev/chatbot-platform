# Etapa 1: Instala dependências
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Etapa 2: Build do código TypeScript
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Etapa 3: Imagem final para produção/dev
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.env ./
COPY --from=builder /app/uploads ./uploads
COPY --from=builder /app/logs ./logs
EXPOSE 8000
CMD ["node", "dist/index.js"]
