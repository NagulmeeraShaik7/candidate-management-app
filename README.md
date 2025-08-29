# Candidate Management App

A modern, full-featured React application for managing candidate information. This app allows users to add, edit, delete, search, and filter candidates with a responsive and user-friendly interface. It is designed for HR teams, recruiters, or anyone who needs to keep track of candidate data efficiently.

---

## ✨ Features

- **List Candidates:** View all candidates in a sortable, paginated table.
- **Add/Edit/Delete:** Easily add new candidates, update their information, or remove them.
- **Search & Filter:** Quickly find candidates by name, email, phone, gender, qualification, experience, or skills.
- **Responsive UI:** Works seamlessly on desktop and mobile devices.
- **Error Handling:** Custom error pages for 400, 404, and 500 HTTP errors.
- **Component-Based:** Clean, modular React components for maintainability.
- **Styling:** Custom CSS and Bootstrap Icons for a modern look.
- **Testing:** Includes unit tests with Jest and React Testing Library.

---

## 📁 Project Structure

```
candidate-management-app/
├── public/
│   └── index.html
├── src/
│   ├── App.css
│   ├── App.jsx
│   ├── App.test.js
│   ├── index.css
│   ├── index.js
│   ├── logo.svg
│   ├── reportWebVitals.js
│   ├── setupTests.js
│   └── components/
│       ├── CandidateForm.css
│       ├── CandidateForm.jsx
│       ├── CandidateTable.css
│       ├── CandidateTable.jsx
│       ├── ErrorPage.css
│       ├── ErrorPage.jsx
│       ├── FilterSidebar.css
│       └── FilterSidebar.jsx
├── package.json
└── README.md
```

---

## 🛠️ Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

---

## 🚀 Getting Started

### 1. **Clone the Repository**

```sh
git clone https://github.com/NagulmeeraShaik7/candidate-management-app
cd candidate-management-app
```

### 2. **Install Dependencies**

Install all required npm packages:

```sh
npm install
```

### 3. **Start the Development Server**

This will start the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

```sh
npm start
```

- The page will reload automatically if you make edits.
- You will see build errors and lint warnings in the console.

### 4. **Build for Production**

To create an optimized production build in the `build/` directory:

```sh
npm run build
```

- This bundles React in production mode and optimizes the build for best performance.
- The build is minified and filenames include the hashes.

### 5. **Run Tests**

To run the test suite using Jest and React Testing Library:

```sh
npm test
```

- This launches the test runner in interactive watch mode.
- Tests are located in files with `.test.js` extension, such as `src/App.test.js`.

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

This app expects a backend API with the following endpoints:

- `GET /api/candidates` — List all candidates
- `POST /api/candidates` — Add a new candidate
- `PUT /api/candidates/:id` — Update a candidate
- `DELETE /api/candidates/:id` — Delete a candidate

**Default API URL:**  
`https://candidate-management-app-backend.onrender.com/api/candidates`

If you want to use your own backend, update the API endpoint in the source code.

---

## 🖌️ Customization

- **Icons:** Uses [Bootstrap Icons](https://icons.getbootstrap.com/) via CDN in `public/index.html`.
- **Styling:** Custom CSS for each component for a modern look.
- **Routing:** Uses `react-router-dom` for navigation and error pages.

---

## 📦 Deployment

After building the app (`npm run build`), deploy the contents of the `build/` directory to your preferred static hosting service (e.g., Netlify, Vercel, GitHub Pages).

- Deployment URL: https://candidate-management-app-tan.vercel.app/

---

