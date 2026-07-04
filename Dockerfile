FROM node:22-slim AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm web:build
RUN pnpm api:build

RUN pnpm install --prod --frozen-lockfile

FROM node:22-slim AS runner

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/public ./apps/api/public
COPY --from=builder /app/apps/web/dist ./apps/web/dist

USER node

CMD ["pnpm", "api:start"]
