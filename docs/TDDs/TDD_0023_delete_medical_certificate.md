---
id: "0023"
estado: Propuesto
autor: Lucas Modernell
fecha: 2026-05-03
titulo: Eliminacion de Certificado Medico
---

# TDD-0023: Eliminacion de Certificado Medico

## Contexto de Negocio (PRD)

### Objetivo

Permitir eliminar un certificado medico cargado por error o invalidado definitivamente por la administracion.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Eliminar un certificado medico incorrecto para evitar que se consulte como parte del historial vigente del socio.

### Criterios de Aceptación

- El sistema debe pedir una confirmacion antes de eliminar el certificado.
- El sistema debe validar que el certificado exista antes de intentar eliminarlo.
- El sistema debe realizar un borrado fisico de la base de datos.
- Si el borrado es exitoso, debe responder `204 No Content`.
 - Al eliminar, si el certificado tiene un archivo asociado, este debe eliminarse del almacenamiento permanente.
 - El mensaje de confirmación debe advertir que la eliminación del registro y del archivo es irreversible.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Al tratarse de una operacion destructiva que solo requiere conocer el identificador, no se envia cuerpo en la peticion HTTP.

- Endpoint: `DELETE /api/v1/medical-certificates/:id`
- Request Body: `None`
- Response: `204 No Content` en caso de exito.

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `MedicalCertificateRepository` (Metodos `findById(id)` y `delete(id)`).
2. **Caso de Uso**: `DeleteMedicalCertificateUseCase` (Comprueba existencia previa y delega la eliminacion).
3. **Adaptador de Salida**: `PostgresMedicalCertificateRepository` (Eliminacion usando Prisma).
4. **Adaptador de Entrada**: `MedicalCertificateController` (Ruta HTTP que extrae el `id` y devuelve status 204).

## Casos de Borde y Errores

| Escenario                 | Resultado Esperado                                                | Código HTTP actual        |
| ------------------------- | ----------------------------------------------------------------- | ------------------------- |
| ID invalido               | Mensaje: "El id del certificado no es valido"                     | 400 Bad Request           |
| Certificado inexistente   | Mensaje: "El certificado no existe"                               | 404 Not Found             |
| Error de conexión a DB    | Mensaje: "Error interno, reintente más tarde"                     | 500 Internal Server Error |
| Eliminacion exitosa       | Respuesta vacia                                                   | 204 No Content            |

## Plan de Implementación

1. Ampliar `MedicalCertificateRepository` y `PostgresMedicalCertificateRepository` con el metodo `delete`.
2. Crear la logica de negocio en `DeleteMedicalCertificateUseCase`.
3. Crear el endpoint `DELETE /api/v1/medical-certificates/:id` en el `MedicalCertificateController`.
4. Registrar la ruta en `app.ts`.
5. Agregar el metodo `delete` al servicio Frontend de certificados medicos.
6. Enlazar el boton de eliminacion en la vista correspondiente con confirmacion previa.
7. Agregar tests unitarios del caso de uso y tests de integracion del endpoint.