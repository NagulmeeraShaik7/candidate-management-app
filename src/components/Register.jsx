import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import "./Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://candidate-management-app-backend.onrender.com/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password.trim(),
            name: formData.name.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || "Registration failed");
        setSuccess("");
        setLoading(false);
        return;
      }

      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  return (
    <div className="register-container">
      {/* Animated Background Elements */}
      <div className="background-overlay">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
      </div>

      {/* Floating Particles */}
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

      <div className="register-content">
        {/* Main Container */}
        <div className="register-card">
          {/* Header */}
          <div className="register-header">
            <div className="icon-container">
              <FaUser className="header-icon" />
            </div>
            <h2 className="register-title">Create Account</h2>
            <p className="register-subtitle">Join us and start your journey</p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="alert alert-error">
              <FaExclamationCircle className="alert-icon" />
              <span className="alert-text">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="alert alert-success">
              <FaCheckCircle className="alert-icon" />
              <span className="alert-text">{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="register-form">
            {/* Name Input */}
            <div className="form-group">
              <div className={`input-container ${focusedField === 'name' || formData.name ? 'active' : ''}`}>
                <div className="input-glow"></div>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField('')}
                    required
                    className="form-input"
                    placeholder="Full Name"
                  />
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div className="form-group">
              <div className={`input-container ${focusedField === 'email' || formData.email ? 'active' : ''}`}>
                <div className="input-glow"></div>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                    required
                    className="form-input"
                    placeholder="Email Address"
                  />
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group">
              <div className={`input-container ${focusedField === 'password' || formData.password ? 'active' : ''}`}>
                <div className="input-glow"></div>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    required
                    minLength={6}
                    className="form-input password-field"
                    placeholder="Password (min 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
            >
              <div className="btn-content">
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <FaUser className="btn-icon" />
                    <span>Create Account</span>
                  </>
                )}
              </div>
              <div className="btn-gradient"></div>
            </button>
          </form>

          {/* Footer */}
          <div className="register-footer">
            <p className="footer-text">
              Already have an account?{" "}
              <button
                type="button"
                onClick={handleLoginRedirect}
                className="login-link"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>

        {/* Bottom Decorative Elements */}
        <div className="decorative-dots">
          <div className="dot dot-1"></div>
          <div className="dot dot-2"></div>
          <div className="dot dot-3"></div>
        </div>
      </div>
    </div>
  );
};

export default Register;