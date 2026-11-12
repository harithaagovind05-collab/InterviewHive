---
name: interviewhive-frontend-redesign
---

Reference: interview result loading fix (interview-result.js)
- Container lookup must match HTML id: `result-container`, not `report-container`.
- Add initialization at bottom: validate `sid` from URL, fetch `GET http://localhost:8007/api/interview/${sid}`, parse JSON, call `renderReport(data)`, show clear error on failure.
- Preserve `renderReport` UI unchanged. Do not redesign or modify backend files.
