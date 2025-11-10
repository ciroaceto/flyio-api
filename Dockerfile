# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder
RUN apk update && apk upgrade --no-cache
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Build backend TypeScript
FROM node:20-alpine AS backend-builder
RUN apk update && apk upgrade --no-cache
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY *.ts ./
COPY tsconfig.json ./
RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine
RUN apk update && apk upgrade --no-cache
WORKDIR /app

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy backend dependencies and built files
COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY --from=backend-builder /app/dist ./dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Change ownership of the app directory to the non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/server.js"]

