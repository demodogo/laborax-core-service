# Modelo de Datos Conceptual

## Conceptos Base

- Identidad de Plataforma
- Tenant
- Company
- Worker
- Vehicle
- Assignment
- Requirement
- Document
- Accreditation Status
- Access Credential
- Access Event
- Compliance Period
- Observation
- Certification Case
- Employee Profile
- Karin Case

## Relaciones Conceptuales

- Un `tenant` posee una o más `companies`.
- Un `worker` puede estar asignado a una o más `companies`.
- Un `vehicle` puede vincularse a una o más `companies`.
- Un `requirement` aplica a un tipo de sujeto y alcance.
- Un `document` satisface o intenta satisfacer un requirement.
- Un `accreditation status` resume el cumplimiento de requirements.
- Un `access event` referencia un worker o vehicle y el contexto de dispositivo de acceso.

