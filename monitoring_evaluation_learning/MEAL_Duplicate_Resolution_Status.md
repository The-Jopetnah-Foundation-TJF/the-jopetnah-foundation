---
title: MEAL Duplicate Resolution Status
document_number: TJF-MEAL-000
version: 1.0
status: Approved
classification: Public
document_owner: Repository Administration
approved_by: Executive Director
effective_date: 2026-10-08
review_cycle: Annual
---

# MEAL Duplicate Resolution Status

## Summary

The repository previously contained two overlapping MEAL directories:

- `monitoring-evaluation/` — legacy archive retained for review
- `monitoring_evaluation_learning/` — active and canonical working folder

This file documents the cleanup decision.

## Decision

The active directory for all new and ongoing MEAL work is:

- `monitoring_evaluation_learning/`

The legacy directory is preserved as a read-only review archive rather than deleted outright, which protects historical documentation while maintaining a clear working path for teams.

## Safe Repository Practice

The final structure was intentionally chosen to avoid content loss:

1. Keep the canonical directory for current work.
2. Preserve old documents for review and historical traceability.
3. Update references to the active folder.
4. Only archive or delete legacy files after final review and approval.

## Status

- Canonical directory: Active
- Legacy directory: Archived for review
- Data loss risk: Prevented
- Repository standardization: In progress

---

> This repository has been stabilized to preserve content while establishing a single working location for MEAL documentation.
