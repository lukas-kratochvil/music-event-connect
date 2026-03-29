#-------------------------------------------
# BASE
#-------------------------------------------
FROM node:20-alpine AS base

WORKDIR /app


#-------------------------------------------
# BUILD BASE
#-------------------------------------------
FROM base AS builder-base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable pnpm


#-------------------------------------------
# BUILD
#-------------------------------------------
FROM builder-base AS builder

RUN pnpm install -g turbo@^2

COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace (https://turbo.build/repo/docs/guides/tools/docker#the-solution).
RUN turbo prune web --docker


#-------------------------------------------
# DEVELOPMENT
#-------------------------------------------
FROM builder-base AS development

# Copy over only what we need to install the packages.
# Splitting up dependencies and source files in this way lets us only install dependencies when they change - giving us a much larger speedup.
COPY --from=builder /app/out/json/ .
RUN pnpm i --frozen-lockfile

# Copy over the source files.
COPY --from=builder /app/out/full/ .


#-------------------------------------------
# INSTALL
#-------------------------------------------
FROM development AS installer

# Build the project.
RUN pnpm turbo run build --filter=web


#-------------------------------------------
# PRODUCTION
#-------------------------------------------
FROM nginx:1.25.5-alpine

# Problem of specifying custom ENTRYPOINT shell script in Nginx image: https://github.com/nginxinc/docker-nginx/issues/422#issuecomment-644299743.
# That's why we copy our script to the '/docker-entrypoint.d' directory. Scripts inside this directory are executed before Nginx is.
COPY apps/web/config-copy.sh /docker-entrypoint.d/config-copy.sh
RUN chmod +x /docker-entrypoint.d/config-copy.sh

COPY apps/web/nginx /etc/nginx
COPY --from=installer /app/apps/web/dist /usr/share/nginx/html

CMD [ "nginx", "-g", "daemon off;" ]
