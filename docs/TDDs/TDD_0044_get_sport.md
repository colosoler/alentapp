---
id: "0044"
estado: Propuesto
autor: Tomas Rosato
fecha: 2026-05-03
titulo: Consulta de Deportes existentes
---

# TDD-0044: Consulta de Deportes existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos consultar los deportes registrados en el club. Cubre la necesidad de visualizar los deportes disponibles y consultar el detalle de un deporte especifico.

### User Persona

-Nombre: Carlos (Administrativo).
-Necesidad: Consultar que deportes brinda el club antes de realizar acciones administrativas.

### Criterios de Aceptación

- El sistema debe permitir consultar un deporte por su identificador.
- El sistema debe permitir listar todos los deportes registrados.
- Si el deporte no existe, el sistema debe informar el error correspondiente.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

- Endpoint: `GET /api/v1/sports/:id`
- Response (`SportResponse`):

```ts
{
    id: string;
    name: string;
    description: string;
    max_capacity: number;
    current_enrollment_count: number;
    additional_price: number;
    requires_medical_certificate: boolean;
}
```

- Endpoint: `GET /api/v1/sports`
- Response:

```ts
SportResponse[]
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `SportRepository` (Metodos `findById(id)` y `findAll()`).
2. **Caso de Uso**: `GetSportUseCase` (Consulta un deporte por ID).
3. **Caso de Uso**: `ListSportUseCase` (Consulta todos los deportes registrados en el sistema).
4. **Adaptador de Salida**: `PostgresSportRepository` (Consultas usando Prisma).
5. **Adaptador de Entrada**: `SportController` (Rutas HTTP de consulta).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                             | Código HTTP actual        |
| -------------------------- | ---------------------------------------------- | ------------------------- |
| ID invalido                | Mensaje: "El id informado no es valido"       | 400 Bad Request           |
| Consulta exitosa por ID | Mensaje: "Datos del deporte consultado" | 200 OK |
| No existen deportes | Mensaje: "Lista vacía" | 200 OK |
| Consulta exitosa general | Mensaje: "Lista de deportes registrados" | 200 OK |
| Deporte inexistente        | Mensaje: "El deporte no existe"               | 404 Not Found             |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación

1. Definir `SportResponse` en `@alentapp/shared`.
2. Ampliar `SportRepository` con los metodos de consulta necesarios.
3. Implementar `GetSportUseCase`.
4. Implementar `ListSportUseCase`.
5. Implementar las consultas en `PostgresSportRepository`.
6. Crear los endpoints `GET /api/v1/sports/:id` y `GET /api/v1/sports`.
7. Agregar la vista o seccion de consulta de deportes en el Frontend.
8. Agregar tests unitarios de los casos de uso y tests de integracion de los endpoints.







