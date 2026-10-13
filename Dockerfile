FROM node:24-alpine AS build
WORKDIR /app
RUN wget -qO- https://get.pnpm.io/install.sh | env PNPM_VERSION=12.3.4 ENV=/root/.shrc SHELL=/bin/sh sh -
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH

COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm --dir apps/api install --no-lockfile && pnpm --dir apps/web install --no-lockfile

COPY apps ./apps
RUN pnpm --dir apps/web build && pnpm --dir apps/api build
RUN pnpm --dir apps/api install --prod --no-lockfile

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/web/dist ./apps/web/dist
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
