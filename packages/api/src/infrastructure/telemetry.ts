import type { Meter } from '@opentelemetry/api';
import { metrics } from '@opentelemetry/api';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NodeSDK } from '@opentelemetry/sdk-node';

const prometheusExporter = new PrometheusExporter({
	port: 9464,
	endpoint: '/metrics',
});

const sdk = new NodeSDK({
	metricReader: prometheusExporter,
	instrumentations: [
		new HttpInstrumentation(),
		new FastifyInstrumentation(),
	],
});

if (!process.env.VITEST) {
	sdk.start();
}

const meter = metrics.getMeter('alentapp-api');

export function createREDMetrics(meter: Meter) {
	const requestCounter = meter.createCounter('http.requests.total', {
		description: 'Total de requests HTTP',
	});
	const errorCounter = meter.createCounter('http.requests.errors', {
		description: 'Total de errores HTTP',
	});
	const requestDuration = meter.createHistogram('http.request.duration', {
		description: 'Duracion de requests',
		unit: 'ms',
	});
	return { requestCounter, errorCounter, requestDuration };
}

const { requestCounter, errorCounter, requestDuration } = createREDMetrics(meter);

export { requestCounter, errorCounter, requestDuration };

let activeRequests = 0;

export function incrementActiveRequests() {
	activeRequests++;
}

export function decrementActiveRequests() {
	activeRequests--;
}

meter.createObservableGauge('http.requests.active', {
	description: 'Requests concurrentes',
}).addCallback(result => result.observe(activeRequests));

meter.createObservableGauge('process.memory.usage', {
	description: 'Memoria del proceso en bytes',
}).addCallback(result => result.observe(process.memoryUsage().rss));

export { sdk, meter, prometheusExporter };
