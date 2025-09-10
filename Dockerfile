# Stage 1: Build the application
FROM node:22.11.0-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (dev included for build)
RUN npm ci

# Copy source code
COPY . .

# Build the Nest.js application
RUN npm run build

# Stage 2: Run the application
FROM node:22.11.0-alpine AS runner

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 3000

# Start the app
CMD ["node", "dist/main"]
