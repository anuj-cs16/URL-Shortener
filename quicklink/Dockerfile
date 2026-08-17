# ===========================
# Stage 1: Build React Client
# ===========================
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Install client dependencies
COPY client/package*.json ./
RUN npm ci --production=false

# Copy client source and build
COPY client/ ./
RUN npm run build

# ===========================
# Stage 2: Production Server
# ===========================
FROM node:20-alpine

WORKDIR /app

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Install production dependencies only
COPY package*.json ./
RUN npm ci --production

# Copy backend source files
COPY server.js ./
COPY config/ ./config/
COPY controllers/ ./controllers/
COPY middleware/ ./middleware/
COPY models/ ./models/
COPY routes/ ./routes/
COPY utils/ ./utils/
COPY templates/ ./templates/
COPY public/ ./public/

# Copy built React client from builder stage
COPY --from=client-builder /app/client/build ./client/build

# Set ownership
RUN chown -R nodeuser:nodejs /app

USER nodeuser

# Set environment
ENV NODE_ENV=production

# Expose port (Cloud Run uses PORT env var, default 8080)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start command
CMD ["node", "server.js"]
