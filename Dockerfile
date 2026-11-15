# -----------------------------------------------------------------------------
# Stage 1: Build TypeScript source
# -----------------------------------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install --ignore-scripts

COPY src/ ./src/
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Production runtime image with Playwright Chromium
# -----------------------------------------------------------------------------
FROM mcr.microsoft.com/playwright:v1.49.0-jammy AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Use the non-root user included in the official Playwright container
USER pwuser

EXPOSE 8080

CMD ["node", "dist/index.js"]
