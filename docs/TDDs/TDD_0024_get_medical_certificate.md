---
id: "0024"
estado: Propuesto
autor: Lucas Modernell
fecha: 2026-05-03
titulo: Consulta de Certificado Medico
---

# TDD-0024: Consulta de Certificado Medico

## Contexto de Negocio (PRD)

### Objetivo

Permitir consultar certificados medicos para conocer si un socio tiene un certificado vigente y cual fue el ultimo emitido.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Ver rapidamente el certificado vigente de un socio antes de permitir una actividad que lo requiera.

### Criterios de Aceptación

- El sistema debe permitir consultar un certificado por su identificador.
- El sistema debe permitir consultar todos los certificados de un socio.
- El sistema debe indicar cual es el certificado activo actual del socio.
- Si el socio no tiene certificados, debe devolver una lista vacia.
 - Las respuestas de consulta deben incluir `file_url` cuando exista, y debe ser posible descargar/ver el PDF asociado.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

- Endpoint: `GET /api/v1/medical-certificates/:id`
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

- Endpoint: `GET /api/v1/members/:memberId/medical-certificates`
- Response:

```ts
MedicalCertificateResponse[]
```

El `MedicalCertificateResponse` incluirá `file_url?: string` cuando exista un archivo asociado.

- Endpoint: `GET /api/v1/members/:memberId/medical-certificates/active`
- Response (`MemberMedicalCertificateStatusResponse`):

```ts
{
    memberId: string;
    hasActiveCertificate: boolean;
    activeCertificate?: MedicalCertificateResponse;
}

Si el certificado activo incluye un archivo, `activeCertificate.file_url` deberá estar presente.
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `MedicalCertificateRepository` (Metodos `findById(id)`, `findByMemberId(memberId)` y `findActiveByMemberId(memberId)`).
2. **Caso de Uso**: `GetMedicalCertificateUseCase` (Consulta un certificado por ID).
3. **Caso de Uso**: `ListMemberMedicalCertificatesUseCase` (Consulta certificados asociados a un socio).
4. **Caso de Uso**: `GetMemberMedicalCertificateStatusUseCase` (Determina si hay un certificado activo).
5. **Adaptador de Salida**: `PostgresMedicalCertificateRepository` (Consultas usando Prisma).
6. **Adaptador de Entrada**: `MedicalCertificateController` (Rutas HTTP de consulta).

## Casos de Borde y Errores

| Escenario                 | Resultado Esperado                                           | Código HTTP actual        |
| ------------------------- | ------------------------------------------------------------ | ------------------------- |
| ID invalido               | Mensaje: "El id del certificado no es valido"                | 400 Bad Request           |
| Certificado inexistente   | Mensaje: "El certificado no existe"                          | 404 Not Found             |
| Socio sin certificados    | Lista vacia                                                  | 200 OK                    |
| Certificado activo        | `hasActiveCertificate: true` y certificado activo asociado   | 200 OK                    |
| Sin certificado activo    | `hasActiveCertificate: false`                                | 200 OK                    |
| Error de conexión a DB    | Mensaje: "Error interno, reintente más tarde"                | 500 Internal Server Error |

## Plan de Implementación

1. Definir `MedicalCertificateResponse` y `MemberMedicalCertificateStatusResponse` en `@alentapp/shared`.
2. Ampliar `MedicalCertificateRepository` con los metodos de consulta necesarios.
3. Implementar `GetMedicalCertificateUseCase`.
4. Implementar `ListMemberMedicalCertificatesUseCase`.
5. Implementar `GetMemberMedicalCertificateStatusUseCase`.
6. Implementar las consultas en `PostgresMedicalCertificateRepository`.
7. Crear los endpoints `GET /api/v1/medical-certificates/:id`, `GET /api/v1/members/:memberId/medical-certificates` y `GET /api/v1/members/:memberId/medical-certificate-status`.
8. Agregar la vista o seccion de consulta de certificados medicos en el Frontend.
9. Agregar tests unitarios de los casos de uso y tests de integracion de los endpoints.