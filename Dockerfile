FROM node:22-slim

LABEL org.opencontainers.image.source=https://github.com/creeperkatze/modfolio

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .

ENV CI=true
RUN pnpm --filter ./apps/frontend build
RUN pnpm --filter ./apps/backend build

RUN chown -R node:node /app

USER node

CMD ["pnpm", "backend:start"]
