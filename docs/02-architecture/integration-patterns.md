# Patrones de Integración

## Patrones

- Llamadas API síncronas para necesidades directas de comando o consulta
- Eventos de dominio para propagación de cambios propios
- Read models locales para resiliencia operacional
- Jobs de reconciliación para reparar consistencia eventual

## Reglas

- Los servicios no escribirán en la base de datos de otro servicio.
- Los servicios sólo publicarán eventos de entidades que poseen.
- Los consumidores tratarán los datos ajenos como derivados.
- La reconciliación deberá ser idempotente.

