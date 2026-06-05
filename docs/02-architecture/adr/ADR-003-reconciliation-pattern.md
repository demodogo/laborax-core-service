# ADR-003 Patrón de Reconciliación

## Estado

Aprobado

## Decisión

Todo servicio que dependa de snapshots de datos maestros ajenos para operar deberá implementar:

- consumo de eventos
- proyección idempotente
- proceso de reconciliación

## Consecuencias

- Reduce el riesgo de eventos perdidos o retrasados
- Agrega complejidad operativa de forma intencional
- Establece consistencia eventual como mecanismo gestionado

