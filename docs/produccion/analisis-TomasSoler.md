# Actividad 4 — Fase 1: Análisis individual

**Autor:** Tomás Soler

---

## 1.1. Análisis de la infraestructura Docker actual

Archivos analizados: `docker-compose.yml`, `packages/api/Dockerfile`, `packages/web/Dockerfile`.

| # | Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
|---|---|---|---|---|
| 1 | Sin multi-stage build: la imagen final lleva devDependencies, código `.ts` y herramientas de build (tsx, vite). | `packages/api/Dockerfile:1-22` y `packages/web/Dockerfile:1-16` | Alto | Multi-stage `deps` / `build` / `runtime`. Para web, servir con `nginx:stable-alpine`. |
| 2 | Los contenedores corren como `root` (no hay `USER`). | `packages/api/Dockerfile` y `packages/web/Dockerfile` | Alto | Crear usuario no-root (`appuser`/`node`) y `USER appuser` antes del `CMD`. |
| 3 | Credenciales hardcodeadas en el repo (`admin / password123`). | `docker-compose.yml:6-8` y `:30` | Alto | Mover a `.env` (ignorado por git) y referenciar con `${VAR}`; usar `secrets:` en prod. |
| 4 | Sin healthchecks para API/Web ni resource limits en ningún servicio. | `docker-compose.yml:19-60` | Medio | Agregar `healthcheck` HTTP a api/web y `deploy.resources.limits` (cpus/memory). |
| 5 | El `CMD` ejecuta el dev server (`tsx watch`, `vite dev`, `CHOKIDAR_USEPOLLING`). | `api/Dockerfile:22`, `web/Dockerfile:16`, `docker-compose.yml:31-38` | Alto | Compilar a JS y correr `node dist/app.js`; para web, `vite build` + nginx. |

---

## 1.2. Investigación sobre OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

**OpenTelemetry (OTel)** es un framework open-source y vendor-neutral que estandariza cómo se **generan, recolectan y exportan** datos de telemetría (métricas, traces y logs).

**Prometheus** es una base de datos de series temporales que **almacena y consulta** métricas mediante scraping (pull) y PromQL.

**Diferencia:** OTel produce y transporta la telemetría; Prometheus la almacena. Son **complementarios**: con OTel instrumentás la app y podés exportar a Prometheus (o a cualquier otro backend) sin tocar el código.

### Los 3 pilares de la observabilidad

1. **Metrics** — valores numéricos agregados (counters, gauges, histograms).
2. **Logs** — registros textuales de eventos.
3. **Traces** — recorrido de una request a través de servicios (spans encadenados).

**OpenTelemetry aborda los 3 pilares** bajo un mismo SDK y protocolo. Ese es su diferenciador clave.

### Métricas RED

Set mínimo de métricas para todo servicio request-response (propuesto por Tom Wilkie):

| Métrica | Tipo | ¿Para qué sirve? |
|---|---|---|
| **R**ate | Counter | Requests por segundo. Indica el nivel de tráfico. |
| **E**rrors | Counter | Tasa de requests fallidas (4xx/5xx). Indica la confiabilidad. |
| **D**uration | Histogram | Latencia (p50/p95/p99). Indica la performance percibida por el usuario. |

Responden a las 3 preguntas básicas: *¿hay tráfico?*, *¿está fallando?*, *¿es rápido?*.

### ¿Qué es OTLP y qué ventaja tiene frente a exportar directo a Prometheus?

**OTLP (OpenTelemetry Protocol)** es el protocolo nativo de OTel para transmitir telemetría (sobre gRPC o HTTP/protobuf), es **push-based** y soporta los 3 pilares en un único canal.

**Ventajas frente al exporter directo de Prometheus:**

- **Vendor-neutral:** se puede cambiar el backend (Mimir, Datadog, etc.) sin tocar la app.
- **Push vs Pull:** funciona mejor con workloads efímeros (serverless, jobs cortos).
- **Un solo protocolo para metrics, traces y logs** (Prometheus solo lleva métricas).
- Permite poner un **OpenTelemetry Collector** en el medio para hacer batching, sampling y fan-out a varios backends.

### ¿Cómo se relaciona OpenTelemetry con Grafana?

Cubren etapas distintas del pipeline:

```
App (OTel SDK) → Exporter/Collector → Backend (Prometheus/Tempo/Loki) → Grafana
   produce             transporta              almacena                   visualiza
```

- **OTel** genera y exporta la telemetría.
- Los **backends** la almacenan.
- **Grafana** la consulta vía *datasources* y la muestra en dashboards.

En este TP, OTel exporta métricas, Prometheus las scrapea y Grafana las grafica con PromQL.

---

## Referencias

- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [RED Method — Tom Wilkie](https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/)
- [Grafana + OpenTelemetry](https://grafana.com/docs/opentelemetry/)
