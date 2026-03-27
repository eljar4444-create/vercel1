# Validation Strategy: Phase 1

## Dimension 8: Validation Mechanisms

**Metrics / Triggers:**
- Ensure >200ms latency for availability queries is NOT triggered.
- Verify that simultaneous booking attempts successfully drop one request with an expected validation error.

**Post-Execution Validation:**
- Validate via manual concurrency script hitting the Server Action simultaneously.
- Validate via timezone spoofing in browser (change local timezone to Asia/Tokyo, ensure slots render using European profile schedule hours).
