# Estándares API

## Principios

- APIs HTTP RESTful para boundaries de servicio.
- Payloads JSON para request y response.
- Endpoints versionados públicos o internos donde corresponda.
- Semántica idempotente en comandos donde sea posible.
- Autorización aplicada en el servicio dueño del recurso.

## Convenciones HTTP

- `GET` para consulta.
- `POST` para creación o comandos controlados.
- `PATCH` para actualización parcial.
- `DELETE` solo para baja lógica cuando aplique al negocio.
- `204 No Content` para comandos idempotentes sin payload de respuesta.

## Correlation Id

- Todo cliente puede enviar `x-correlation-id`.
- Si no lo envía, el servicio debe generarlo.
- Toda respuesta debe devolver `x-correlation-id`.
- Los servicios deben propagar `x-correlation-id` en llamadas internas y publicación de eventos cuando aplique.

## Modelo de Error

Las respuestas de error deben incluir:

- Código HTTP correcto.
- Mensaje legible para humanos.
- Detalle de validación cuando corresponda.
- `x-correlation-id` como header de respuesta.

## Seguridad

- Nunca retornar passwords, hashes, refresh token hashes o client secret hashes.
- Los client secrets solo pueden ser visibles en create/rotate.
- Los endpoints internos deben usar service clients y scopes M2M.
- El BFF puede componer read models, pero no debe relajar autorización del servicio dueño del recurso.
