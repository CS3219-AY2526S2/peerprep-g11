# ---------- Stage 1: Install dependencies ----------
FROM node:22-alpine AS deps

WORKDIR /app

# Copy only package manifests first (maximises layer cache hits)
COPY package.json package-lock.json ./

# Install production + dev deps (dev deps needed for the build step)
# --ignore-scripts  prevents arbitrary postinstall scripts from running
# --no-audit / --no-fund  skip unnecessary network calls
RUN npm ci --ignore-scripts --no-audit --no-fund

# ---------- Stage 2: Build the application ----------
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------- Stage 3: Production image ----------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy the standalone server and static assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
