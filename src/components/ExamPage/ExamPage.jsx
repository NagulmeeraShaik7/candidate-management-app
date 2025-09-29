import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getExamDetails, 
  submitExam, 
  validateAnswersBeforeSubmit,
  formatAnswersForSubmission 
} from "../../services/examService";
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
  }, []);

  const handleAnswerChange = (questionIndex, value, type) => {
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
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Validate answers before submission
      if (!validateAnswersBeforeSubmit(answers, exam.questions)) {
        alert("Please answer all questions before submitting.");
        return;
      }

      // Format answers for backend
      const formattedAnswers = formatAnswersForSubmission(exam.questions, answers);
      
      console.log("🎯 Submitting formatted answers:", formattedAnswers);
      
      await submitExam(examId, formattedAnswers);
      navigate(`/exam/${examId}/result`);
      
    } catch (err) {
      console.error("Submission error:", err);
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

  return (
    <div className="exam-container">
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
            <i className="bi bi-award info-icon"></i>
            <span>Passing Score: <span className="info-value">70%</span></span>
          </div>
        </div>

        {/* Progress Bar */}
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

        {/* Questions */}
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

        {/* Footer */}
        <div className="exam-footer">
          <button 
            className="submit-exam-btn" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            <i className="bi bi-send-check"></i>
            {submitting ? "Submitting..." : "Submit Examination"}
          </button>
          <p style={{ marginTop: '15px', color: '#64748b', fontSize: '14px' }}>
            {answeredCount === totalQuestions ? 
              "All questions answered. Ready to submit!" : 
              `You have answered ${answeredCount} out of ${totalQuestions} questions`
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;