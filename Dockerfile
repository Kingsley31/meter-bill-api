# Stage 1: Build
FROM node:22.11.0 AS builder

WORKDIR /app

# Copy only package files first (better caching)
COPY package*.json ./

# Install ALL deps (including dev, for build)
RUN npm ci

# Copy the rest of the source
COPY . .

# Build the app
RUN npm run build

# Stage 2: Production
FROM node:22.11.0-slim AS production

WORKDIR /app

# Copy only package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev --ignore-scripts

# Copy build output + node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

CMD ["node", "dist/src/main.js"]
