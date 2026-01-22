# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy all dependencies for build stage
FROM node:20-alpine AS deps-all

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm ci

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Copy dependencies
COPY --from=deps-all /app/node_modules ./node_modules
COPY package*.json ./

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ============================================
# Stage 3: Production Runner
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install only what's needed for runtime
RUN apk add --no-cache openssl dumb-init

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# Set ownership
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command (API server)
CMD ["node", "dist/main.js"]

