import React from "react";
import "./ExamModal.css";

const ExamModal = ({ show, candidate, loading, onStart, onClose }) => {
  if (!show) return null;

  const instructions = [
    {
      icon: "bi bi-clock",
      text: "30 minutes time limit for the entire examination"
    },
    {
      icon: "bi bi-list-ol",
      text: "20 multiple choice questions to complete"
    },
    {
      icon: "bi bi-laptop",
      text: "Questions based on candidate's technical skills"
    },
    {
      icon: "bi bi-graph-up",
      text: "Minimum 70% score required to pass the exam"
    },
    {
      icon: "bi bi-arrow-right",
      text: "Linear navigation - cannot return to previous questions"
    },
    {
      icon: "bi bi-check-circle",
      text: "Auto-save functionality ensures no progress loss"
    }
  ];

  return (
    <div className="exam-modal-overlay" onClick={onClose}>
      <div className="exam-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="exam-modal-header">
          <div className="exam-icon-container">
            <i className="bi bi-file-earmark-medical exam-icon"></i>
          </div>
          <div className="exam-modal-header-content">
            <h2>Technical Assessment</h2>
            <p className="exam-modal-subtitle">Ready to begin the examination</p>
          </div>
          <button className="exam-close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="exam-modal-body">
          {/* Candidate Info */}
          <div className="candidate-card">
            <div className="candidate-info-grid">
              <div className="info-group">
                <span className="info-label">Candidate</span>
                <span className="info-value">{candidate?.name}</span>
              </div>
              <div className="info-group">
                <span className="info-label">Email</span>
                <span className="info-value">{candidate?.email}</span>
              </div>
              <div className="info-group">
                <span className="info-label">Experience</span>
                <span className="info-value">{candidate?.experience} years</span>
              </div>
              <div className="info-group">
                <span className="info-label">Skills</span>
                <span className="info-value">{candidate?.skills?.slice(0, 3).join(", ")}</span>
              </div>
            </div>
          </div>

          {/* Exam Content */}
          <div className="exam-content">
            {/* Status Indicator */}
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span className="status-text">System Ready - All checks passed</span>
            </div>

            {/* Instructions */}
            <h3 className="section-title">
              <i className="bi bi-info-circle"></i>
              Examination Guidelines
            </h3>
            
            <div className="instructions-list">
              {instructions.map((instruction, index) => (
                <div key={index} className="instruction-item">
                  <div className="instruction-icon">
                    <i className={instruction.icon}></i>
                  </div>
                  <span className="instruction-text">{instruction.text}</span>
                </div>
              ))}
            </div>

            {/* Ready Section */}
            <div className="ready-section">
              <div className="ready-icon">
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <p className="ready-text">All systems ready. Begin when you're prepared.</p>
            </div>
          </div>
        </div>

        {/* Footer - Now clearly visible at the bottom */}
        <div className="exam-modal-footer">
          <button 
            className="exam-cancel-btn" 
            onClick={onClose}
            disabled={loading}
          >
            <i className="bi bi-arrow-left"></i>
            Cancel
          </button>
          <button 
            className="exam-start-btn" 
            onClick={onStart}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="bi bi-hourglass-split"></i>
                Initializing...
              </>
            ) : (
              <>
                <i className="bi bi-play-fill"></i>
                Start Assessment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamModal;