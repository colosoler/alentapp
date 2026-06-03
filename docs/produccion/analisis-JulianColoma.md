# Fase 1: Analizar y proponer

**Autor:** Julián Coloma  
**Fecha:** 3/6/2026  
**Proyecto:** AlentApp

---

## 1.1. Análisis de infraestructura Docker

### Problemas identificados

| # | Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
|---|----------|---------------|---------|-------------------|
| 1 | **El contenedor se ejecuta como root** | `packages/api/Dockerfile` (falta `USER`), `packages/web/Dockerfile` (falta `USER`) | **Alto** — Si un atacante compromete el contenedor, tiene acceso root dentro del mismo, lo que aumenta el riesgo de escalada de privilegios al host. | Agregar `USER node` al final de ambos Dockerfiles (la imagen `node:20-alpine` ya crea el usuario `node`). |
| 2 | **No hay healthchecks en api ni web** | `docker-compose.yml` líneas 19-41 (api) y 43-60 (web) | **Medio** — Sin healthchecks, orquestadores como Docker Swarm o Kubernetes no pueden determinar si el servicio está realmente operativo ni reiniciarlo automáticamente ante fallos. | Agregar `healthcheck` con endpoints HTTP (ej. `curl -f http://localhost:3000/health` para api, y verificar que web responda en el puerto 5173). |
| 3 | **Sin límites de CPU/memoria** | `docker-compose.yml` (ningún servicio define `deploy.resources.limits`) | **Alto** — Un contenedor puede consumir toda la RAM o CPU del host, causando denegación de servicio a otros contenedores o al sistema operativo. | Agregar `deploy.resources.limits` con valores razonables (ej. `cpus: "0.5"`, `memory: 512M`) en cada servicio. |
| 4 | **Credenciales hardcodeadas en docker-compose.yml** | `docker-compose.yml` líneas 6-7 (`POSTGRES_USER: admin`, `POSTGRES_PASSWORD: password123`) y línea 30 (`DATABASE_URL` contiene la misma contraseña) | **Alto** — Las credenciales en texto plano quedan expuestas en el repositorio. Cualquier persona con acceso al repo puede conectarse a la base de datos en producción. | Usar variables de entorno externas (`.env`), Docker secrets, o un vault. En compose, referenciar `${POSTGRES_PASSWORD}` en lugar de valores fijos. |
| 5 | **Imágenes sin optimizar para producción (sin multi-stage, devDependencies incluidas)** | `packages/api/Dockerfile:12` y `packages/web/Dockerfile:8` (`npm install` sin `--production`) | **Medio** — `npm install` instala devDependencies que no son necesarias en runtime, aumentando el tamaño de la imagen y la superficie de ataque. Tampoco se usa multi-stage build para separar compilación de ejecución. | Usar multi-stage build: en etapa de build compilar/instalar con `npm ci`, en etapa final copiar solo lo necesario. Usar `npm ci --only=production` en etapa de runtime. |

---

## 1.2. Investigación sobre OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

**OpenTelemetry (OTel)** es un framework de observabilidad de código abierto que estandariza la recolección, procesamiento y exportación de datos de telemetría (trazas, métricas y logs). Proporciona APIs y SDKs para instrumentar aplicaciones de forma independiente del backend.

**Prometheus** es un sistema especializado en métricas: las recolecta (pull), las almacena en una base de datos temporal y permite consultarlas con PromQL (no maneja trazas ni logs).

**Diferencia clave:** OpenTelemetry define *cómo instrumentar y exportar* los datos (es un estándar de instrumentación), mientras que Prometheus define *cómo almacenar y consultar* métricas (es un backend). OTel puede exportar métricas a Prometheus como uno de sus backends posibles.

---

### ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?

Los 3 pilares de la observabilidad son:

1. **Logs** — Eventos textuales con timestamp (ej. "User logged in at 12:00:01").
2. **Métricas** — Mediciones numéricas agregadas en el tiempo (ej. request count, CPU usage).
3. **Trazas (Traces)** — Registro del recorrido de una solicitud a través de servicios distribuidos, mostrando tiempos y relaciones de llamada.

**OpenTelemetry aborda los 3 pilares.** Proporciona APIs y SDKs para instrumentar logs, métricas y trazas de manera uniforme, y exportarlos a uno o más backends.

---

### Expliquen el concepto de métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una?

**RED** es un modelo de monitoreo orientado a servicios. Se enfoca en 3 métricas clave para cada servicio:

- **Rate (Tasa)** — Cantidad de solicitudes por segundo. Sirve para detectar caídas de tráfico (posible problema de ruteo) o picos inesperados (posible ataque DDoS).
- **Errors (Errores)** — Cantidad o porcentaje de solicitudes que fallan (HTTP 5xx, excepciones). Sirve para detectar bugs, degradaciones o fallos de dependencias.
- **Duration (Duración)** — Tiempo que tarda el servicio en responder (latencia). Sirve para identificar degradaciones de performance, cuellos de botella o timeouts.

Estas 3 métricas permiten responder rápidamente "¿está mi servicio funcionando correctamente?" desde el dashboard.

---

### ¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?

**OTLP** es el protocolo nativo de OpenTelemetry para transportar datos de telemetría. Soporta envío vía gRPC (binario, protobuf) o HTTP/JSON.

**Ventajas frente a exportar directamente a Prometheus:**

| Aspecto | OTLP | Exportación directa a Prometheus |
|---------|------|----------------------------------|
| **Tipos de datos** | Trazas, métricas y logs en un solo protocolo | Solo métricas |
| **Formato** | Binario (gRPC/protobuf) — más eficiente | Texto plano (formato de exposición de Prometheus) |
| **Contexto distribuido** | Soporta propagación de contexto entre servicios | No lo soporta nativamente |
| **Flexibilidad de backend** | Se puede cambiar el backend (Tempo, Loki, Prometheus, etc.) sin modificar la instrumentación | El exportador está acoplado a Prometheus |
| **Compresión** | Soporta compresión nativa | Limitada |

---

### ¿Cómo se relaciona OpenTelemetry con Grafana?

**OpenTelemetry** recolecta y exporta telemetría, **Grafana** la visualiza. La relación es complementaria:

1. OTel instrumenta la aplicación y envía los datos a uno o más backends (Prometheus para métricas, Tempo para trazas, Loki para logs).
2. **Grafana** se conecta a esos backends y los despliega en dashboards unificados, permitiendo correlacionar métricas, trazas y logs en una misma vista.
3. Grafana también ofrece **Grafana Cloud** y **Grafana Tempo**, que aceptan OTLP directamente como entrada.

En la práctica, OTel es el *"colector"* y Grafana es el *"visor"* — juntos forman un stack de observabilidad completo y independiente del proveedor.
