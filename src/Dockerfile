FROM node:20-bookworm AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-bookworm AS build
WORKDIR /app

COPY --from=deps ./app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

COPY --from=build ./public ./public

EXPOSE 3003