FROM node:22-slim

LABEL org.opencontainers.image.source=https://github.com/creeperkatze/modfolio

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

RUN pnpm install --frozen-lockfile

COPY . .

ENV CI=true
RUN pnpm --filter ./apps/frontend build
RUN pnpm --filter ./apps/backend build

RUN chown -R node:node /app

USER node

CMD ["pnpm", "backend:start"]
