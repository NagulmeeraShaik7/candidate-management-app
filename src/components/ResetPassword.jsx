import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./CandidateLogin.css";

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    console.log("Resetting password with token:", token);

    // Updated API endpoint to match route file
    await fetch(`http://localhost:3300/api/auth/reset-password/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setMessage("Password has been reset (mock response).");
  };

  return (
    <div className="auth-container">
      <h2>Reset Password</h2>
      <form className="auth-form" onSubmit={handleReset}>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Reset Password</button>
      </form>
      {message && <p style={{ textAlign: "center", color: "green" }}>{message}</p>}
      <p className="auth-footer">
        <Link to="/login">Back to Login</Link>
      </p>
    </div>
  );
};

export default ResetPassword;