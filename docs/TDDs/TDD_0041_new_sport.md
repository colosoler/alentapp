---
id: "0041"
estado: Propuesto
autor: Tomas Rosato
fecha: 2026-05-03
titulo: Alta de Deporte
---

# TDD-0041: Alta de Deporte

## Contexto de Negocio (PRD)

### Objetivo

Permite registrar un nuevo deporte en el club Alentapp. Se debe poder definir su nombre, descripcion, capacidad maxima, el precio adicional y si requiere certificado medico.

Al crear el deporte, el sistema deberá inicializar el cupo actual en 0, sin asociarlo todavía a miembros ni registrar inscripciones individuales.

Este TDD es necesario porque define las reglas básicas de disponibilidad de cupo que luego podran ser utilizadas por la inscripción (`Enrollment`) en una implementación futura.

### User Persona

-Nombre: Carlos (Administrativo).
-Necesidad: Registar un nuevo deporte que se va a brindar en el club, evitando errores como nombres duplicados, capacidades inválidas o datos incompletos.

### Criterios de Aceptación

- El sistema debe validar que el nombre no este vacio y sea unico.
- El sistema debe validar que la descripcion no este vacia.
- El sistema debe validar que `max_capacity` sea un numero entero, mayor a cero.
- El sistema debe validar que `additional_price` sea un numero flotante y no vacio.
- El sistema debe registrar si es necesario un certificado medico.
-  Al crear un deporte, `current_enrollment_count` debe inicializarse en 0.
- Al finalizar, el sistema debe mostrar un mensaje de éxito y limpiar el formulario.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `Sport` con las siguientes propiedades y restricciones:
- `id`: UUID, clave primaria.
- `name`: string, único e inmutable, requerido.
- `description`: string, requerido.
- `max_capacity`: int, requerido y validado.
- `current_enrollment_count`: int, requerido, inicia en 0.
- `additional_price`: float, requerido.
- `requires_medical_certificate`: boolean, requerido.

### Contrato de API (@alentapp/shared)

- Endpoint: `POST /api/v1/sports`
- Request Body (`CreateSportRequest`):

```ts
{
    name : string;
    description: string;
    max_capacity: number;
    additional_price: number;
    requires_medical_certificate: boolean;
}
```
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

### Componentes de Arquitectura Hexagonal

1. **Entidad de Dominio**: `Sport` (Valida los datos).
2. **Puerto**: `SportRepository` (Metodo `create(sport)`).
3. **Caso de Uso**: `CreateSportUseCase` (Valida datos y delega la persistencia).
4. **Adaptador de Salida**: `PostgresSportRepository` (Creacion usando Prisma).
5. **Adaptador de Entrada**: `SportController` (Ruta HTTP que recibe el body y devuelve status 201).


## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                                           | Código HTTP actual        |
| -------------------------- | ------------------------------------------------------------ | ------------------------- |
| Datos faltantes            | Mensaje: "Faltan campos requeridos"                         | 400 Bad Request           |
| Capacidad no es mayor a cero  | Mensaje: "La capacidad maxima debe ser mayor a cero " | 400 Bad Request           |
|  Deporte ya creado          | Mensaje: "Ya existe ese deporte"             | 409 Conflict           |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde"               | 500 Internal Server Error |
| Creacion exitosa           | Datos del deporte creado                                  | 201 Created               |

## Plan de Implementación

1. Definir `CreateSportRequest` en `@alentapp/shared`.
2. Crear la migracion de Prisma para la tabla `Sport`.
3. Crear la entidad de dominio `Sport` con la regla `max_capacity > 0`.
4. Crear el puerto `SportRepository` con el metodo `create`.
5. Implementar `CreateSportUseCase`.
6. Implementar `PostgresSportRepository`.
7. Crear el endpoint `POST /api/v1/sports` en el `SportController` y registrarlo en `app.ts`.
8. Agregar el formulario de alta de un deporte en el Frontend.
9. Agregar tests unitarios del caso de uso y tests de integracion del endpoint.





