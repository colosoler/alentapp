---
id: "0022"
estado: Propuesto
autor: Lucas Modernell
fecha: 2026-05-03
titulo: Actualizacion de Certificado Medico
---

# TDD-0022: Actualizacion de Certificado Medico

## Contexto de Negocio (PRD)

### Objetivo

Permitir corregir o extender la vigencia de un certificado medico existente cuando se detecta un error de carga o cuando el socio presenta una renovacion antes de que venza el certificado actual.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Actualizar rapidamente un certificado medico sin perder trazabilidad sobre cual fue el documento vigente en cada momento.

### Criterios de Aceptación

- El sistema debe validar que el certificado exista antes de modificarlo.
- El sistema debe permitir actualizar la fecha de emision y la fecha de vencimiento.
- El sistema debe validar que la fecha de vencimiento, cuando exista, sea posterior a la fecha de emision.
- El sistema debe permitir cambiar el estado del certificado entre `Active` e `Inactive`.
- Si la actualizacion es correcta, debe retornar los datos actualizados del certificado.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Todos los campos son opcionales porque se trata de una actualizacion parcial.

- Endpoint: `PATCH /api/v1/medical-certificates/:id`
- Request Body (`UpdateMedicalCertificateRequest`):

```ts
{
    issueDate?: string; // ISO Date String
    expirationDate?: string; // ISO Date String
    status?: 'Active' | 'Inactive';
}
```

- Response (`MedicalCertificateResponse`):

```ts
{
    id: string;
    memberId: string;
    issueDate: string;
    expirationDate?: string;
    status: 'Active' | 'Inactive';
    createdAt: string;
    updatedAt: string;
    invalidatedAt?: string;
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `MedicalCertificateRepository` (Metodos `findById(id)` y `update(id, data)`).
2. **Caso de Uso**: `UpdateMedicalCertificateUseCase` (Busca el certificado, combina los datos actuales con los enviados y valida las reglas de negocio).
3. **Adaptador de Salida**: `PostgresMedicalCertificateRepository` (Actualizacion usando Prisma).
4. **Adaptador de Entrada**: `MedicalCertificateController` (Ruta HTTP que extrae el `id` y devuelve el certificado actualizado).

## Casos de Borde y Errores

| Escenario                     | Resultado Esperado                                                    | Código HTTP actual        |
| ----------------------------- | --------------------------------------------------------------------- | ------------------------- |
| ID invalido                   | Mensaje: "El id del certificado no es valido"                         | 400 Bad Request           |
| Certificado inexistente       | Mensaje: "El certificado no existe"                                   | 404 Not Found             |
| Fecha de emision invalida     | Mensaje: "La fecha de emision no es valida"                           | 400 Bad Request           |
| Fecha de vencimiento invalida | Mensaje: "La fecha de vencimiento es invalida o es anterior a la de emision" | 400 Bad Request           |
| Actualizacion exitosa         | Datos actualizados del certificado                                    | 200 OK                    |
| Error de conexión a DB        | Mensaje: "Error interno, reintente más tarde"                         | 500 Internal Server Error |

## Plan de Implementación

1. Definir `UpdateMedicalCertificateRequest` en `@alentapp/shared`.
2. Ampliar `MedicalCertificateRepository` con los metodos `findById` y `update`.
3. Implementar la logica en `UpdateMedicalCertificateUseCase`.
4. Validar la regla de fechas con los datos finales del certificado.
5. Implementar la actualizacion en `PostgresMedicalCertificateRepository`.
6. Crear el endpoint `PATCH /api/v1/medical-certificates/:id` en el `MedicalCertificateController`.
7. Agregar la edicion de certificados medicos en el Frontend.
8. Agregar tests unitarios del caso de uso y tests de integracion del endpoint.