# Technical Debt Register

This register tracks intentional follow-up work. The current source scan has no application `TODO` or `FIXME` comments; future debt should be recorded here or in an issue before it is merged.

## Current Items

| ID | Area | Status | Notes |
| --- | --- | --- | --- |
| TD-001 | Coverage | Open | Line and branch coverage are above configured thresholds but not yet 100%. |
| TD-002 | External operations | Open | Monitoring, analytics, Snyk, custom domain, and certificate automation require real service accounts. |
| TD-003 | Documentation exports | Open | PDF manuals, Storybook, and generated API docs remain unimplemented. |

## Policy

- Do not add inline `TODO` or `FIXME` comments without a matching issue or entry here.
- Remove an entry only after the implementation and verification command are recorded in the release notes or pull request.
- Re-run `rg -n "TODO|FIXME" src docs` before release.
