# Security Policy

Vent Simulator 2D is an educational simulator and is not intended for clinical use.

## Reporting a Vulnerability

Report suspected vulnerabilities through a private repository security advisory or by opening a minimal issue that does not include exploit details. Include the affected version, reproduction steps, impact, and any suggested remediation.

## Supported Versions

Security fixes target the latest `0.x` release line.

## Security Baseline

- No secrets should be committed.
- Dependency vulnerabilities are checked with `npm audit --audit-level=moderate`.
- Static deployments should serve the headers in `public/_headers`.
- OWASP baseline review and audit cadence live in `docs/SECURITY_REVIEW.md`.
- Backup and disaster recovery assumptions live in `docs/OPERATIONS_CONTINUITY.md`.
