# Actividad 4 - Fase 1: Analisis individual

**Autor:** Tomas Rosato

---

## 1.1. Analisis de la infraestructura Docker actual

Archivos analizados: `docker-compose.yml`, `packages/api/Dockerfile`, `packages/web/Dockerfile`.

| # | Problema | Donde ocurre | Impacto | Solucion propuesta |
|---|---|---|---|---|
| 1 | **Version de Node distinta a la pedida para produccion** | `packages/api/Dockerfile:1` y `packages/web/Dockerfile:1` usan `node:20-alpine`, mientras la consigna de produccion propone `node:22-alpine`. | Medio | Unificar la version base en `node:22-alpine` para alinear desarrollo, build y runtime con el diseno productivo esperado. Tambien conviene fijar versiones de imagen de forma explicita para reducir sorpresas entre builds. |
| 2 | **La base de datos queda publicada hacia el host** | `docker-compose.yml:9-10` expone `5432:5432`. | Medio | En produccion, Postgres deberia quedar accesible solo por la red interna de Docker. Quitar `ports` del servicio `db` y permitir que la API se conecte por el hostname interno `db:5432`. |
| 3 | **El arranque de la API ejecuta migraciones y generacion de Prisma en cada inicio** | `docker-compose.yml:35-38` ejecuta `npx prisma migrate deploy`, `npx prisma generate` y luego `npx tsx watch`. | Alto | Separar responsabilidades: generar Prisma durante el build, ejecutar migraciones como job/step controlado de deploy y dejar que el contenedor de API solo arranque la aplicacion compilada. Esto evita reinicios lentos y fallos de startup por tareas administrativas. |
| 4 | **El frontend no tiene healthcheck y depende de la API solo por orden de arranque** | `docker-compose.yml:58-60` usa `depends_on: - api`, pero la API no declara healthcheck propio y la web tampoco verifica readiness. | Medio | Agregar healthchecks HTTP para API y web. Para la web productiva, verificar `http://localhost:80`; para la API, un endpoint como `/health`. Usar `condition: service_healthy` donde corresponda. |
| 5 | **El contexto de build es demasiado amplio para ambos servicios** | `docker-compose.yml:20-22` y `:44-46` usan `context: .`; luego los Dockerfiles hacen `COPY . .` en `packages/api/Dockerfile:17` y `packages/web/Dockerfile:11`. | Medio | Mantener el contexto en la raiz por el monorepo, pero copiar solo los archivos necesarios por etapa. Ampliar `.dockerignore` para excluir reportes, resultados de tests, uploads temporales, documentacion no requerida y caches. Asi mejora la cache de capas y baja el riesgo de incluir archivos innecesarios en la imagen. |

### Observaciones adicionales

Hay otros puntos importantes que tambien aparecen en la infraestructura actual: credenciales hardcodeadas, uso de servidores de desarrollo (`tsx watch` y Vite dev server), bind mounts, ausencia de limites de CPU/memoria y falta de usuario no-root. No los inclui como los cinco principales para evitar repetir exactamente el mismo analisis de otros integrantes, pero deberian resolverse en la configuracion productiva final.

---

## 1.2. Investigacion sobre OpenTelemetry

### Que es OpenTelemetry y como se diferencia de Prometheus?

**OpenTelemetry (OTel)** es un estandar open-source para instrumentar aplicaciones y generar datos de telemetria: metricas, trazas y logs. Provee APIs, SDKs, convenciones semanticas y exportadores para que una aplicacion pueda producir observabilidad sin quedar atada a un proveedor especifico.

**Prometheus**, en cambio, es principalmente un sistema de monitoreo de metricas: recolecta datos, los guarda como series temporales y permite consultarlos con PromQL. Su modelo clasico es pull, es decir, Prometheus va a buscar metricas a endpoints HTTP expuestos por los servicios.

La diferencia principal es que OpenTelemetry se ubica en la capa de **instrumentacion y transporte**, mientras Prometheus se ubica en la capa de **almacenamiento y consulta de metricas**. No compiten necesariamente: OTel puede generar metricas y exponerlas o enviarlas para que Prometheus las almacene.

