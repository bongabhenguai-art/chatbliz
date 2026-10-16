# Chatbliz AI Workforce Integration

This branch adds a working local task-intake workspace at /workforce/index.html and links it from the existing Chatbliz OS home screen.

## Implemented
- 14 named specialist modules with descriptions and configuration status
- Browser task intake, module assignment selection, and localStorage persistence
- Task stage validation and evidence-plus-approval rule for completed status
- Node built-in unit tests

## Not yet implemented
- Server-side multi-user task database, login, RBAC enforcement and audit records
- Model execution, tool calling, AI twin, scheduling, real task handoffs
- Economic-data feeds, opportunity scraping, CRM integrations, social OAuth and publishing
- Sourcing supplier verification, live website/app builder, payments
- Fully embedded premium studio, remote cameras, broadcast streaming and rendered AI video

Never represent locally saved tasks as completed external actions. Use approved connectors and secure credentials for external operations. Review and test before merging to main.

## Run
Run npm test, then npm start and open /workforce/index.html.
