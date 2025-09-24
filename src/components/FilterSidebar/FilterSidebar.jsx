import React, { useState } from "react";
import "./FilterSidebar.css";

const FilterSidebar = ({ onClose, onFilter }) => {
  const [gender, setGender] = useState("");
  const [qualification, setQualification] = useState("");
  const [expMin, setExpMin] = useState("");
  const [expMax, setExpMax] = useState("");
  const [skills, setSkills] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (expMin && expMax && Number(expMin) > Number(expMax)) {
      errs.experience = "Min experience cannot be greater than max experience";
    }
    if (expMin && (Number(expMin) < 0 || Number(expMin) > 30)) {
      errs.experience = "Min experience must be between 0 and 30";
    }
    if (expMax && (Number(expMax) < 0 || Number(expMax) > 30)) {
      errs.experience = "Max experience must be between 0 and 30";
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onFilter && onFilter({
        gender,
        qualification,
        expMin,
        expMax,
        skills,
      });
      onClose && onClose();
    }
  };

  const handleClear = () => {
    setGender("");
    setQualification("");
    setExpMin("");
    setExpMax("");
    setSkills("");
    setErrors({});
    onFilter && onFilter({});
    onClose && onClose();
  };

  return (
    <form className="filter-sidebar" onSubmit={handleSubmit}>
      <div className="filter-sidebar-header">
        <h3
          className="filter-sidebar-title"
          style={{
            color: "#15803d",
            fontWeight: 600,
            fontSize: "1.1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            margin: 0,
          }}
        >
          <i className="bi bi-funnel-fill" style={{ color: "#15803d" }}></i>
          Filter
        </h3>
        <button
          type="button"
          className="filter-cancel-btn"
          onClick={onClose}
          title="Close"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <div className="filter-form-group">
        <label className="filter-label">
          <i className="bi bi-gender-ambiguous"></i> Gender
        </label>
        <select
          className="form-select gender-select"
          value={gender}
          onChange={e => setGender(e.target.value)}
        >
          <option value="">All</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="filter-form-group">
        <label className="filter-label">
          <i className="bi bi-mortarboard-fill"></i> Highest Qualification
        </label>
        <input
          type="text"
          className="form-control qualification-input"
          placeholder="e.g. Bachelor's, Diploma, etc."
          value={qualification}
          onChange={e => setQualification(e.target.value)}
        />
      </div>

      <div className="filter-form-group">
        <label className="filter-label">
          <i className="bi bi-briefcase-fill"></i> Experience
        </label>
        <div className="experience-inputs">
          <input
            type="number"
            placeholder="Min"
            className="form-control experience-input"
            value={expMin}
            onChange={e => setExpMin(e.target.value)}
            min={1}
            max={30}
          />
          <input
            type="number"
            placeholder="Max"
            className="form-control experience-input"
            value={expMax}
            onChange={e => setExpMax(e.target.value)}
            min={1}
            max={30}
          />
        </div>
        {errors.experience && <div className="form-error">{errors.experience}</div>}
      </div>

      <div className="filter-form-group">
        <label className="filter-label">
          <i className="bi bi-lightbulb-fill"></i> Skills
        </label>
        <input
          type="text"
          placeholder="e.g. HTML, CSS"
          className="form-control skills-input"
          value={skills}
          onChange={e => setSkills(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
        <button type="button" className="filter-cancel-btn" onClick={handleClear} style={{ minWidth: 80 }}>Clear</button>
        <button type="submit" className="filter-apply-btn">Apply</button>
      </div>
    </form>
  );
};

export default FilterSidebar;
