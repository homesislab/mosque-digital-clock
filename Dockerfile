# Build Stage
FROM node:20-slim AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Production Stage for Admin
FROM node:20-slim AS admin
WORKDIR /app
COPY --from=builder /app/apps/web-admin/package.json ./apps/web-admin/
COPY --from=builder /app/apps/web-admin/.next ./apps/web-admin/.next
COPY --from=builder /app/apps/web-admin/public ./apps/web-admin/public
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3001
CMD ["npm", "run", "start", "-w", "apps/web-admin"]

# Production Stage for Client
FROM node:20-slim AS client
WORKDIR /app
COPY --from=builder /app/apps/web-client/package.json ./apps/web-client/
COPY --from=builder /app/apps/web-client/.next ./apps/web-client/.next
COPY --from=builder /app/apps/web-client/public ./apps/web-client/public
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["npm", "run", "start", "-w", "apps/web-client"]
