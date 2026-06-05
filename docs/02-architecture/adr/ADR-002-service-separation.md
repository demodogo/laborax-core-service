# ADR-002 Separación de Servicios

## Estado

Aprobado

## Decisión

Laborax será implementado como múltiples servicios de negocio más servicios compartidos, no como un único backend monolítico.

## Consecuencias

- Escalamiento y ciclo de vida independientes para acceso, acreditación y cumplimiento
- Ownership claro por servicio
- Necesidad de eventing, reconciliación y disciplina operativa cross-service

