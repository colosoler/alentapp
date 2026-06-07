#!/bin/sh
# Script de carga para probar metricas RED
# Uso: ./observability/load-test.sh [duracion_en_segundos] [porcentaje_errores_intencionales]
#
# Este script genera trafico contra la API para poblar las metricas
# de Prometheus y visualizarlas en el dashboard de Grafana.

DURATION=${1:-60}
ERROR_RATE_PERCENT=${2:-10}
REQUEST_DELAY_SECONDS=${REQUEST_DELAY_SECONDS:-1}
BASE_URL=${BASE_URL:-http://localhost:8080/api/v1}
ENDPOINTS="GET /socios
GET /sports
GET /lockers
GET /payments
GET /equipment-loan
GET /medical-certificates"

if [ -n "$DISCIPLINE_ID" ]; then
  ENDPOINTS="${ENDPOINTS}
GET /disciplines/${DISCIPLINE_ID}"
fi

request_status() {
  method=$1
  url=$2

  if command -v curl >/dev/null 2>&1; then
    curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url"
    return
  fi

  if [ "$method" != "GET" ]; then
    echo "000"
    return
  fi

  wget -q -S -O /dev/null "$url" 2>&1 \
    | awk '/^  HTTP\// { code=$2 } END { print code ? code : "000" }'
}

echo "Iniciando prueba de carga durante ${DURATION}s contra ${BASE_URL}"
echo "Errores intencionales: ${ERROR_RATE_PERCENT}%"
echo "Delay entre requests: ${REQUEST_DELAY_SECONDS}s"
echo "Endpoints:"
printf '%s\n' "$ENDPOINTS" | sed 's/^/  - /'
if [ -z "$DISCIPLINE_ID" ]; then
  echo "Disciplines: omitido (setear DISCIPLINE_ID para incluir GET /disciplines/:id)"
fi
echo ""

START_TIME=$(date +%s)
REQUEST_COUNT=0
PRIMARY_REQUEST_COUNT=0
ERROR_BUDGET=0
ENDPOINT_COUNT=$(printf '%s\n' "$ENDPOINTS" | wc -l | tr -d ' ')

while [ $(($(date +%s) - START_TIME)) -lt $DURATION ]; do
  # Seleccionar endpoint de forma ciclica para mantener el script compatible con /bin/sh.
  ENDPOINT_INDEX=$((PRIMARY_REQUEST_COUNT % ENDPOINT_COUNT + 1))
  ENDPOINT=$(printf '%s\n' "$ENDPOINTS" | sed -n "${ENDPOINT_INDEX}p")
  
  METHOD=$(echo $ENDPOINT | cut -d' ' -f1)
  PATH_URL=$(echo $ENDPOINT | cut -d' ' -f2)
  
  # Ejecutar request
  HTTP_CODE=$(request_status "$METHOD" "${BASE_URL}${PATH_URL}")
  
  REQUEST_COUNT=$((REQUEST_COUNT + 1))
  PRIMARY_REQUEST_COUNT=$((PRIMARY_REQUEST_COUNT + 1))
  echo "[$(date +%H:%M:%S)] $METHOD $PATH_URL -> $HTTP_CODE"
  
  # Introducir errores intencionales controlados por ERROR_RATE_PERCENT
  ERROR_BUDGET=$((ERROR_BUDGET + ERROR_RATE_PERCENT))
  if [ "$ERROR_RATE_PERCENT" -gt 0 ] && [ "$ERROR_BUDGET" -ge 100 ]; then
    # Request a endpoint inexistente para generar 404
    request_status "GET" "${BASE_URL}/inexistente" >/dev/null
    REQUEST_COUNT=$((REQUEST_COUNT + 1))
    ERROR_BUDGET=$((ERROR_BUDGET - 100))
    echo "[$(date +%H:%M:%S)] GET /inexistente -> 404 (error intencional)"
  fi
  
  sleep "$REQUEST_DELAY_SECONDS"
done

echo ""
echo "Prueba completada. Total de requests: $REQUEST_COUNT"
echo ""
echo "Ver metricas en:"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001 (admin/admin)"
echo "  - Dashboard: http://localhost:3001/d/red-alentapp-api"
