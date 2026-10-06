FROM node:22-slim AS web

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN corepack enable
RUN pnpm install --frozen-lockfile --filter modfolio-web

COPY apps/web ./apps/web

ENV CI=true
RUN pnpm --filter modfolio-web build


FROM rust:1-slim-trixie AS api

WORKDIR /app/apps/api

# build.rs reads the release version from the root package.json.
COPY package.json /app/package.json

# Build dependencies in their own layer so source changes don't recompile them.
COPY apps/api/Cargo.toml apps/api/Cargo.lock apps/api/build.rs ./
RUN mkdir src && echo 'fn main() {}' > src/main.rs && touch src/lib.rs \
    && cargo build --release --locked \
    && rm -rf src

COPY apps/api/src ./src
RUN touch src/main.rs src/lib.rs && cargo build --release --locked


FROM debian:trixie-slim

LABEL org.opencontainers.image.source=https://github.com/creeperkatze/modfolio

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --no-create-home modfolio

# The server resolves public/ and ../web/dist relative to this directory.
WORKDIR /app/apps/api

COPY --from=api /app/apps/api/target/release/modfolio-api /usr/local/bin/modfolio-api
COPY apps/api/public ./public
COPY --from=web /app/apps/web/dist /app/apps/web/dist

USER modfolio

EXPOSE 3000

CMD ["modfolio-api"]
