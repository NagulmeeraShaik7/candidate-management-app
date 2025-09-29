import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaCheckCircle, FaExclamationCircle, FaUser } from "react-icons/fa";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: ""
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://candidate-management-app-backend.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password.trim(),
            role: formData.role.trim()
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || "Login failed");
        setSuccess("");
        setLoading(false);
        return;
      }

      const token = data.data?.token || data.token;
      if (!token) {
        setError("Token not found in response");
        setSuccess("");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", token);
      
      // Decode token to get user role
      let userRole = "user"; // Default role
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userRole = payload.role || formData.role || "user";
        console.log("User role from token:", userRole);
      } catch (err) {
        console.error("Error decoding token:", err);
        // If can't decode token, use the role from form
        userRole = formData.role || "user";
      }

      setSuccess("Login successful! Redirecting...");
      
      // Redirect based on role
      setTimeout(() => {
        if (userRole === "admin") {
          navigate("/"); // Admin dashboard
        } else {
          navigate("/exam-dashboard"); // Candidate exam dashboard
        }
      }, 1500);
      
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRedirect = () => {
    navigate("/register");
  };

  return (
    <div className="login-container">
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

      <div className="login-content">
        {/* Main Container */}
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="icon-container">
              <FaLock className="header-icon" />
            </div>
            <h2 className="login-title">Sign In</h2>
            <p className="login-subtitle">Welcome back, please log in</p>
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
          <form onSubmit={handleLogin} className="login-form">
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
                    placeholder="Password"
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

            {/* Role Input */}
            <div className="form-group">
              <div className={`input-container ${focusedField === 'role' || formData.role ? 'active' : ''}`}>
                <div className="input-glow"></div>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    onFocus={() => setFocusedField('role')}
                    onBlur={() => setFocusedField('')}
                    required
                    className="form-input"
                  >
                    <option className="form-option" value="">Select Role</option>
                    <option className="form-option" value="admin">Admin</option>
                    <option className="form-option" value="user">candidate</option>
                  </select>
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
                    <div className="loading-spinner-login"></div>
                    <span>Logging In...</span>
                  </>
                ) : (
                  <>
                    <FaLock className="btn-icon" />
                    <span>Sign In</span>
                  </>
                )}
              </div>
              <div className="btn-gradient"></div>
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p className="footer-text">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={handleRegisterRedirect}
                className="register-link"
              >
                Register here
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

export default Login;