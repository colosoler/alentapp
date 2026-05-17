---
id: "0043"
estado: Propuesto
autor: Tomas Rosato
fecha: 2026-05-03
titulo: Eliminacion de Deportes existentes
---

# TDD-0043: Eliminacion de Deportes existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos dar de baja permanentemente a un deporte del sistema, eliminando su registro de la base de datos para mantener la lista actualizada.

### User Persona

-Nombre: Carlos (Administrativo).
-Necesidad: Borrar un deporte que fue cargado por error o ya no corresponda manterlo registrado, de forma rápida desde la misma tabla principal. Necesita una advertencia antes de borrar para no cometer equivocaciones irreparables.

### Criterios de Aceptación

- El sistema debe pedir una confirmación explícita (advertencia visual) antes de proceder con el borrado.
- El sistema debe validar que el deporte exista antes de intentar borrarlo.
- El sistema no debe permitir eliminar un deporte si tiene cupo ocupado, es decir, si `current_enrollment_count` es mayor a 0.
- El sistema debe realizar un borrado físico de la base de datos .
- Si el borrado es exitoso, la tabla debe actualizarse automáticamente.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Al tratarse de una operacion destructiva que solo requiere conocer el identificador, no se envia cuerpo en la peticion HTTP.

- Endpoint: `DELETE /api/v1/sports/:id`
- Request Body: `None`
- Response: `204 No Content` en caso de exito.

### Componentes de Arquitectura Hexagonal


1. **Puerto**: `SportRepository` (Metodos `findById(id)` y `delete(id)`).
2. **Caso de Uso**: `DeleteSportUseCase` (Comprueba existencia previa y delega la eliminacion).
3. **Adaptador de Salida**: `PostgresSportRepository` (Eliminacion usando Prisma).
4. **Adaptador de Entrada**: `SportController` (Ruta HTTP que extrae el `id` y devuelve status 204).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP actual        |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Deporte inexistente          | Mensaje: "El deporte no existe"               | 404 Not Found           |
| Deporte con cupo ocupado | Mensaje: "No se puede eliminar un deporte con inscriptos" | 409 Conflict |
| ID invalido | Mensaje: "El id informado no es valido" | 400 Bad Request |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde"     | 500 Internal Server Error |
| Eliminación exitosa        | Respuesta vacía                               | 204 No Content            |

## Plan de Implementación

1. Ampliar `SportRepository` y `PostgresSportRepository` con el metodo `delete`.
2. Crear la logica de negocio en `DeleteSportUseCase`.
3. Crear el endpoint `DELETE /api/v1/sports/:id` en el `SportController`.
4. Registrar la ruta en `app.ts`.
5. Agregar el metodo `delete` al servicio Frontend de deportes.
6. Enlazar el boton de eliminacion en la vista correspondiente con confirmacion previa.
7. Agregar tests unitarios del caso de uso y tests de integracion del endpoint.







