# Candidate Management App

A modern, full-featured React application for managing candidate information. This app allows users to add, edit, delete, search, and filter candidates with a responsive and user-friendly interface. It also includes an exam flow for candidates with simulated proctoring and result reporting.

---

## ✨ Features

- List, add, edit, and delete candidates with pagination.
- Role-based routing (admin vs candidate) and protected routes.
- Candidate exam flow with timer, simulated proctoring, auto-submit and disqualification logic.
- Detailed exam results with auto-grading for MCQ/MSQ/short/descriptive answers.
- Client-side validation and helpful error pages for 400/404/500 responses.

---

## 📁 Project Structure (high-level)

```
candidate-management-app/
├── public/
├── src/
│   ├── App.jsx               # Router, role-based routes
│   ├── index.js
│   ├── services/
│   │   └── examService.js    # API helpers + proctoring event logging
│   └── components/
│       ├── CandidateTable/
│       ├── CandidateForm/
│       ├── FilterSidebar/
│       ├── Login/
│       ├── Register/
│       ├── ExamDashboard/
│       ├── ExamPage/
│       ├── ProctoringMonitor/
│       ├── ExamResult/
│       └── ErrorPage/
├── package.json
└── README.md
```

---

## 🛠️ Prerequisites

- Node.js (v16+ recommended)
- npm

---

## 🚀 Development quick start

1. Clone and install:

```powershell
git clone https://github.com/NagulmeeraShaik7/candidate-management-app ; cd candidate-management-app
npm install
```

2. Start the dev server:

```powershell
npm start
```

3. Run tests:

```powershell
npm test
```

4. Build for production:

```powershell
npm run build
```

---

## ⚙️ Available Scripts

| Command         | Description                                 |
|-----------------|---------------------------------------------|
| `npm start`     | Start the development server                |
| `npm run build` | Build the app for production                |
| `npm test`      | Run the test suite                          |
| `npm run eject` | Eject the app (not recommended)             |

---

## 🌐 Backend API

The app uses an API base configured in code as `https://candidate-management-app-backend.onrender.com/api`.

Common endpoints used by the frontend:

- `POST /api/auth/login` — login, returns token
- `POST /api/auth/register` — register new user
- `POST /api/auth/logout` — logout
- `GET /api/candidates?page=&limit=` — paginated list
- `POST /api/candidates` — create candidate
- `PUT /api/candidates/:id` — update candidate
- `DELETE /api/candidates/:id` — delete candidate
- `POST /api/exam/generate` — generate/start exam for candidate
- `GET /api/exam/:examId` — get exam details
- `POST /api/exam/:examId/submit` — submit exam answers
- `GET /api/exam/:examId/result` — get exam result
- Proctoring endpoints: `POST /api/proctoring/log`, `GET /api/proctoring/:examId`

If you prefer environment-based configuration, extract `API_BASE` in `src/services/examService.js` to an env var like `REACT_APP_API_BASE`.

---

## Components & Services (detailed)

This project contains the following important components and services. The summary below lists purpose, props, state highlights, API interactions, and developer notes.

- `src/services/examService.js` — centralized API layer and helpers:
	- getExamDetails, submitExam, getExamResult
	- proctoring helpers: logProctoringEvent, getProctoringLogs, getProctoringSummary
	- formatting and validation helpers: formatAnswersForSubmission, validateAnswersBeforeSubmit
	- Notes: uses token from localStorage/sessionStorage and `handleResponse` to parse API responses.

- `src/components/CandidateTable/CandidateTable.jsx` — Admin dashboard
	- Fetches paginated candidate lists, supports search, client-side filters (gender, qualification, experience, skills), pagination, and delete.
	- Shows `CandidateForm` modal for Add/Edit.
	- Handles 401/403 by clearing token and redirecting to `/login`, routes to `/error/:code` for other server errors.

- `src/components/CandidateForm/CandidateForm.jsx` — Add/Edit candidate form
	- Props: `onClose()`, `onSaved()`, `candidate` (optional)
	- Validates fields (name, phone, email, skills) and posts to create/update endpoints.

- `src/components/FilterSidebar/FilterSidebar.jsx` — sidebar filter UI
	- Props: `onClose()`, `onFilter(filters)`
	- Validates experience range and returns filter object to parent.

- `src/components/Login/Login.jsx` — Login page
	- Calls `POST /api/auth/login`, stores token in localStorage and redirects (admin -> `/`, user -> `/exam-dashboard`).
	- Includes role selection and password show/hide UX.

- `src/components/Register/Register.jsx` — Registration page
	- Calls `POST /api/auth/register` and redirects to `/login` on success.

- `src/components/ExamDashboard/ExamDashboard.jsx` — Candidate dashboard
	- Tries to find candidate by decoding token and searching paginated candidates. Starts exam generation via `POST /api/exam/generate`.

- `src/components/ExamPage/ExamPage.jsx` — Exam taking UI
	- Loads exam with `getExamDetails`, initializes answers, renders questions and progress, includes timer and submit flow.
	- Integrates `ProctoringMonitor` and acts on `onViolation` / `onDisqualify` (auto-submit and disqualify flows).

- `src/components/ProctoringMonitor/ProctoringMonitor.jsx` — Proctoring simulation
	- Uses `navigator.mediaDevices.getUserMedia` for video/audio (small feed), detects tab/window changes, simulates face/sound/inspect events, logs via `logProctoringEvent`.
	- Tracks warnings and triggers `onDisqualify` after repeated violations.

- `src/components/ExamResult/ExamResult.jsx` — Results & analysis
	- Fetches result and exam details, auto-grades various types (mcq, msq, short, descriptive) with normalization, presents detailed per-question comparison, and printing.

- `src/components/ErrorPage/ErrorPage.jsx` — Friendly error page

---

## Development notes & recommended improvements

- Move `API_BASE` to an environment variable (e.g., `REACT_APP_API_BASE`) for easier environment switching.
- Centralize token decoding and JWT error handling to avoid try/catch duplicate logic across components.
- Replace simulated proctoring with an actual detection pipeline (server-side or browser ML) for production use.
- Expand test coverage: add unit tests for service helpers (`examService`) and component integration tests for key flows (login, candidate CRUD, exam lifecycle).

---

# Deployed URL

```
https://candidate-management-app-tan.vercel.app/

```

# Demo Video

<video controls src="20251004-0833-24.0642789.mp4" title="Title"></video>
