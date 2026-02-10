# Base Stage - Setup and Install
FROM node:20 AS base
WORKDIR /app

# Install build essentials for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libc6 \
    && rm -rf /var/lib/apt/lists/*

# Copy root package files
# We remove package-lock.json to let npm resolve the correct native bindings for the container
COPY package.json ./

# Copy all package.json files for workspaces
COPY apps/web-admin/package.json ./apps/web-admin/
COPY apps/web-client/package.json ./apps/web-client/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies (all workspaces)
RUN npm install

# Copy the rest of the source code
COPY . .

# Build Shared Types
RUN npm run build -w packages/shared-types

# Admin Builder
FROM base AS admin-builder
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Force build-time dummy DB URL
ENV DATABASE_URL=mysql://dummy:dummy@localhost:3306/dummy
RUN npm run build -w apps/web-admin

# Client Builder
FROM base AS client-builder
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build -w apps/web-client

# Production Stage for Admin
FROM node:20-slim AS admin
WORKDIR /app
ENV NODE_ENV=production
COPY --from=admin-builder /app/package.json ./
COPY --from=admin-builder /app/node_modules ./node_modules
COPY --from=admin-builder /app/apps/web-admin/package.json ./apps/web-admin/
COPY --from=admin-builder /app/apps/web-admin/.next ./apps/web-admin/.next
COPY --from=admin-builder /app/apps/web-admin/public ./apps/web-admin/public
COPY --from=admin-builder /app/apps/web-admin/init-db.js ./apps/web-admin/
COPY --from=admin-builder /app/apps/web-admin/schema.sql ./apps/web-admin/
COPY --from=admin-builder /app/packages ./packages

EXPOSE 3001
CMD ["npm", "run", "start", "-w", "apps/web-admin"]

# Production Stage for Client
FROM node:20-slim AS client
WORKDIR /app
ENV NODE_ENV=production
COPY --from=client-builder /app/package.json ./
COPY --from=client-builder /app/node_modules ./node_modules
COPY --from=client-builder /app/apps/web-client/package.json ./apps/web-client/
COPY --from=client-builder /app/apps/web-client/.next ./apps/web-client/.next
COPY --from=client-builder /app/apps/web-client/public ./apps/web-client/public
COPY --from=client-builder /app/packages ./packages

EXPOSE 3000
CMD ["npm", "run", "start", "-w", "apps/web-client"]
