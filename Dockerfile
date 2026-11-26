FROM node:26-alpine AS base

WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm install --global corepack@latest
RUN corepack enable pnpm

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm build

FROM node:26-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Pre-create ms-playwright directory and set permissions for node user
RUN mkdir -p /ms-playwright /app \
    && chown -R node:node /ms-playwright /app

# Install minimal Chromium system dependencies and clean up cache in the same layer
RUN apt-get update \
    && npx -y playwright@1.65.1 install-deps chromium \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /root/.npm

USER node

COPY --chown=node:node package.json ./

# Install production dependencies without auto-downloading browsers,
# then install strictly chromium_headless_shell and clean up caches and unnecessary ffmpeg
RUN PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --omit=dev --ignore-scripts \
    && npx playwright install --only-shell chromium \
    && rm -rf /ms-playwright/ffmpeg* ~/.npm \
    && npm cache clean --force

COPY --chown=node:node --from=build /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/index.js"]
