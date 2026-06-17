FROM node:22-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

USER node
WORKDIR /home/node/app

ARG NODE_ENV=production

COPY --chown=node:node pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY --chown=node:node apps/dmd-screen/package.json ./apps/dmd-screen/
COPY --chown=node:node packages/ ./packages/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY --chown=node:node apps/dmd-screen/ ./apps/dmd-screen/

RUN pnpm --filter @frontend/dmd-screen build

EXPOSE 80

CMD ["/bin/sh", "apps/dmd-screen/entrypoint.sh"]
