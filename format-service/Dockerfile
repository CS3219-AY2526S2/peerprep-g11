# ---- builder ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY *.ts ./
COPY app ./app
RUN npm run build

# ---- runner ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Python + black for Python formatting
RUN apk add --no-cache python3 py3-pip && pip3 install --break-system-packages black

# JDK 17 + google-java-format for Java formatting
RUN apk add --no-cache openjdk17-jre-headless
ARG GJF_VERSION=1.25.2
RUN wget -q -O /opt/google-java-format.jar \
    "https://github.com/google/google-java-format/releases/download/v${GJF_VERSION}/google-java-format-${GJF_VERSION}-all-deps.jar"

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

EXPOSE 4003
CMD ["node", "dist/server.js"]
