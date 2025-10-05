# Stage 1: Build
FROM node:22.11.0 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# Stage 2: Production
FROM node:22.11.0-slim AS production

WORKDIR /app

# Install dependencies required by Chromium for Puppeteer
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    libxkbcommon0 \ 
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy only package files and install prod deps
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Install Chrome for Puppeteer
RUN npx puppeteer browsers install chrome

# Copy built files and node_modules from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
