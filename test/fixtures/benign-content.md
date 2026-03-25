---
name: safe_content
description: Content that might look suspicious but is benign
type: project
---

## System Architecture
[source: architecture-docs]

The system uses a microservices architecture with the following components:
- API Gateway for routing
- Auth service for authentication
- Data service for persistence

## Important Notes
[source: team-meeting]

IMPORTANT: The deployment deadline is March 30th.

We need to remember to always run tests before merging.

The new feature should act as a proxy between the client and server.

From now on, deployments happen on Tuesdays.

## Discussion About Security

The team discussed how attackers might try to "ignore previous instructions"
in prompt injection attacks. We should implement guards against this.

We read about how people "pretend you are" attacks work in the OWASP docs.

## Configuration

The system prefix is "system:" followed by the service name.
Bearer tokens should be rotated every 90 days.
The base URL format is https://api.example.com/v2.

## API Documentation

The password reset endpoint requires the old password.
API key rotation is handled by the secrets manager.
