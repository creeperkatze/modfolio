FROM node:22-slim

LABEL org.opencontainers.image.source=https://github.com/creeperkatze/modfolio

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/docs/package.json ./apps/docs/

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .

ENV CI=true
RUN pnpm --filter modfolio-web build
RUN pnpm --filter modfolio-api build

RUN chown -R node:node /app

USER node

CMD ["pnpm", "api:start"]