### Cuales son los 3 pilares de la observabilidad? Cual aborda OpenTelemetry?

Los tres pilares de la observabilidad son:

| Pilar | Descripcion | Ejemplo |
|---|---|---|
| **Metricas** | Valores numericos agregados en el tiempo. Sirven para ver tendencias y estado general del sistema. | Requests por segundo, uso de memoria, latencia p95. |
| **Logs** | Eventos discretos registrados por la aplicacion. Sirven para entender que paso en un momento puntual. | Error al conectar con la base de datos. |
| **Trazas** | Recorrido de una solicitud a traves de uno o varios servicios, dividido en spans. Sirven para encontrar donde se consume tiempo o donde falla una request. | Una llamada HTTP que pasa por API, DB y un servicio externo. |

OpenTelemetry aborda los tres pilares. Su valor esta en que permite generar datos con un formato y convenciones comunes, y ademas correlacionarlos. Por ejemplo, una metrica de latencia alta puede llevar a una traza concreta y esa traza puede vincularse con logs del mismo request.

### Metricas RED: Rate, Errors, Duration

El metodo RED propone monitorear todo servicio basado en requests con tres metricas basicas:

| Metrica | Que mide | Para que sirve |
|---|---|---|
| **Rate** | Cantidad de requests por unidad de tiempo, normalmente requests por segundo. | Permite saber si el servicio esta recibiendo trafico normal, si hay picos inesperados o si el trafico cayo a cero. |
| **Errors** | Cantidad o porcentaje de requests fallidas, por ejemplo respuestas 5xx o errores de negocio relevantes. | Permite detectar degradacion de confiabilidad y priorizar incidentes que afectan al usuario. |
| **Duration** | Tiempo que tarda cada request en responder, normalmente analizado con percentiles como p50, p95 y p99. | Permite medir la experiencia percibida y encontrar endpoints lentos o cuellos de botella. |

En conjunto, RED responde tres preguntas operativas rapidas: cuanto trafico hay, cuanto esta fallando y cuanto tarda.

### Que es OTLP? Que ventaja tiene frente a exportar directamente a Prometheus?

**OTLP (OpenTelemetry Protocol)** es el protocolo nativo de OpenTelemetry para enviar telemetria. Puede usar gRPC o HTTP y esta pensado para transportar metricas, trazas y logs de forma estandar.

Frente a exportar directamente a Prometheus, OTLP tiene varias ventajas:

- Permite enviar los tres tipos de telemetria con un protocolo comun.
- Desacopla la aplicacion del backend final: la app envia OTLP y un OpenTelemetry Collector decide si manda los datos a Prometheus, Grafana Mimir, Tempo, Loki, Datadog u otra herramienta.
- Facilita procesamiento intermedio como batching, filtrado, enriquecimiento de atributos, sampling y envio a multiples destinos.
- Funciona mejor para escenarios donde no conviene depender solo del modelo pull de Prometheus, por ejemplo jobs efimeros o arquitecturas con redes mas complejas.

Exportar directo a Prometheus puede ser suficiente para un proyecto simple de metricas, pero OTLP con Collector es mas flexible y escalable para una plataforma productiva.

### Como se relaciona OpenTelemetry con Grafana?

OpenTelemetry y Grafana cumplen roles distintos dentro del stack de observabilidad:

```text
Aplicacion -> OpenTelemetry SDK/Collector -> Backend de datos -> Grafana
             instrumenta y exporta          almacena           visualiza
```

OpenTelemetry genera y transporta la telemetria. Los backends la almacenan: Prometheus o Grafana Mimir para metricas, Tempo para trazas y Loki para logs. Grafana se conecta a esos backends como datasource y permite construir dashboards, alertas y visualizaciones.

En este TP, la relacion esperada es: la API Node.js se instrumenta con OpenTelemetry, las metricas se exponen para Prometheus y Grafana consulta Prometheus para mostrar el dashboard RED.

---

## Referencias

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [OpenTelemetry Protocol](https://opentelemetry.io/docs/specs/otlp/)
- [RED Method - Tom Wilkie](https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/)
- [Grafana OpenTelemetry documentation](https://grafana.com/docs/opentelemetry/)
