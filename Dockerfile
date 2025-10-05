# Stage 1: Build
FROM node:22.11.0 AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build


# Stage 2: Production
FROM node:22.11.0-slim AS production

WORKDIR /app

# Install system dependencies for Chromium (required by Puppeteer)
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
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev --ignore-scripts

# Install Chrome binary that Puppeteer expects
RUN npx puppeteer browsers install chrome

# Copy build and node_modules from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

CMD ["node", "dist/src/main.js"]
