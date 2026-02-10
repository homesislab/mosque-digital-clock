import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

// Create a Registry which registers the metrics
const register = new Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
    app: 'mosque-digital-clock-admin'
});

// Enable the collection of default metrics
if (process.env.NEXT_RUNTIME === 'nodejs' && typeof window === 'undefined') {
    collectDefaultMetrics({ register });
}

// Define custom metrics
export const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [register],
});

export const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // standard buckets
    registers: [register],
});

export const databaseErrorsTotal = new Counter({
    name: 'database_errors_total',
    help: 'Total number of database errors',
    labelNames: ['operation'],
    registers: [register],
});

export default register;
