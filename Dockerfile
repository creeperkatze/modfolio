FROM node:22-slim

LABEL org.opencontainers.image.source=https://github.com/creeperkatze/modfolio

WORKDIR /app

COPY package*.json pnpm-lock*.yaml ./

RUN npm install -g pnpm

RUN pnpm install --prod --frozen-lockfile

COPY . .

ENV CI=true
RUN cd frontend && pnpm install --frozen-lockfile && pnpm run build

RUN chown -R node:node /app

USER node

CMD ["pnpm", "start"]
