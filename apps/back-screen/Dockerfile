FROM node:22-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

USER node
WORKDIR /home/node/app

ARG NODE_ENV=production
# Vite bakes VITE_* vars into the bundle at build time, pass them via --build-arg
ARG VITE_SCREEN_HUB_URL
ARG VITE_SCREEN_TOKEN

COPY --chown=node:node pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY --chown=node:node apps/back-screen/package.json ./apps/back-screen/
COPY --chown=node:node packages/ ./packages/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY --chown=node:node apps/back-screen/ ./apps/back-screen/

RUN VITE_SCREEN_HUB_URL=$VITE_SCREEN_HUB_URL \
    VITE_SCREEN_TOKEN=$VITE_SCREEN_TOKEN \
    pnpm --filter @frontend/back-screen build

EXPOSE 80

CMD ["pnpm", "--filter", "@frontend/back-screen", "preview", "--host", "0.0.0.0", "--port", "80"]
