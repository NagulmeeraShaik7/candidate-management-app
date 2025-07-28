// File: src/App.jsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import CandidateRegister from "./components/CandidateRegister";
import CandidateLogin from "./components/CandidateLogin";
import CandidateTable from "./components/CandidateTable";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/register" />} />
        <Route path="/register" element={<CandidateRegister />} />
        <Route path="/login" element={<CandidateLogin setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route
          path="/candidates"
          element={isLoggedIn ? <CandidateTable /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
};

export default App;
