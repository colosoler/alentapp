# Actividad 4 - Fase 1: Analisis del proyecto e infraestructura

**Autor:** Lucas Modernell  
**Fecha:** 3/6/2026  
**Proyecto:** AlentApp

---

## 1.1. Analisis de la infraestructura Docker actual

Archivos analizados: `docker-compose.yml`, `packages/api/Dockerfile`, `packages/web/Dockerfile`.

| # | Problema | Donde ocurre | Impacto | Solucion propuesta |
| --- | --- | --- | --- | --- |
| 1 | **Credenciales hardcodeadas en el repositorio** | `docker-compose.yml:6-8` y `:30` | Alto | Mover valores a un archivo `.env` (ignorado por git) y referenciar con `${POSTGRES_USER}`, `${POSTGRES_PASSWORD}`, `${DATABASE_URL}`. En prod, usar Docker secrets o un vault. |
| 2 | **Base de datos expuesta al host sin necesidad** | `docker-compose.yml:9-10` (`ports: '5432:5432'`) | Medio | Quitar el `ports` y dejar solo la red interna de Docker. Exponer el puerto solo en entornos de dev. |
| 3 | **Se usan bind mounts y servidores de desarrollo** | `docker-compose.yml:23-38` (volumes y `tsx watch`) y `:43-58` (volumes y `npm run dev`) | Alto | En prod, eliminar bind mounts, compilar artefactos y ejecutar `node dist/app.js`. Para web, usar `vite build` y servir estaticos con Nginx. |
| 4 | **Servicios sin healthcheck** | `docker-compose.yml:19-60` (api y web) | Medio | Agregar `healthcheck` HTTP. Ej: api `curl -f http://localhost:3000/health`; web `curl -f http://localhost:5173/`. |
| 5 | **No se define politica de reinicio** | `docker-compose.yml` (servicios sin `restart`) | Medio | Agregar `restart: unless-stopped` o `restart: always` para mejorar recuperacion ante fallos. |

---

## 1.2. Investigar OpenTelemetry

### Que es OpenTelemetry y como se diferencia de Prometheus?

OpenTelemetry (OTel) es un estandar open-source que define APIs/SDKs para **instrumentar, recolectar y exportar** telemetria (metricas, trazas y logs). No incluye almacenamiento ni UI.

Prometheus es un sistema de **metricas** que las recolecta con un modelo pull, las almacena en una base de series temporales y las consulta con PromQL.

**Diferencia clave:** OTel es la capa de instrumentacion y transporte; Prometheus es un backend de almacenamiento/consulta para metricas. OTel puede exportar a Prometheus u otros backends.

---

### Cuales son los "3 pilares" de la observabilidad? Cual aborda OpenTelemetry?

1. **Logs**: eventos textuales con timestamp.
2. **Metricas**: mediciones agregadas en el tiempo.
3. **Trazas**: recorrido de una request entre servicios.

OpenTelemetry aborda **los tres pilares** con APIs y SDKs unificados.

---

### Expliquen el concepto de metricas RED (Rate, Errors, Duration). Para que sirve cada una?

- **Rate (tasa)**: requests por segundo; indica carga y variaciones de trafico.
- **Errors (errores)**: fallos sobre el total; muestra confiabilidad.
- **Duration (duracion/latencia)**: tiempo de respuesta (p50/p95/p99); muestra performance percibida.

---

### Que es el OTLP (OpenTelemetry Protocol)? Que ventaja tiene frente a exportar directamente a Prometheus?

OTLP es el protocolo nativo de OTel (gRPC o HTTP/protobuf) para transportar telemetria.

**Ventajas frente a exportar directo a Prometheus:**

- Un solo protocolo para metricas, trazas y logs.
- Mejor eficiencia (binario/protobuf + compresion).
- Permite usar un Collector para batching, sampling y fan-out.
- Backend agnostico: se puede cambiar Prometheus por otro sin tocar la instrumentacion.

---

### Como se relaciona OpenTelemetry con Grafana?

OTel recolecta y exporta telemetria. Grafana la **visualiza** desde los backends:

- OTel -> Collector/Exporter -> Prometheus (metricas), Tempo (trazas), Loki (logs)
- Grafana se conecta a esos backends como datasource y arma dashboards correlacionados.
