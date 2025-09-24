import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CandidateForm.css";

const phonePattern = /^\+\d{1,3}[-\s]?\d{10}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CandidateForm = ({ onClose, onSaved, candidate }) => {
  const [form, setForm] = useState({
    name: candidate?.name || "",
    phone: candidate?.phone || "",
    highestqualification: candidate?.highestqualification || "",
    email: candidate?.email || "",
    gender: candidate?.gender || "Male",
    experience: candidate?.experience || "1",
    skills: candidate?.skills || [],
    skillsInput: candidate?.skills ? candidate.skills.join(", ") : "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (candidate) {
      setForm({
        name: candidate.name || "",
        phone: candidate.phone || "",
        highestqualification: candidate.highestqualification || "",
        email: candidate.email || "",
        gender: candidate.gender || "Male",
        experience: candidate.experience || "1",
        skills: candidate.skills || [],
        skillsInput: candidate.skills ? candidate.skills.join(", ") : "",
      });
    } else {
      setForm({
        name: "",
        phone: "",
        highestqualification: "",
        email: "",
        gender: "Male",
        experience: "1",
        skills: [],
        skillsInput: "",
      });
    }
  }, [candidate]);

  const validateField = (name, value) => {
    let error = "";
    
    switch (name) {
      case "name":
        if (!value.trim()) error = "Name is required";
        else if (value.trim().length < 2) error = "Name must be at least 2 characters";
        break;
      case "phone":
        if (!value) error = "Phone is required";
        else if (!phonePattern.test(value)) {
          error = "Phone must be in the format  (e.g. +91-9848012345 or +91 9848012345)";
        }
        break;
      case "email":
        if (!value) error = "Email is required";
        else if (!emailPattern.test(value)) error = "Please enter a valid email address";
        break;
      case "highestqualification":
        if (!value.trim()) error = "Highest qualification is required";
        break;
      case "skillsInput":
        const skillsArr = value.split(",").map(s => s.trim()).filter(Boolean);
        if (skillsArr.length === 0) error = "At least one skill is required";
        break;
      default:
        break;
    }
    
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Live validation
    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSkillsBlur = () => {
    const skillsArr = form.skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setForm((prev) => ({ ...prev, skills: skillsArr }));
    
    const error = validateField("skillsInput", form.skillsInput);
    setFormErrors((prev) => ({ ...prev, skillsInput: error }));
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate all required fields
    errors.name = validateField("name", form.name);
    errors.phone = validateField("phone", form.phone);
    errors.email = validateField("email", form.email);
    errors.highestqualification = validateField("highestqualification", form.highestqualification);
    errors.skillsInput = validateField("skillsInput", form.skillsInput);
    
    // Filter out empty error messages
    const filteredErrors = Object.fromEntries(
      Object.entries(errors).filter(([_, value]) => value !== "")
    );
    
    setFormErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(formErrors)[0];
      if (firstErrorField) {
        document.querySelector(`[name="${firstErrorField}"]`)?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
      return;
    }

    setIsSubmitting(true);
    
    try {
      let response;
      const payload = {
        name: form.name.trim(),
        phone: form.phone,
        highestqualification: form.highestqualification.trim(),
        email: form.email,
        gender: form.gender,
        experience: form.experience,
        skills: form.skillsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const token = localStorage.getItem("token");

      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      if (candidate && (candidate._id || candidate.id)) {
        // Edit mode
        const id = candidate._id || candidate.id;
        response = await fetch(
          `https://candidate-management-app-backend.onrender.com/api/candidates/${id}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify(payload),
          }
        );
      } else {
        // Add mode
        response = await fetch(
          "https://candidate-management-app-backend.onrender.com/api/candidates",
          {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          }
        );
      }

      if (!response.ok) {
        if ([400, 404, 500].includes(response.status)) {
          return navigate(`/error/${response.status}`);
        }
        const err = await response.json();
        setSubmitError(err.error || "Failed to save candidate");
        if (err.errors) setFormErrors(err.errors);
      } else {
        if (onSaved) {
          onSaved();
        } else {
          onClose();
        }
      }
    } catch (error) {
      setSubmitError("Network error. Please check your connection and try again.");
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="candidate-form"
      style={{ fontFamily: "Poppins, Arial, sans-serif" }}
      onSubmit={handleSubmit}
      noValidate
    >
      <h2
        className="candidate-form-title"
        style={candidate ? { color: "#2563eb" } : {}}
      >
        <i
          className={
            candidate ? "bi bi-pencil-square" : "bi bi-person-plus-fill"
          }
          style={{ color: candidate ? "#2563eb" : "#0e7490", marginRight: "8px" }}
        ></i>
        {candidate ? "Edit Candidate" : "Add Candidate"}
      </h2>

      <div className="input-group">
        <i className="bi bi-person input-icon"></i>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Full Name *"
          className={formErrors.name ? "input-error" : ""}
          aria-describedby={formErrors.name ? "name-error" : undefined}
        />
      </div>
      {formErrors.name && (
        <div id="name-error" className="form-error">
          <i className="bi bi-exclamation-circle"></i> {formErrors.name}
        </div>
      )}

      <div className="input-group">
        <i className="bi bi-telephone input-icon"></i>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Phone (e.g. +91-9848012345) *"
          className={formErrors.phone ? "input-error" : ""}
          aria-describedby={formErrors.phone ? "phone-error" : undefined}
        />
      </div>
      {formErrors.phone && (
        <div id="phone-error" className="form-error">
          <i className="bi bi-exclamation-circle"></i> {formErrors.phone}
        </div>
      )}

      <div className="input-group">
        <i className="bi bi-book input-icon"></i>
        <input
          name="highestqualification"
          value={form.highestqualification}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Highest Qualification *"
          className={formErrors.highestqualification ? "input-error" : ""}
          aria-describedby={formErrors.highestqualification ? "qualification-error" : undefined}
        />
      </div>
      {formErrors.highestqualification && (
        <div id="qualification-error" className="form-error">
          <i className="bi bi-exclamation-circle"></i> {formErrors.highestqualification}
        </div>
      )}

      <div className="input-group">
        <i className="bi bi-envelope input-icon"></i>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Email *"
          className={formErrors.email ? "input-error" : ""}
          disabled={!!candidate}
          aria-describedby={formErrors.email ? "email-error" : undefined}
          style={
            candidate
              ? {
                  background: "#f3f4f6",
                  color: "#9ca3af",
                  cursor: "not-allowed",
                }
              : {}
          }
        />
      </div>
      {formErrors.email && (
        <div id="email-error" className="form-error">
          <i className="bi bi-exclamation-circle"></i> {formErrors.email}
        </div>
      )}

      <div className="input-group">
        <i className="bi bi-gender-ambiguous input-icon"></i>
        <select 
          name="gender" 
          value={form.gender} 
          onChange={handleChange}
          aria-describedby={formErrors.gender ? "gender-error" : undefined}
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>
      {formErrors.gender && (
        <div id="gender-error" className="form-error">
          <i className="bi bi-exclamation-circle"></i> {formErrors.gender}
        </div>
      )}

      <div className="input-group">
        <i className="bi bi-briefcase input-icon"></i>
        <input
          name="experience"
          type="number"
          min="1"
          max="30"
          value={form.experience}
          onChange={handleChange}
          placeholder="Experience (years)"
          aria-describedby={formErrors.experience ? "experience-error" : undefined}
        />
      </div>
      {formErrors.experience && (
        <div id="experience-error" className="form-error">
          <i className="bi bi-exclamation-circle"></i> {formErrors.experience}
        </div>
      )}

      <div className="input-group">
        <i className="bi bi-lightbulb input-icon"></i>
        <input
          name="skillsInput"
          placeholder="Skills (comma separated) * e.g. HTML, CSS, JavaScript..."
          value={form.skillsInput}
          onChange={handleChange}
          onBlur={handleSkillsBlur}
          className={formErrors.skillsInput ? "input-error" : ""}
          aria-describedby={formErrors.skillsInput ? "skills-error" : undefined}
        />
      </div>
      {formErrors.skillsInput && (
        <div id="skills-error" className="form-error">
          <i className="bi bi-exclamation-circle"></i> {formErrors.skillsInput}
        </div>
      )}

      {submitError && (
        <div className="form-error submit-error">
          <i className="bi bi-exclamation-triangle"></i> {submitError}
        </div>
      )}

      <div className="form-actions">
        <button 
          type="submit" 
          className="save-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <i className="bi bi-arrow-repeat spinning"></i> Saving...
            </>
          ) : (
            <>
              <i className="bi bi-check-lg"></i> Save
            </>
          )}
        </button>
        <button 
          type="button" 
          className="cancel-btn" 
          onClick={onClose}
          disabled={isSubmitting}
        >
          <i className="bi bi-x-lg"></i> Cancel
        </button>
      </div>
    </form>
  );
};

export default CandidateForm;