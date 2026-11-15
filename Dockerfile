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

FROM mcr.microsoft.com/playwright:v1.65.1 AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=build /app/dist ./dist

# Use the non-root user included in the official Playwright container
USER pwuser

EXPOSE 8080

CMD ["node", "dist/index.js"]
