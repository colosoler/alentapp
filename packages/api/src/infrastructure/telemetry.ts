import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from
'@opentelemetry/auto-instrumentations-node';
import { Meter, metrics } from '@opentelemetry/api';
// Configurar Prometheus Exporter
const prometheusExporter = new PrometheusExporter({
 port: 9464,
 endpoint: '/metrics',
});
// Crear SDK con auto-instrumentaciones
const sdk = new NodeSDK({
 metricReader: prometheusExporter,
 instrumentations: [
 // Sin args: habilita las auto-instrumentaciones por defecto (incluye HTTP y Fastify).
 getNodeAutoInstrumentations(),
 ],
});
// Iniciar SDK
sdk.start();
const meter = metrics.getMeter('alentapp-api');
export function createREDMetrics(meter: Meter) {
 const requestCounter = meter.createCounter('http.requests.total', {
 description: 'Total de requests HTTP',
 });
 const errorCounter = meter.createCounter('http.requests.errors', {
 description: 'Total de errores HTTP',
 });
 const requestDuration = meter.createHistogram('http.request.duration', {
 description: 'Duración de requests',
 unit: 'ms',
 });
 return { requestCounter, errorCounter, requestDuration };
}
export { sdk, meter, prometheusExporter };