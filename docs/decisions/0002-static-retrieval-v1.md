# ADR 0002: Static Retrieval in v1

## Decision

Use repo-managed content plus generated static artifacts for retrieval in v1.

## Reasoning

- the initial corpus is small
- this avoids paying for Postgres/vector infra immediately
- it keeps the system reviewable and easy to version

## Consequence

Runtime retrieval is simple and cheap, but large-scale content ingestion is deferred.
