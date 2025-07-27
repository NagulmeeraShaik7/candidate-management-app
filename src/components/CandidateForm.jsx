import React, { useState, useEffect } from "react";
import "./CandidateForm.css";

const phonePattern = /^\+\d{1,3}-\d{10}$/;

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Live validation for phone
    if (name === "phone") {
      if (!value) {
        setFormErrors((prev) => ({ ...prev, phone: "Phone is required" }));
      } else if (!phonePattern.test(value)) {
        setFormErrors((prev) => ({ ...prev, phone: "Phone must be in the format +<country_code>-<10_digits> (e.g. +91-9848012345)" }));
      } else {
        setFormErrors((prev) => ({ ...prev, phone: "" }));
      }
    } else {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      if (!value) {
        setFormErrors((prev) => ({ ...prev, phone: "Phone is required" }));
      } else if (!phonePattern.test(value)) {
        setFormErrors((prev) => ({ ...prev, phone: "Phone must be in the format (e.g. +91-9848012345)" }));
      } else {
        setFormErrors((prev) => ({ ...prev, phone: "" }));
      }
    }
  };

  // Skills input handling
  const handleSkillsChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, skillsInput: value }));
    setFormErrors((prev) => ({ ...prev, skills: "" }));
  };
  const handleSkillsBlur = () => {
    const skillsArr = form.skillsInput.split(",").map(s => s.trim()).filter(Boolean);
    setForm((prev) => ({ ...prev, skills: skillsArr }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitError("");
    // Basic required check for UX
    if (!form.name || !form.phone || !form.email) {
      setFormErrors({
        name: !form.name ? "Name is required" : undefined,
        phone: !form.phone ? "Phone is required" : undefined,
        email: !form.email ? "Email is required" : undefined,
      });
      return;
    }
    try {
      let response;
      const payload = {
        ...form,
        skills: form.skillsInput.split(",").map(s => s.trim()).filter(Boolean),
      };
      if (candidate && (candidate._id || candidate.id)) {
        // Edit mode
        const id = candidate._id || candidate.id;
        response = await fetch(`https://candidate-management-app-backend.onrender.com/api/candidates/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Add mode
        response = await fetch("https://candidate-management-app-backend.onrender.com/api/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (!response.ok) {
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
      setSubmitError("Network error: " + error.message);
    }
  };

  return (
    <form className="candidate-form" style={{ fontFamily: 'Poppins, Arial, sans-serif' }} onSubmit={handleSubmit}>
      <h2 className="candidate-form-title" style={candidate ? { color: '#2563eb' } : {}}>
        <i className={candidate ? "bi bi-pencil-square" : "bi bi-person-plus-fill"} style={{ color: candidate ? '#2563eb' : '#0e7490' }}></i>
        {candidate ? 'Edit Candidate' : 'Add Candidate'}
      </h2>

      <div className="input-group">
        <i className="bi bi-person input-icon"></i>
        <input name="name" onChange={handleChange} placeholder="Name" />
      </div>
      {formErrors.name && <div className="form-error">{formErrors.name}</div>}

      <div className="input-group">
        <i className="bi bi-telephone input-icon"></i>
        <input
          name="phone"
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Phone (e.g. +91-9848012345)"
          className={formErrors.phone ? "input-error" : ""}
        />
      </div>
      {formErrors.phone && <div className="form-error">{formErrors.phone}</div>}

      <div className="input-group">
        <i className="bi bi-book input-icon"></i>
        <input name="highestqualification" onChange={handleChange} placeholder="Highest Qualification" />
      </div>
      {formErrors.highestqualification && <div className="form-error">{formErrors.highestqualification}</div>}

      <div className="input-group">
        <i className="bi bi-envelope input-icon"></i>
        <input
          name="email"
          onChange={handleChange}
          placeholder="Email"
          value={form.email}
          disabled={!!candidate}
          style={candidate ? { background: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' } : {}}
        />
      </div>
      {formErrors.email && <div className="form-error">{formErrors.email}</div>}

      <div className="input-group">
        <i className="bi bi-gender-ambiguous input-icon"></i>
        <select name="gender" onChange={handleChange} value={form.gender}>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
      </div>
      {formErrors.gender && <div className="form-error">{formErrors.gender}</div>}

      <div className="input-group">
        <i className="bi bi-briefcase input-icon"></i>
        <input
          name="experience"
          type="number"
          min="1"
          max="30"
          onChange={handleChange}
          placeholder="Experience (years)"
        />
      </div>
      {formErrors.experience && <div className="form-error">{formErrors.experience}</div>}

      <div className="input-group">
        <i className="bi bi-lightbulb input-icon"></i>
        <input
          name="skills"
          placeholder="e.g. HTML, CSS, JavaScript..."
          value={form.skillsInput}
          onChange={handleSkillsChange}
          onBlur={handleSkillsBlur}
        />
      </div>
      {formErrors.skills && <div className="form-error">{formErrors.skills}</div>}

      {submitError && <div className="form-error">{submitError}</div>}

      <div className="form-actions">
        <button type="submit" className="save-btn">Save</button>
        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
};

export default CandidateForm;
