---
name: project_context
description: Clean memory file for testing
type: project
---

## Meeting Notes — 2025-03-20
[source: team-standup]

The team discussed the roadmap for Q2. Key points:
- Launch the new dashboard by April 15
- Migrate legacy API endpoints to v2
- Improve test coverage to 90%

## User Preferences
[source: user-settings]

The user prefers dark mode and vim keybindings.
They work primarily in TypeScript and Go.

## Architecture Decision
[source: adr-042]

We decided to use PostgreSQL for the main database.
Redis will handle caching and session storage.
The API will follow REST conventions with JSON responses.
