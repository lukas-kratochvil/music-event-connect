#-------------------------------------------
# BASE
#-------------------------------------------
FROM node:20-bullseye AS base

WORKDIR /app

# Tell Puppeteer to store Chrome inside the specified directory, not in a user's home folder (~/.cache/puppeteer).
# (When the user is not defined it defaults to the root user: /root/.cache/puppeteer/chrome-headless-shell and /root/.cache/puppeteer/chrome).
ENV PUPPETEER_CACHE_DIR="/app/.cache/puppeteer"

# Install dependencies required by Chromium, see https://pptr.dev/troubleshooting#chrome-doesnt-launch-on-linux.
RUN apt-get update && apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*


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
RUN turbo prune scraper --docker


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
RUN pnpm turbo run build --filter=scraper
# Create isolated portable package.
RUN pnpm --filter scraper --prod deploy pruned


#-------------------------------------------
# PRODUCTION
#-------------------------------------------
FROM base

# Don't run production as root.
# Remove default Node user and create a new one.
RUN deluser --remove-home node \
  && groupadd -r node \
  # The '-m' flag is required by Puppeteer's Chrome browser to write its data.
  && useradd -r -m -g node scraper
USER scraper

COPY --from=installer --chown=scraper:node /app/.cache/puppeteer ./.cache/puppeteer
COPY --from=installer --chown=scraper:node /app/pruned/node_modules ./node_modules
COPY --from=installer --chown=scraper:node /app/pruned/dist ./dist

CMD [ "sh", "-c", "exec node dist/main" ]
