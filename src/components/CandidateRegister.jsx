import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CandidateLogin.css";

const CandidateRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    console.log("Registering candidate:", formData);

    // Updated API endpoint to match route file
    await fetch("http://localhost:3300/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      }),
    });

    navigate("/login");
  };

  return (
    <div className="auth-container">
      <h2>Candidate Register</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Verify Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
        <button type="submit">Register</button>
      </form>

      <p className="auth-footer">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default CandidateRegister;