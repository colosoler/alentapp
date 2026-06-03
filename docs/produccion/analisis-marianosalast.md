# Actividad 4 - Fase 1: Analisis del proyecto e infraestructura

**Autor:** Mariano Salas


### La infraestructura Docker actual

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
| --- | --- | --- | --- |
| **Servidor de desarrollo en producción** | `packages/web/Dockerfile:12` | Alto | Actualmente se ejecuta el frontend con `npm run dev`. Se debe construir una imagen estática (`vite build`) y usar un servidor web ligero como Nginx para servir los estáticos en producción. |
| **Imágenes monolíticas y pesadas** | Ambos `Dockerfile` (todo el archivo) | Medio | Se copia todo el código fuente y se instalan herramientas de desarrollo (dependencias dev) en la imagen final. Se deben implementar Multi-stage builds para separar la fase de dependencias/compilación del entorno *runtime* final. |
| **Ejecución de contenedores como root** | Ambos `Dockerfile` | Alto | Al no especificar un usuario, Node.js se ejecuta por defecto con el usuario administrador (root) del contenedor. Se debe agregar la directiva `USER node` o crear un usuario sin privilegios. |
| **Secretos expuestos (hardcodeados)** | `docker-compose.yml:6-7, 19` | Alto | Las contraseñas y las URLs de la base de datos están escritas directamente en texto plano dentro de las variables de entorno. Se debe usar un archivo `.env` excluido del control de versiones o inyectar *Docker Secrets*. |
| **Ausencia de límites de recursos** | `docker-compose.yml` | Bajo | Ninguno de los servicios (`api`, `web`, `db`) tiene definidos límites de CPU o memoria. Se debe agregar la configuración de `deploy.resources.limits` para evitar que un contenedor acapare todos los recursos del host. |

---

### Investigar OpenTelemetry 

**¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?** 
OpenTelemetry (OTel) es un estándar (SDKs, APIs y herramientas) enfocado exclusivamente en la **instrumentación, generación, recopilación y exportación** de datos de telemetría, pero no provee almacenamiento ni una interfaz visual.
Por otro lado, Prometheus es principalmente una **base de datos de series temporales (TSDB)** con herramientas de consulta (PromQL) y recolección (normalmente funciona bajo el modelo *pull*, yendo a buscar las métricas). OpenTelemetry puede generar y recolectar las métricas para luego enviárselas a Prometheus para que este las almacene.

¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry? 
Los 3 pilares de la observabilidad son:

1. **Métricas (Metrics):** Agregaciones de datos a lo largo del tiempo (ej. uso de CPU, cantidad de peticiones).
2. **Trazas (Traces):** El recorrido detallado de una petición (request) a través de los múltiples servicios de un sistema distribuido.
3. **Logs:** Registros en texto inmutable de eventos discretos que sucedieron en el sistema.

OpenTelemetry aborda **los tres pilares**, unificándolos bajo un mismo estándar, lo que permite correlacionarlos fácilmente.

Métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una? 
El método RED es un enfoque para monitorear servicios basados en peticiones, midiendo la experiencia del usuario final:

* **Rate (Tasa):** El número de peticiones por segundo que está recibiendo el servicio. Sirve para entender la carga actual de tráfico y dimensionar la infraestructura.
* **Errors (Errores):** El número (o porcentaje) de peticiones que fallan (ej. códigos HTTP 5xx). Sirve para identificar rápidamente si el sistema está roto o degradado y alertar sobre ello.
* **Duration (Duración/Latencia):** El tiempo que tarda el sistema en responder a las peticiones (usualmente medido en percentiles como p95 o p99). Sirve para evaluar el rendimiento y si el usuario está experimentando lentitud.

¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus? 
OTLP es un protocolo estándar, de propósito general y alto rendimiento (basado en gRPC o HTTP) diseñado específicamente para exportar los datos de OpenTelemetry.
La gran **ventaja** de usar OTLP (usualmente enviando la telemetría a un "OpenTelemetry Collector" intermedio) frente a exportar código directamente al formato Prometheus, es que hace que la aplicación sea **agnóstica del proveedor** (vendor-agnostic). Si el día de mañana decides cambiar Prometheus por Datadog, New Relic o AWS CloudWatch, no necesitas modificar ni una sola línea de código en tu aplicación Node.js; simplemente le indicas al Collector que envíe los datos al nuevo destino.

**¿Cómo se relaciona OpenTelemetry con Grafana?** 
Actúan de forma complementaria conformando un *stack* de observabilidad. OpenTelemetry se encarga de extraer la telemetría desde el código y exportarla al motor de almacenamiento (en este caso, Prometheus). Grafana, por su parte, se conecta a ese motor de almacenamiento (como *datasource*) para consultar los datos usando PromQL y proveer las **visualizaciones y dashboards interactivos** finales.