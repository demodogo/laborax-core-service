# Modelo Operativo

## Modelo de Runtime

Cada servicio puede contener:

- runtime API
- publisher background
- consumer
- scheduler
- reconciler

## Ownership Operacional

- El equipo de plataforma es owner de los servicios compartidos y estándares transversales.
- Los equipos de dominio son owners de los servicios de negocio y workers auxiliares de sus dominios.
- Los controles de seguridad y la gobernanza de secrets se gestionan centralmente.

