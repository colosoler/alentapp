#!/bin/bash
# Script de carga para probar métricas RED
# Uso: ./observability/load-test.sh [duración_en_segundos]
#
# Este script genera tráfico contra la API para poblar las métricas
# de Prometheus y visualizarlas en el dashboard de Grafana.

DURATION=${1:-60}
BASE_URL="http://localhost:8080/api/v1"
ENDPOINTS=(
  "GET /socios"
  "GET /deportes"
  "GET /lockers"
  "GET /pagos"
  "GET /disciplines"
)

echo "Iniciando prueba de carga durante ${DURATION}s contra ${BASE_URL}"
echo "Endpoints: ${ENDPOINTS[*]}"
echo ""

START_TIME=$(date +%s)
REQUEST_COUNT=0

while [ $(($(date +%s) - START_TIME)) -lt $DURATION ]; do
  # Seleccionar endpoint aleatorio
  RANDOM_INDEX=$((RANDOM % ${#ENDPOINTS[@]}))
  ENDPOINT=${ENDPOINTS[$RANDOM_INDEX]}
  
  METHOD=$(echo $ENDPOINT | cut -d' ' -f1)
  PATH_URL=$(echo $ENDPOINT | cut -d' ' -f2)
  
  # Ejecutar request
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X $METHOD "${BASE_URL}${PATH_URL}")
  
  REQUEST_COUNT=$((REQUEST_COUNT + 1))
  echo "[$(date +%H:%M:%S)] $METHOD $PATH_URL -> $HTTP_CODE"
  
  # Introducir errores aleatorios (10% de probabilidad)
  if [ $((RANDOM % 10)) -eq 0 ]; then
    # Request a endpoint inexistente para generar 404
    curl -s -o /dev/null "${BASE_URL}/inexistente"
    REQUEST_COUNT=$((REQUEST_COUNT + 1))
    echo "[$(date +%H:%M:%S)] GET /inexistente -> 404 (error intencional)"
  fi
  
  # Pausa aleatoria entre 100ms y 500ms
  sleep 0.$((RANDOM % 5 + 1))
done

echo ""
echo "Prueba completada. Total de requests: $REQUEST_COUNT"
echo ""
echo "Ver métricas en:"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001 (admin/admin)"
echo "  - Dashboard: http://localhost:3001/d/red-alentapp-api"
