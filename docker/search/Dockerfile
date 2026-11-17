FROM node:24-bookworm-slim

RUN apt-get update \
    && apt-get install --no-install-recommends -y cron ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && npm install --global pnpm@11.22.0

ENV TZ=Etc/UTC
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json packages/db/package.json
COPY packages/search/package.json packages/search/package.json
COPY packages/search-tooling/package.json packages/search-tooling/package.json
RUN pnpm install --frozen-lockfile --filter @repo/search-tooling...

COPY packages/db packages/db
COPY packages/search packages/search
COPY packages/search-tooling packages/search-tooling
COPY docker/search/crontab /etc/cron.d/search-worker
COPY docker/search/run-job.sh /usr/local/bin/search-job
RUN chmod 0644 /etc/cron.d/search-worker \
    && chmod 0755 /usr/local/bin/search-job

CMD ["cron", "-f"]
