# Candidate Management App — Components & Services Reference

This file documents the app's React components and core service functions end-to-end. It summarizes purpose, inputs (props), outputs (events/navigation), state, side-effects (API calls), and implementation notes for each file in `src/`.

Use this as a developer reference when exploring or extending the project.

---

## Quick start (development)

- Install dependencies: npm install
- Start dev server: npm start
- Run tests: npm test

The app expects a backend API with base URL:
`https://candidate-management-app-backend.onrender.com/api`

Tokens are stored in `localStorage` or `sessionStorage` under `token` and are used as `Authorization: Bearer <token>`.

---

## Top-level files

### `src/index.js`
- Bootstraps React with `ReactDOM.createRoot(...)` and renders `<App />` inside `#root`.
- Imports global stylesheet `index.css` and calls `reportWebVitals()`.

### `src/reportWebVitals.js`
- Small helper to report web vitals when passed a callback. Uses `web-vitals` on demand.

### `src/setupTests.js`
- Loads `@testing-library/jest-dom` for DOM matchers used in tests.

### `src/App.jsx`
Purpose
- App router and role-based route protection.

Key components used
- `CandidateTable`, `ExamDashboard`, `Register`, `Login`, `ErrorPage`, `ExamPage`, `ExamResult`.

Important helpers
- `PrivateRoute({children})` — checks for `token` in `localStorage`/`sessionStorage`; redirects to `/login` if missing.
- `RoleBasedRoute({children, requiredRole})` — decodes JWT payload (via `atob`) and compares `payload.role` to `requiredRole`. Redirects based on role mismatch.
- `RootRedirect()` — decides default landing page (admin -> `CandidateTable`, user -> `/exam-dashboard`) by decoding token.

Notes
- The app decodes token without verification (assumes backend issues signed tokens). If token is malformed, redirects to login.

---

## Services

### `src/services/examService.js`
Purpose
- Centralized API utilities used by exam-related components.

Key exports
- `getExamDetails(examId)` — GET `/exam/:examId` (returns exam metadata and questions).
- `submitExam(examId, answers)` — POST `/exam/:examId/submit` with payload `{ answers }`.
- `getExamResult(examId)` — GET `/exam/:examId/result`.
- `logProctoringEvent(...)` — POST `/proctoring/log` used to persist proctoring events.
- `getProctoringLogs(examId)` — GET `/proctoring/:examId`.
- `getProctoringSummary(examId)` — higher-level aggregation helper.
- `formatAnswersForSubmission(questions, userAnswers)` — normalizes answers for the backend.
- `validateAnswersBeforeSubmit(answers, questions)` — local validator to ensure answers object matches questions (type checks for mcq/msq/short/descriptive).

Implementation notes
- `API_BASE` is set to `https://candidate-management-app-backend.onrender.com/api`.
- `getToken()` takes token from `localStorage` or `sessionStorage`.
- `handleResponse` centralizes error handling (throws on non-2xx after parsing body).
- `logProctoringEvent` intentionally swallows/protects proctoring errors and returns `{ success: false, error }` rather than throwing — this prevents proctoring failures from breaking exam flow.

Edge cases
- `validateAnswersBeforeSubmit` enforces that the answers object has the same number of keys as questions and validates answer types.

---

## Components reference

For each component below you'll find: file path, brief description, props (if any), local state, important side effects (API calls / navigation), and developer notes.

### `src/components/ CandidateTable / CandidateTable.jsx`
- Purpose: Admin candidates dashboard — list, search, paginate, filter, CRUD operations.
- Props: none
- Local state highlights: `candidates`, `searchTerm`, `page`, `totalPages`, `loading`, `fetchError`, `successMsg`, `editCandidate`, `filters`, `deleteCandidate`.
- API calls: 
  - GET `/api/candidates?page=&limit=` — fetch list (uses token). 
  - DELETE `/api/candidates/:id` — delete candidate.
  - POST/PUT handled by `CandidateForm`.
