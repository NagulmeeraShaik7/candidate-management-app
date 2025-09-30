  import React, { useEffect, useState } from "react";
  import { useParams, useNavigate } from "react-router-dom";
  import { 
    getExamDetails, 
    submitExam, 
    validateAnswersBeforeSubmit,
    formatAnswersForSubmission,
    logProctoringEvent 
  } from "../../services/examService";
  import ProctoringMonitor from "../ProctoringMonitor/ProctoringMonitor";
  import "./ExamPage.css";

  const ExamPage = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [timer, setTimer] = useState(3600); // default 1 hour
    const [submitting, setSubmitting] = useState(false);
    const [showProctoring, setShowProctoring] = useState(true);
    const [violationCount, setViolationCount] = useState(0);
    const [disqualified, setDisqualified] = useState(false);
    const [showDisqualificationModal, setShowDisqualificationModal] = useState(false);
    const [redirectCountdown, setRedirectCountdown] = useState(5);

    // Fetch exam details
    useEffect(() => {
      const fetchExam = async () => {
        try {
          const data = await getExamDetails(examId);
          setExam(data);
          // Initialize answers with question indices as keys
          const initialAnswers = {};
          data.questions.forEach((q, index) => {
            initialAnswers[index] = q.type === "msq" ? [] : "";
          });
          setAnswers(initialAnswers);

          // Log exam start
          await logProctoringEvent({
            examId,
            candidateId: data.candidateId?._id || data.candidate?._id,
            activityType: 'CUSTOM',
            message: 'Exam started by candidate',
            severity: 'LOW',
            metadata: { 
              totalQuestions: data.questions.length,
              examStarted: true 
            }
          });

        } catch (err) {
          console.error(err);
          setError("Failed to load exam.");
        } finally {
          setLoading(false);
        }
      };
      fetchExam();
    }, [examId]);

    // Countdown timer
    useEffect(() => {
      if (disqualified) return; // Stop timer if disqualified
      
      const interval = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(interval);
            handleSubmit(); // auto-submit
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }, [disqualified]);

    // Redirect countdown for disqualification
    useEffect(() => {
      if (showDisqualificationModal && redirectCountdown > 0) {
        const countdownInterval = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              navigate('/exam-dashboard');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(countdownInterval);
      }
    }, [showDisqualificationModal, redirectCountdown, navigate]);

    const handleAnswerChange = async (questionIndex, value, type) => {
      if (disqualified) return; // Prevent answering if disqualified
      
      if (type === "msq") {
        const current = Array.isArray(answers[questionIndex]) ? [...answers[questionIndex]] : [];
        if (current.includes(value)) {
          current.splice(current.indexOf(value), 1);
        } else {
          current.push(value);
        }
        setAnswers((prev) => ({ ...prev, [questionIndex]: current }));
      } else {
        setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
      }

      // Log answer activity
      if (exam) {
        try {
          await logProctoringEvent({
            examId,
            candidateId: exam.candidateId?._id || exam.candidate?._id,
            activityType: 'CUSTOM',
            message: `Candidate answered question ${questionIndex + 1}`,
            severity: 'LOW',
            metadata: { 
              questionIndex,
              answerLength: typeof value === 'string' ? value.length : value.length,
              type 
            }
          });
        } catch (error) {
          console.error('Failed to log answer activity:', error);
        }
      }
    };

    const handleViolation = async (violation) => {
      setViolationCount(prev => prev + 1);
    };

    // In ExamPage.jsx, update the handleDisqualify function:
  const handleDisqualify = async (totalViolations, totalWarnings) => {
    // Prevent multiple disqualifications
    if (disqualified) return;
    
    setDisqualified(true);
    setShowDisqualificationModal(true);
    
    // Auto-submit the exam with current answers
    try {
      const formattedAnswers = formatAnswersForSubmission(exam.questions, answers);
      await submitExam(examId, formattedAnswers);
    } catch (error) {
      console.error('Auto-submit failed:', error);
    }
    
    // Log disqualification
    if (exam) {
      try {
        await logProctoringEvent({
          examId,
          candidateId: exam.candidateId?._id || exam.candidate?._id,
          activityType: 'CHEATING_SUSPECTED',
          message: 'Candidate disqualified due to excessive proctoring violations',
          severity: 'HIGH',
          metadata: { 
            totalViolations,
            totalWarnings,
            disqualified: true,
            autoSubmitted: true,
            disqualificationReason: 'Exceeded maximum violation limit (40 violations)'
          }
        });
      } catch (error) {
        console.error('Failed to log disqualification:', error);
      }
    }
  };

    const handleImmediateRedirect = () => {
      navigate('/exam-dashboard');
    };

    const handleSubmit = async () => {
      if (disqualified) {
        navigate('/exam-dashboard');
        return;
      }
      
      try {
        setSubmitting(true);
        
        // Log submission attempt
        if (exam) {
          await logProctoringEvent({
            examId,
            candidateId: exam.candidateId?._id || exam.candidate?._id,
            activityType: 'CUSTOM',
            message: 'Candidate initiated exam submission',
            severity: 'LOW',
            metadata: { 
              answeredCount: getAnsweredCount(),
              totalQuestions: exam.questions.length,
              violationCount 
            }
          });
        }

        // Validate answers before submission
        if (!validateAnswersBeforeSubmit(answers, exam.questions)) {
          alert("Please answer all questions before submitting.");
          return;
        }

        // Format answers for backend
        const formattedAnswers = formatAnswersForSubmission(exam.questions, answers);
        
        console.log("🎯 Submitting formatted answers:", formattedAnswers);
        
        await submitExam(examId, formattedAnswers);
        
        // Log successful submission
        if (exam) {
          await logProctoringEvent({
            examId,
            candidateId: exam.candidateId?._id || exam.candidate?._id,
            activityType: 'CUSTOM',
            message: 'Exam submitted successfully',
            severity: 'LOW',
            metadata: { 
              submittedAt: new Date().toISOString(),
              finalScore: 'pending'
            }
          });
        }
        
        navigate(`/exam/${examId}/result`);
        
      } catch (err) {
        console.error("Submission error:", err);
        
        // Log submission failure
        if (exam) {
          await logProctoringEvent({
            examId,
            candidateId: exam.candidateId?._id || exam.candidate?._id,
            activityType: 'CUSTOM',
            message: 'Exam submission failed',
            severity: 'MEDIUM',
            metadata: { 
              error: err.message,
              attemptedAt: new Date().toISOString()
            }
          });
        }
        
        alert(`Failed to submit exam: ${err.message}`);
      } finally {
        setSubmitting(false);
      }
    };

    const formatTime = (t) => {
      const m = Math.floor(t / 60);
      const s = t % 60;
      return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const getAnsweredCount = () => {
      return Object.values(answers).filter(answer => 
        Array.isArray(answer) ? answer.length > 0 : answer !== ""
      ).length;
    };

    const getQuestionTypeLabel = (type) => {
      const types = {
        mcq: "Multiple Choice",
        msq: "Multiple Select",
        short: "Short Answer",
        descriptive: "Descriptive"
      };
      return types[type] || type;
    };

    if (loading) return (
      <div className="exam-loading">
        <div className="loading-spinner"></div>
        <div>Loading Exam...</div>
      </div>
    );
    
    if (error) return <div className="exam-error">{error}</div>;
    if (!exam) return <div className="exam-error">Exam not found</div>;

    const answeredCount = getAnsweredCount();
    const totalQuestions = exam.questions.length;
    const progressPercentage = (answeredCount / totalQuestions) * 100;
    const candidateId = exam.candidateId?._id || exam.candidate?._id;

    return (
      <div className="exam-container">
        {/* Disqualification Modal */}
        {showDisqualificationModal && (
          <div className="disqualification-modal-overlay">
            <div className="disqualification-modal">
              <div className="modal-header">
                <div className="modal-icon">
                  <i className="bi bi-shield-exclamation"></i>
                </div>
                <h2>Exam Disqualified</h2>
              </div>
              
              <div className="modal-content">
                <p className="disqualification-reason">
                  You have been disqualified from the exam due to multiple proctoring violations.
                </p>
                
                <div className="violation-details">
                  <div className="detail-item">
                    <span className="detail-label">Total Violations:</span>
                    <span className="detail-value">{violationCount}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Auto Disqualified:</span>
                    <span className="detail-value">After 5 warnings</span>
                  </div>
                </div>

                <div className="consequences">
                  <h4>Consequences:</h4>
                  <ul>
                    <li>Current exam attempt has been terminated</li>
                    <li>All answers submitted so far have been saved</li>
                    <li>You will need to wait before attempting again</li>
                    <li>Administrator has been notified</li>
                  </ul>
                </div>
              </div>

              <div className="modal-footer">
                <p className="redirect-countdown">
                  Redirecting to dashboard in <span className="countdown-number">{redirectCountdown}</span> seconds...
                </p>
                <button 
                  className="immediate-redirect-btn"
                  onClick={handleImmediateRedirect}
                >
                  <i className="bi bi-box-arrow-right"></i>
                  Go to Dashboard Now
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="exam-card">
          {/* Header */}
          <div className="exam-header">
            <h1 className="exam-title">{exam.title || "Technical Assessment"}</h1>
            <div className={`timer-container ${timer < 300 ? 'timer-low' : ''}`}>
              <i className="bi bi-clock timer-icon"></i>
              <div className={`timer ${timer < 300 ? 'timer-warning' : ''}`}>
                {formatTime(timer)}
              </div>
            </div>
          </div>

          {/* Disqualification Banner (only show if disqualified but modal not showing) */}
          {disqualified && !showDisqualificationModal && (
            <div className="disqualification-banner">
              <i className="bi bi-shield-exclamation"></i>
              <div className="disqualification-content">
                <h4>Exam Disqualified</h4>
                <p>You have been disqualified due to multiple proctoring violations.</p>
              </div>
            </div>
          )}

          {/* Proctoring Monitor */}
          {showProctoring && candidateId && !disqualified && (
            <ProctoringMonitor 
              examId={examId}
              candidateId={candidateId}
              onViolation={handleViolation}
              onDisqualify={handleDisqualify}
            />
          )}

          {/* Exam Info */}
          <div className="exam-info">
            <div className="info-item">
              <i className="bi bi-person info-icon"></i>
              <span>Candidate: <span className="info-value">{exam.candidateId?.name || exam.candidate?.name || "-"}</span></span>
            </div>
            <div className="info-item">
              <i className="bi bi-file-text info-icon"></i>
              <span>Questions: <span className="info-value">{totalQuestions}</span></span>
            </div>
            <div className="info-item">
              <i className="bi bi-check-circle info-icon"></i>
              <span>Answered: <span className="info-value">{answeredCount}/{totalQuestions}</span></span>
            </div>
            <div className="info-item">
              <i className="bi bi-shield-exclamation info-icon"></i>
              <span>Violations: <span className="info-value">{violationCount}</span></span>
            </div>
            <div className="info-item">
              <i className="bi bi-award info-icon"></i>
              <span>Passing Score: <span className="info-value">70%</span></span>
            </div>
          </div>

          {/* Progress Bar */}
          {!disqualified && (
            <div className="exam-progress">
              <div className="progress-text">
                <span>Exam Progress</span>
                <span>{Math.round(progressPercentage)}% Complete</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Questions */}
          {!disqualified && (
            <div className="exam-questions">
              {exam.questions.map((q, index) => (
                <div key={q._id} className="question-card">
                  <div className="question-header">
                    <div className="question-number">{index + 1}</div>
                    <p className="question-text">{q.question}</p>
                    <span className="question-type">{getQuestionTypeLabel(q.type)}</span>
                  </div>

                  {q.type === "mcq" && q.options && q.options.length > 0 && (
                    <div className="options">
                      {q.options.map((opt, i) => (
                        <label key={i} className="option-label">
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={opt}
                            checked={answers[index] === opt}
                            onChange={() => handleAnswerChange(index, opt, q.type)}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "msq" && q.options && q.options.length > 0 && (
                    <div className="options">
                      {q.options.map((opt, i) => (
                        <label key={i} className="option-label">
                          <input
                            type="checkbox"
                            value={opt}
                            checked={answers[index]?.includes(opt)}
                            onChange={() => handleAnswerChange(index, opt, q.type)}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {(q.type === "short" || q.type === "descriptive") && (
                    <textarea
                      className="answer-textarea"
                      placeholder="Type your answer here..."
                      value={answers[index] || ""}
                      onChange={(e) => handleAnswerChange(index, e.target.value, q.type)}
                      rows={4}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="exam-footer">
            {disqualified ? (
              <button 
                className="submit-exam-btn disqualified" 
                onClick={() => navigate('/exam-dashboard')}
              >
                <i className="bi bi-box-arrow-right"></i>
                Return to Dashboard
              </button>
            ) : (
              <button 
                className="submit-exam-btn" 
                onClick={handleSubmit}
                disabled={submitting}
              >
                <i className="bi bi-send-check"></i>
                {submitting ? "Submitting..." : "Submit Examination"}
              </button>
            )}
            
            <p style={{ marginTop: '15px', color: '#64748b', fontSize: '14px' }}>
              {disqualified ? (
                <span style={{ color: '#dc3545' }}>
                  🚫 Exam disqualified due to proctoring violations
                </span>
              ) : answeredCount === totalQuestions ? (
                "All questions answered. Ready to submit!"
              ) : (
                `You have answered ${answeredCount} out of ${totalQuestions} questions`
              )}
              {violationCount > 0 && !disqualified && (
                <span style={{ color: '#dc3545', marginLeft: '10px' }}>
                  ⚠️ {violationCount} proctoring violation(s) recorded
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };

  export default ExamPage;