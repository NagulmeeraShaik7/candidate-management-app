import React from "react";
import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from "react-router-dom";
import CandidateTable from "./components/CandidateTable/CandidateTable";
import ErrorPage from "./components/ErrorPage/ErrorPage";
import Register from "./components/Register/Register";
import Login from "./components/Login/Login";

function ErrorPageWrapper() {
  const { code } = useParams();
  return <ErrorPage code={parseInt(code, 10)} />;
}

// Protected route wrapper
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

const App = () => {
  return (
    <Router>
      <div className="p-6">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <CandidateTable />
              </PrivateRoute>
            }
          />
          <Route path="/error/:code" element={<ErrorPageWrapper />} />
          <Route path="*" element={<ErrorPage code={404} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