- Features: client-side filter on loaded page (filters, skills, experience). Pagination control fetches server pages.
- UX notes: shows `CandidateForm` modal for Add/Edit. Handles 401/403 by clearing token and redirecting to `/login`. Shows error pages for 400/404/500 responses.

Contract (inputs/outputs)
- Inputs: none
- Outputs: Navigates to `/login` or `/error/:code` on auth/API issues. Emits `CandidateForm` `onSaved` callback to refresh list.

Edge cases
- Assumes backend returns `{ data: { results, meta: { total } } }` shape.
- Filtering is client-side (only for currently fetched page); searching across all pages is not implemented.

Files
- CSS: `src/components/CandidateTable/CandidateTable.css`

---

### `src/components/CandidateForm/CandidateForm.jsx`
- Purpose: Add / Edit candidate form component (modal)
- Props:
  - `onClose()` — called when cancel/close pressed
  - `onSaved()` — called after successful save (to let parent refresh list)
  - `candidate` (optional) — object with existing candidate data for edit mode
- Local state: `form` (fields), `formErrors`, `submitError`, `isSubmitting`
- API calls:
  - POST `/api/candidates` — create
  - PUT `/api/candidates/:id` — update
- Validation: client-side validation for name, phone (regex), email format, highest qualification, skills (comma separated)
- Notes: Email field is disabled in edit mode. On success either triggers `onSaved()` or `onClose()`.

Contract
- Input: candidate object (optional). Output: calls `onSaved()` after successful save.

Edge cases
- Expects token in `localStorage` for authenticated operations. Navigates to `/error/:code` for 400/404/500 responses.

Files
- CSS: `src/components/CandidateForm/CandidateForm.css`

---

### `src/components/FilterSidebar/FilterSidebar.jsx`
- Purpose: Sidebar UI for filtering candidates (gender, qualification, experience range, skills)
- Props:
  - `onClose()` — close sidebar
  - `onFilter(filters)` — returns filter object used by parent
- Behavior: Validates experience min/max and calls `onFilter` when applied.

Files
- CSS: `src/components/FilterSidebar/FilterSidebar.css`

---

### `src/components/Login/Login.jsx`
- Purpose: Login page for both admin and candidate roles.
- Local state: `formData` ({email,password,role}), `error`, `success`, `loading`, `showPassword`.
- API call: POST `/api/auth/login` with JSON body `{ email, password, role }`.
- On success: stores `token` in localStorage and redirects based on decoded token role (admin -> `/`, user -> `/exam-dashboard`).
- UX details: animated background, accessible labels, password show/hide toggle.

Edge cases
- If token cannot be decoded, falls back to `formData.role` as role for redirect.
- Expects `data.data.token` or `data.token` in login response.

Files
- CSS: `src/components/Login/Login.css`

---

### `src/components/Register/Register.jsx`
- Purpose: Registration page (create new user)
- Local state: `formData` ({name,email,password,role}), `error`, `success`, `loading`.
- API call: POST `/api/auth/register`.
- On success: shows success message and redirects to `/login`.

Files
- CSS: `src/components/Register/Register.css`

---

### `src/components/ExamDashboard/ExamDashboard.jsx`
- Purpose: Candidate dashboard showing profile and instructions; starts exam generation.
- Local state: `candidate`, `loading`, `error`, `generatingExam`
- Behavior: tries to find candidate by decoding token email then paging through `/api/candidates` (server-side pagination) until a match is found. If found, shows profile and "Start Assessment".
- API calls:
  - GET `/api/candidates?page=&limit=` (search candidate by email)
  - POST `/api/exam/generate/` (start exam generation for candidate)
- Edge cases: If token missing or role !== 'user' shows access denied message.

Notes
- This component may do multiple paginated requests to find candidate—careful with large user datasets; the code increases `limit` to 50 to reduce calls.

Files
- CSS: `src/components/ExamDashboard/ExamDashboard.css`

---

