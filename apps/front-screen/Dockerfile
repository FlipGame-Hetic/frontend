FROM node:22-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

USER node
WORKDIR /home/node/app

ARG VITE_APP_NAME
ARG VITE_API_URL
ARG NODE_ENV=production

COPY --chown=node:node pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY --chown=node:node apps/front-screen/package.json ./apps/front-screen/
COPY --chown=node:node packages/ ./packages/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY --chown=node:node apps/front-screen/ ./apps/front-screen/

RUN pnpm --filter @frontend/front-screen build

EXPOSE 80

CMD ["pnpm", "--filter", "@frontend/front-screen", "preview", "--host", "0.0.0.0", "--port", "80"]