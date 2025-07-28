import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CandidateLogin.css";

const CandidateLogin = ({ setIsLoggedIn }) => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Logging in:", credentials);

    // Updated API endpoint to match route file
    await fetch("http://localhost:3300/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    setIsLoggedIn(true);
    navigate("/candidates");
  };

  return (
    <div className="auth-container">
      <h2>Candidate Login</h2>
      <form className="auth-form" onSubmit={handleLogin}>
        <input
          name="email"
          placeholder="Email"
          value={credentials.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={credentials.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Login</button>
      </form>

      <p className="auth-footer">
        Don't have an account? <Link to="/register">Register</Link>
      </p>
      <p className="auth-footer">
        <Link to="/forgot-password">Forgot Password?</Link>
      </p>
    </div>
  );
};

export default CandidateLogin;