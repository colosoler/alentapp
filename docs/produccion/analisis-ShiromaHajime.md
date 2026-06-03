# Actividad 4 — Fase 1: Análisis individual

**Autor:** Shiroma Hajime

---

## 1.1. Análisis de la infraestructura Docker actual

Archivos analizados: `docker-compose.yml`, `packages/api/Dockerfile`, `packages/web/Dockerfile`.

| # | Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
|---|----------|---------------|---------|-------------------|
| 1 | **Sin `.dockerignore`** | `packages/api/Dockerfile:17` y `packages/web/Dockerfile:11` (`COPY . .`) | Medio | `COPY . .` arrastra `node_modules/`, `.git/`, `dist/`, `coverage/`, `*.md` y cachés de npm al build context, incrementando el tiempo de build, el tamaño del contexto, e invalidando la caché de Docker cada vez que cualquier archivo del proyecto cambia. |
| 2 | **Filesystem read-write y sin restricción de capabilities** | `docker-compose.yml` (servicios api, web, db) | Alto | Los contenedores pueden escribir en disco y tienen todas las capabilities de Linux por defecto. Si un atacante compromete un contenedor, puede modificar binarios, instalar herramientas o escalar privilegios al host fácilmente. |
| 3 | **Sin política de reinicio** | `docker-compose.yml` (servicios api, web, db) | Medio | Si un contenedor crashea por OOM, excepción no manejada o fallo transitorio, Docker no lo reinicia automáticamente. El servicio queda caído hasta intervención manual, afectando la disponibilidad. |
| 4 | **Sin rotación de logs** | `docker-compose.yml` (configuración global, no especificada) | Bajo | Docker usa por defecto el driver `json-file` sin límites de rotación. En producción, los logs pueden acumular gigabytes con el tiempo, llenar el disco y causar denegación de servicio. |
| 5 | **Variables de entorno de desarrollo presentes** | `docker-compose.yml:31-32` (api) y `:49-50` (web) | Bajo | `CHOKIDAR_USEPOLLING` y `WATCHPACK_POLLING` son específicas de file-watching para hot-reload en desarrollo con `tsx watch` y Vite. En producción no tienen utilidad y agregan overhead de CPU innecesario. |

### Detalle de soluciones propuestas

| # | Solución propuesta |
|---|-------------------|
| 1 | Crear `.dockerignore` en la raíz del proyecto excluyendo: `node_modules/`, `.git/`, `dist/`, `coverage/`, `*.md`, `.stryker-tmp/`, `playwright-report-fullstack/`, `test-results/`, `.idea/`, `*.log` |
| 2 | Agregar en cada servicio de producción: `read_only: true`, `cap_drop: ALL`, `cap_add: NET_BIND_SERVICE`, `security_opt: [no-new-privileges:true]`. Para `db` usar capabilities más específicas: `CHOWN`, `DAC_OVERRIDE`, `SETUID`, `SETGID`, `NET_BIND_SERVICE` y agregar un volumen tmp para escritura de Postgres. |
| 3 | Agregar `restart: unless-stopped` en cada servicio del docker-compose |
| 4 | Configurar a nivel de compose: `logging: driver: json-file, options: { max-size: "10m", max-file: "3" }` |
| 5 | Eliminar `CHOKIDAR_USEPOLLING` y `WATCHPACK_POLLING` del compose de producción |

---

## 1.2. Investigación sobre OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

**OpenTelemetry (OTel)** es un framework open-source que estandariza la **generación, recolección y exportación** de datos de telemetría (métricas, trazas y logs). Provee APIs y SDKs para instrumentar aplicaciones de forma independiente del backend.

**Prometheus** es un sistema de monitoreo especializado en métricas que funciona como **base de datos de series temporales (TSDB)** con su propio lenguaje de consulta (PromQL). Opera bajo un modelo *pull*: scrapea endpoints HTTP para recolectar métricas.

**Diferencia clave:** OTel se enfoca en *cómo y qué medir* (instrumentación), mientras que Prometheus se enfoca en *dónde y cómo almacenar* (backend). Son complementarios, no competidores — OTel puede exportar métricas a Prometheus como uno de sus múltiples destinos.

### ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?

| Pilar | Descripción |
|-------|-------------|
| **Métricas** | Valores numéricos agregados en el tiempo (counters, gauges, histograms). Ej: requests/s, CPU, memoria. |
| **Logs** | Registros textuales inmutables de eventos discretos con timestamp. Ej: "Error connecting to DB". |
| **Trazas (Traces)** | Registro del recorrido completo de una solicitud a través de servicios distribuidos, mostrando relaciones de llamada y tiempos por span. |

**OpenTelemetry aborda los 3 pilares** bajo un mismo estándar, API y protocolo. Su principal ventaja es que permite correlacionar métricas, trazas y logs de un mismo flujo, algo que tradicionalmente requería herramientas separadas.

### Métricas RED (Rate, Errors, Duration)

El método RED (propuesto por Tom Wilkie) define las 3 métricas esenciales para todo servicio request-response:

| Métrica | Tipo OTel | ¿Para qué sirve? |
|---------|-----------|-------------------|
| **Rate** | Counter | Cantidad de requests por segundo. Responde: *"¿hay tráfico?"*. Permite detectar caídas de tráfico (problemas de ruteo) o picos inesperados. |
| **Errors** | Counter | Cantidad o porcentaje de requests que fallan (HTTP 4xx/5xx). Responde: *"¿está fallando?"*. Permite detectar bugs, degradaciones o fallos de dependencias. |
| **Duration** | Histogram | Latencia de respuesta en percentiles (p50, p95, p99). Responde: *"¿es rápido?"*. Permite identificar cuellos de botella y degradaciones de performance. |

### ¿Qué es OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?

**OTLP** es el protocolo nativo de OpenTelemetry para transportar datos de telemetría. Soporta dos modos de transmisión:
- **gRPC** (binario, protobuf) — más eficiente
- **HTTP** (JSON o protobuf) — más compatible

**Ventajas frente a exportar directamente a Prometheus:**

| Aspecto | OTLP | Exportación directa a Prometheus |
|---------|------|----------------------------------|
| **Tipos de datos** | Métricas, trazas y logs en un solo protocolo | Solo métricas |
| **Formato** | Binario (gRPC/protobuf) — más compacto y rápido | Texto plano (formato de exposición Prometheus) |
| **Vendor-neutral** | Se puede cambiar el backend sin tocar la app | Acoplado al formato de Prometheus |
| **Contexto distribuido** | Soporta propagación de contexto entre servicios | No lo soporta nativamente |
| **Workloads efímeros** | Push-based: funciona con serverless, jobs cortos | Pull-based: requiere un endpoint siempre disponible |

La mayor ventaja es que OTLP hace que la aplicación sea **agnóstica del backend**. Si mañana se decide migrar de Prometheus a Datadog, Grafana Mimir o AWS CloudWatch, solo cambia la configuración del OpenTelemetry Collector, no el código de la aplicación.

### ¿Cómo se relaciona OpenTelemetry con Grafana?

Cubren etapas distintas del pipeline de observabilidad:

```
App (OTel SDK) → Exporter/Collector → Backend (Prometheus) → Grafana
   produce            transporta          almacena           visualiza
```

1. **OpenTelemetry** instrumenta la aplicación, genera las métricas y las exporta (en este caso vía PrometheusExporter en el puerto 9464).
2. **Prometheus** scrapea el endpoint OTel y almacena las métricas en su TSDB.
3. **Grafana** se conecta a Prometheus como datasource y permite construir dashboards interactivos usando PromQL para visualizar los datos generados por OTel.

Son herramientas complementarias: OTel se encarga de la *generación y transporte* de telemetría, mientras que Grafana se encarga de la *visualización y análisis*. Juntos forman un stack de observabilidad completo, abierto y vendor-neutral.

---

## Referencias

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [RED Method — Tom Wilkie](https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/)
- [Grafana + OpenTelemetry](https://grafana.com/docs/opentelemetry/)
- [Dockerfile best practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Docker security best practices](https://docs.docker.com/engine/security/)
