# Base Stage - Setup and Install
FROM node:20-slim AS base
WORKDIR /app
COPY . .
RUN npm install

# Build Shared Types (Dependency)
RUN npm run build -w packages/shared-types

# Admin Builder
FROM base AS admin-builder
RUN npm run build -w apps/web-admin

# Client Builder
FROM base AS client-builder
RUN npm run build -w apps/web-client

# Production Stage for Admin
FROM node:20-slim AS admin
WORKDIR /app
COPY --from=admin-builder /app/apps/web-admin/package.json ./apps/web-admin/
COPY --from=admin-builder /app/apps/web-admin/.next ./apps/web-admin/.next
COPY --from=admin-builder /app/apps/web-admin/public ./apps/web-admin/public
COPY --from=admin-builder /app/packages ./packages
COPY --from=admin-builder /app/node_modules ./node_modules
COPY --from=admin-builder /app/package.json ./

EXPOSE 3001
CMD ["npm", "run", "start", "-w", "apps/web-admin"]

# Production Stage for Client
FROM node:20-slim AS client
WORKDIR /app
COPY --from=client-builder /app/apps/web-client/package.json ./apps/web-client/
COPY --from=client-builder /app/apps/web-client/.next ./apps/web-client/.next
COPY --from=client-builder /app/apps/web-client/public ./apps/web-client/public
COPY --from=client-builder /app/packages ./packages
COPY --from=client-builder /app/node_modules ./node_modules
COPY --from=client-builder /app/package.json ./

EXPOSE 3000
CMD ["npm", "run", "start", "-w", "apps/web-client"]
