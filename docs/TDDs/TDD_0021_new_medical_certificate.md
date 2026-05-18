---
id: "0021"
estado: Propuesto
autor: Lucas Modernell
fecha: 2026-05-03
titulo: Alta de Certificado Medico
---

# TDD-0021: Alta de Certificado Medico

## Contexto de Negocio (PRD)

### Objetivo

Permitir registrar certificados medicos de los socios para dejar constancia de su aptitud al momento de realizar actividades que requieren control sanitario.

La regla principal de negocio indica que solo puede existir un certificado activo por socio. Cuando se crea un nuevo certificado para un socio, el sistema debe invalidar los certificados activos anteriores de ese mismo socio para evitar ambiguedades sobre cual es el vigente.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Registrar y consultar rapidamente el estado medico de un socio sin tener que revisar documentos manualmente ni decidir cual certificado es el valido.

### Criterios de Aceptación

- El sistema debe validar que el socio exista antes de crear el certificado medico.
- El sistema debe validar que la fecha de emision sea valida.
- El sistema debe validar que la fecha de vencimiento, cuando exista, sea posterior a la fecha de emision.
- El sistema debe permitir crear un certificado medico como activo por defecto.
- El sistema debe invalidar automaticamente los certificados activos anteriores del mismo socio al crear uno nuevo.
- El sistema debe garantizar que nunca queden dos certificados activos para el mismo socio.
- Si la creacion es correcta, debe devolver los datos del certificado creado.
 - El sistema debe permitir adjuntar un archivo en formato PNG con el certificado (opcional).
 - El sistema debe validar que el archivo, si se envía, sea imagen PNG y no supere 5MB.
 - Si se adjunta el archivo, la respuesta debe incluir la URL o identificador del recurso almacenado.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definira la entidad `MedicalCertificate` con las siguientes propiedades y restricciones:

- `id`: Identificador unico universal (UUID).
- `memberId`: UUID, referencia al socio.
- `issueDate`: Fecha de emision, obligatoria.
- `expirationDate`: Fecha de vencimiento, opcional.
- `status`: Enumeracion con valores `Active` e `Inactive`, con valor por defecto `Active`.
- `createdAt`: Fecha de creacion autogenerada.
- `updatedAt`: Fecha de actualizacion autogenerada.
- `invalidatedAt`: Fecha en la que dejo de estar activo, opcional.
 - `file_url`: string opcional con la ruta o URL del archivo PNG almacenado.

Se recomienda reforzar la regla de unicidad del estado activo por socio a nivel de aplicacion y persistencia.

### Contrato de API (@alentapp/shared)

- Endpoint: `POST /api/v1/medical-certificates`
 - Request: `multipart/form-data` con campos:

     - `member_id` (string)
     - `issue_date` (ISO date string)
     - `expiration_date` (ISO date string, opcional)
     - `file` (archivo PNG opcional, campo de tipo file)

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

Si se adjuntó un archivo, `MedicalCertificateResponse` incluirá `file_url?: string` con la ruta pública o interna al recurso.
```

### Componentes de Arquitectura Hexagonal

1. **Entidad de Dominio**: `MedicalCertificate` (Valida fechas y estado inicial).
2. **Puerto**: `MedicalCertificateRepository` (Metodos para crear certificados y desactivar los activos previos del socio).
3. **Puerto**: `MemberRepository` (Metodo `findById(id)` para verificar que el socio exista).
4. **Caso de Uso**: `CreateMedicalCertificateUseCase` (Valida datos, invalida certificados anteriores y crea el nuevo registro).
5. **Adaptador de Salida**: `PostgresMedicalCertificateRepository` (Persistencia usando Prisma).
6. **Adaptador de Entrada**: `MedicalCertificateController` (Ruta HTTP que recibe el body y devuelve status 201).

## Casos de Borde y Errores

| Escenario                       | Resultado Esperado                                                    | Código HTTP actual        |
| ------------------------------- | --------------------------------------------------------------------- | ------------------------- |
| Datos faltantes                 | Mensaje: "Faltan campos requeridos"                                   | 400 Bad Request           |
| Socio inexistente               | Mensaje: "El socio especificado no existe"                            | 404 Not Found             |
| Fecha de emision invalida       | Mensaje: "La fecha de emision no es valida"                           | 400 Bad Request           |
| Fecha de vencimiento invalida   | Mensaje: "La fecha de vencimiento debe ser posterior a la de emision" | 400 Bad Request           |
| Ya existe un certificado activo | El sistema invalida el certificado activo previo y crea el nuevo      | 201 Created               |
| Error de conexión a DB          | Mensaje: "Error interno, reintente más tarde"                         | 500 Internal Server Error |

## Plan de Implementación

1. Definir `CreateMedicalCertificateRequest` y `MedicalCertificateResponse` en `@alentapp/shared`.
2. Crear la migracion de Prisma para la tabla `MedicalCertificate`.
3. Crear la entidad de dominio `MedicalCertificate` con sus validaciones basicas.
4. Crear el puerto `MedicalCertificateRepository` con metodos para crear e invalidar certificados activos previos.
5. Reutilizar `MemberRepository.findById` para validar que el socio exista.
6. Implementar `CreateMedicalCertificateUseCase`.
7. Implementar `PostgresMedicalCertificateRepository`.
8. Crear el endpoint `POST /api/v1/medical-certificates` en el `MedicalCertificateController` y registrarlo en `app.ts`.
9. Agregar el formulario de alta de certificado medico en el Frontend si corresponde a la interfaz administrativa.
10. Agregar tests unitarios del caso de uso y tests de integracion del endpoint, incluyendo el caso de invalida certificados anteriores.