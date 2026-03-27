# SquadPay Dashboard — Multi-stage build for Akash
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++ sqlite-dev
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .
COPY packages/agent-wallet/package.json packages/agent-wallet/
COPY apps/dashboard/package.json apps/dashboard/
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ sqlite-dev
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/agent-wallet/node_modules ./packages/agent-wallet/node_modules
COPY --from=deps /app/apps/dashboard/node_modules ./apps/dashboard/node_modules
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .
COPY tsconfig.base.json .
COPY packages/ packages/
COPY apps/dashboard/ apps/dashboard/
WORKDIR /app/apps/dashboard
RUN pnpm build

FROM node:20-alpine AS runner
RUN apk add --no-cache sqlite-dev
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .
COPY tsconfig.base.json .
COPY packages/agent-wallet/package.json packages/agent-wallet/
COPY packages/agent-wallet/src/ packages/agent-wallet/src/
COPY apps/dashboard/package.json apps/dashboard/
COPY apps/dashboard/.next/ apps/dashboard/.next/
COPY apps/dashboard/app/ apps/dashboard/app/
COPY apps/dashboard/next.config.ts apps/dashboard/
COPY apps/dashboard/postcss.config.mjs apps/dashboard/
COPY apps/dashboard/tailwind.config.ts apps/dashboard/
COPY apps/dashboard/tsconfig.json apps/dashboard/
COPY apps/dashboard/next-env.d.ts apps/dashboard/
RUN pnpm install --frozen-lockfile --prod 2>/dev/null || pnpm install --prod
WORKDIR /app/apps/dashboard
EXPOSE 3000
CMD ["pnpm", "start"]