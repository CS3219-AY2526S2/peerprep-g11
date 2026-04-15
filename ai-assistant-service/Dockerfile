# ---- builder ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ---- runner ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4002

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 4002

CMD ["node", "dist/server.js"]
