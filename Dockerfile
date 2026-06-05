FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable && yarn install --immutable

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN ./node_modules/.bin/tsc -p tsconfig.build.json

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable && yarn install --immutable
COPY --from=builder /app/build ./build
CMD ["node", "build/index.js"]
