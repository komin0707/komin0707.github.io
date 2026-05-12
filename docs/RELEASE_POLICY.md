# Release Policy

## Versioning

Vent Simulator 2D uses semantic versioning.

## Patch Releases

Patch releases may include bug fixes, security fixes, test updates, and documentation corrections that do not change simulator behavior contracts.

## User-Facing Updates

User-facing changes should be recorded in `CHANGELOG.md` and GitHub release notes. Critical clinical-safety copy changes should be highlighted in the release summary.

## Rollback

Static deployments should keep the previous successful build artifact available through the hosting provider rollback mechanism.
