# Temporal Conventions

## Regla General

- `timestamp with time zone`: instantes tecnicos, serializados en ISO 8601 UTC
- `date`: fechas de negocio, serializadas como `YYYY-MM-DD`

## Implicancias

- `createdAt`, `updatedAt`, `processedAt` y equivalentes deben viajar como
  datetime UTC.
- Fechas de negocio como inicio o termino contractual no deben tratarse como
  datetimes.
- La conversion visible a zona local corresponde al frontend o al BFF.
