import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // 👁 icons
import "./Register.css";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");
  try {
    const response = await fetch("https://candidate-management-app-backend.onrender.com/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Registration failed");
      setSuccess("");
      return;
    }

    setSuccess("✅ Registration successful! Redirecting to login...");
    setTimeout(() => navigate("/login"), 1500); // small delay to show success
  } catch (err) {
    setError("Something went wrong. Please try again.");
    setSuccess("");
  }
};


  return (
    <div className="auth-container">
      <div>
        <h2>Register</h2>
         {error && <div className="alert alert-error">⚠️ {error}</div>}
         {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleRegister} className="auth-form">
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="input-wrapper">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <button type="submit">Register</button>
        </form>
        <p>
          Already registered?{" "}
          <span className="link" onClick={() => navigate("/login")}>
            Login here
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;
