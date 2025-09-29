import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  Navigate,
} from "react-router-dom";

// 🔸 Auth & Dashboard
import CandidateTable from "./components/CandidateTable/CandidateTable";
import Register from "./components/Register/Register";
import Login from "./components/Login/Login";
import ErrorPage from "./components/ErrorPage/ErrorPage";

// 📝 Exam Components
import ExamPage from "./components/ExamPage/ExamPage";
import ExamResult from "./components/ExamResult/ExamResult";

// 🔸 Wrapper to handle dynamic error codes
function ErrorPageWrapper() {
  const { code } = useParams();
  return <ErrorPage code={parseInt(code, 10)} />;
}

// 🔐 Protected route wrapper
function PrivateRoute({ children }) {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

const App = () => {
  return (
    <Router>
      <div className="p-6">
        <Routes>
          {/* 🔐 Auth Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* 🧍 Candidate Management (Protected) */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <CandidateTable />
              </PrivateRoute>
            }
          />

          {/* 📝 Exam Routes (Protected) */}
          <Route
            path="/exam/:examId"
            element={
              <PrivateRoute>
                <ExamPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/exam/:examId/result"
            element={
              <PrivateRoute>
                <ExamResult />
              </PrivateRoute>
            }
          />

          {/* 🚨 Error Routes */}
          <Route path="/error/:code" element={<ErrorPageWrapper />} />
          <Route path="*" element={<ErrorPage code={404} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