### `src/components/ExamPage/ExamPage.jsx`
- Purpose: Main exam-taking UI: renders questions, timer, integrative `ProctoringMonitor` and handles submit/auto-submit and disqualification flow.
- Local state: `exam`, `answers` (object keyed by question index), `timer`, `submitting`, `violationCount`, `disqualified`.
- Uses `getExamDetails` on mount to fetch exam data and initialize `answers`.
- Proctoring: mounts `ProctoringMonitor` with `examId` and `candidateId` and reacts to `onViolation` and `onDisqualify` callbacks. On disqualification auto-submits current answers and navigates away.
- Submission flow:
  - Validates answers via `validateAnswersBeforeSubmit`.
  - Formats answers via `formatAnswersForSubmission`.
  - Calls `submitExam`.
  - On success navigates to `/exam/:examId/result`.
- Timer: counts down and auto-submits when it reaches zero.

Contract
- Inputs: `examId` from route params.
- Outputs: navigates to result or dashboard on various flows.

Files
- CSS: `src/components/ExamPage/ExamPage.css`

---

### `src/components/ProctoringMonitor/ProctoringMonitor.jsx`
- Purpose: Simulated proctoring monitor which:
  - attaches to webcam/mic,
  - detects tab switches, window focus/blur,
  - simulates face detection and sound/inspect events,
  - logs proctoring events via `logProctoringEvent` and `logCommonProctoringEvent`.
- Props:
  - `examId`, `candidateId` (required for logging)
  - `onViolation(violation)` — informs parent of a new violation
  - `onDisqualify(totalViolations, totalWarnings)` — called when disqualification threshold reached
- Behavior: starts monitoring with `navigator.mediaDevices.getUserMedia`, simulates detection with timers and probabilistic events, and keeps violation/warning counts. On too many warnings it calls `onDisqualify`.
- Safety: catches and logs failures to access camera/mic and logs this via service API.

Files
- CSS: `src/components/ProctoringMonitor/ProctoringMonitor.css`

Notes
- The face/inspect/sound checks are simulated; replace with real ML detection logic or integrate with a backend/video analysis service for production.

---

### `src/components/ExamResult/ExamResult.jsx`
- Purpose: Displays scored results and per-question analysis.
- Behavior: fetches result from `getExamResult(examId)` and uses `getExamDetails` to retrieve questions to produce a detailed comparison view.
- Auto-grading logic included for `mcq`, `msq`, `short`, `descriptive` types (normalizes strings, compares arrays for msq).
- Handles printing and navigation buttons.

Files
- CSS: `src/components/ExamResult/ExamResult.css`

Notes
- Normalization strategy for short/descriptive answers is simple string lowercasing and trimming. For more robust grading consider NLP similarity, tokenization, or manual review flows.

---

### `src/components/ErrorPage/ErrorPage.jsx`
- Purpose: Generic error display; accepts `code` prop (route wrapper uses `useParams()` to pass numeric codes).
- Renders friendly message and a link back to home.

Files
- CSS: `src/components/ErrorPage/ErrorPage.css`

---

## Testing and quality notes
- There is a basic test in `src/App.test.js` that expects "learn react" text; update tests to reflect real content or replace with route smoke tests.
- Run `npm test` for the test runner.

## Developer notes & suggestions
- Token handling: token is decoded client-side via `atob`. Consider using a safe JWT library that doesn't throw on malformed tokens and centralize decoding.
- API base: If you need to switch to different environments, extract `API_BASE` into `.env` (e.g., `REACT_APP_API_BASE`) and reference `process.env.REACT_APP_API_BASE` in `examService.js`.
- Proctoring: currently simulated — to harden production readiness integrate a real face-detection model or server-side verification and secure screenshot upload.
- Error handling: several components redirect to `/error/:code` on specific HTTP codes. Consider a central error boundary for runtime errors.

---

## Where to start making changes
- Authentication & routing: `src/App.jsx`
- Exams API behavior & client validation: `src/services/examService.js`, `src/components/ExamPage/ExamPage.jsx`
- Candidate management: `src/components/CandidateTable/*` and `src/components/CandidateForm/*`
- Proctoring: `src/components/ProctoringMonitor/*`

---



