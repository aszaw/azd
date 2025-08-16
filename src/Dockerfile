
FROM node:20-bookworm AS deps
WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

FROM node:20-bookworm AS build
WORKDIR /app

ENV HOME=/tmp \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# copy Next.js standalone server, static assets, and public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3003
CMD ["node", "server.js"]
