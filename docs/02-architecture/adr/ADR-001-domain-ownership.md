# ADR-001 Ownership de Dominio

## Estado

Aprobado

## Decisión

Los workers y vehicles serán gestionados por `workforce-registry-service`, no por `access-control-service`.

## Consecuencias

- Elimina duplicidad de identidad maestra entre productos
- Obliga a que access control utilice sólo datos derivados
- Soporta futuros productos de RRHH, acreditación y cumplimiento

