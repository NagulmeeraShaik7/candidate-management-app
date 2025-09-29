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
import ExamDashboard from "./components/ExamDashboard/ExamDashboard";
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
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

// 🔐 Role-based route wrapper (More flexible version)
function RoleBasedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole = payload.role;
    
    console.log("User role:", userRole, "Required role:", requiredRole); // Debug log
    
    // If no specific role required, allow access
    if (!requiredRole) return children;
    
    // Check if user has the required role
    if (userRole !== requiredRole) {
      console.log(`Access denied. User role: ${userRole}, Required: ${requiredRole}`);
      
      // Redirect users to appropriate dashboard based on their actual role
      if (userRole === "admin") {
        return <Navigate to="/" replace />;
      } else {
        return <Navigate to="/exam-dashboard" replace />;
      }
    }
    
    return children;
  } catch (err) {
    console.error("Error decoding token:", err);
    return <Navigate to="/login" replace />;
  }
}

// 🔄 Smart redirect component for root path
function RootRedirect() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole = payload.role;
    
    if (userRole === "admin") {
      return <CandidateTable />;
    } else {
      return <Navigate to="/exam-dashboard" replace />;
    }
  } catch (err) {
    return <Navigate to="/login" replace />;
  }
}

const App = () => {
  return (
    <Router>
      <div className="p-6">
        <Routes>
          {/* 🔐 Auth Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* 🧍 Root path - Smart redirect based on role */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <RootRedirect />
              </PrivateRoute>
            }
          />

          {/* 🧍 Candidate Management (Protected - Admin only) */}
          <Route
            path="/candidates"
            element={
              <PrivateRoute>
                <RoleBasedRoute requiredRole="admin">
                  <CandidateTable />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          {/* 📝 Exam Dashboard (Protected - User only) */}
          <Route
            path="/exam-dashboard"
            element={
              <PrivateRoute>
                <RoleBasedRoute requiredRole="user">
                  <ExamDashboard />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          {/* 📝 Exam Routes (Protected - Accessible by both roles) */}
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