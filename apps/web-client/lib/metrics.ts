// Shim for Prometheus metrics to avoid build issues
// replacing with console logs as requested

export const register = {
    contentType: 'text/plain',
    metrics: async () => '# Metrics disabled'
};

class CounterShim {
    name: string;
    constructor(config: { name: string }) {
        this.name = config.name;
    }
    inc(labels?: any) {
        // console.log(`[Metrics] ${this.name} inc`, labels);
    }
}

class HistogramShim {
    name: string;
    constructor(config: { name: string }) {
        this.name = config.name;
    }
    observe(labels: any, value?: number) {
        if (typeof labels === 'number') {
            value = labels;
            labels = {};
        }
        // console.log(`[Metrics] ${this.name} observe ${value}`, labels);
    }
}

export const clientRequestsTotal = new CounterShim({ name: 'client_requests_total' });

export default register;
