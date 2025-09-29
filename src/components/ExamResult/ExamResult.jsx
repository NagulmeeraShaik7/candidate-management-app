import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getExamDetails, getExamResult } from "../../services/examService";
import "./ExamResult.css";

const ExamResult = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const resultData = await getExamResult(examId);
        console.log("Raw result data:", resultData);

        const candidateDetails = await getExamDetails(examId);
        console.log("Candidate details:", candidateDetails);

        const submittedAnswers = resultData.answers || {};
        const questions = candidateDetails.questions || [];

        const answersArray = questions.map((q, index) => {
          const indexKey = index.toString();
          let userAnswer = submittedAnswers[indexKey] ?? submittedAnswers[q._id] ?? "Not answered";

          let status = "neutral";
          let isCorrect = false;

          if (q.type === "short" || q.type === "descriptive") {
            status = "neutral";
          } else if (q.type === "mcq") {
            const normalizedUser = normalizeAnswer(userAnswer);
            const normalizedCorrect = normalizeAnswer(q.correctAnswer);
            isCorrect = normalizedUser === normalizedCorrect;
            status = isCorrect ? "correct" : "incorrect";
          } else if (q.type === "msq") {
            const userArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer].filter(Boolean);
            const correctArray = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];

            const userSet = new Set(userArray.map(normalizeAnswer));
            const correctSet = new Set(correctArray.map(normalizeAnswer));

            isCorrect = userSet.size === correctSet.size && [...userSet].every(a => correctSet.has(a));
            status = isCorrect ? "correct" : "incorrect";
          }

          return {
            question: q.question,
            correctAnswer: q.correctAnswer,
            userAnswer: userAnswer,
            type: q.type,
            status: status,
            isCorrect: isCorrect,
            questionNumber: index + 1,
            options: q.options || []
          };
        });

        const correctAnswers = answersArray.filter(a => a.isCorrect).length;
        const totalQuestions = answersArray.length;
        const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

        setResult({
          candidate: {
            name:
              candidateDetails.candidateId?.name ||
              candidateDetails.candidate?.name ||
              candidateDetails.candidateName ||
              "Unknown Candidate"
          },
          totalQuestions,
          correctAnswers,
          score,
          answers: answersArray,
          passed: score >= 70,
          percentage: resultData.percentage || score,
          qualified: resultData.qualified || score >= 70,
          submittedAt: resultData.submittedAt,
          gradedAt: resultData.gradedAt
        });
      } catch (err) {
        console.error("Error fetching result:", err);
        setError(err.message || "Failed to load exam result.");
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [examId]);

  const normalizeAnswer = (answer) => {
    if (answer === null || answer === undefined) return "";
    if (Array.isArray(answer)) {
      return answer.map(item => item?.toString().toLowerCase().trim()).filter(Boolean);
    }
    return answer.toString().toLowerCase().trim();
  };

  const getStatusBadge = (status) => {
    const badges = {
      correct: { class: "correct", text: "Correct", icon: "bi bi-check-circle" },
      incorrect: { class: "incorrect", text: "Incorrect", icon: "bi bi-x-circle" },
      neutral: { class: "neutral", text: "Review Needed", icon: "bi bi-clock" }
    };
    const badge = badges[status] || badges.neutral;
    return (
      <span className={`status-badge ${badge.class}`}>
        <i className={badge.icon}></i> {badge.text}
      </span>
    );
  };

  const getAnswerDisplay = (answer) => {
    if (answer === null || answer === undefined || answer === "") {
      return "Not answered";
    }
    if (Array.isArray(answer)) {
      return answer.length > 0 ? answer.join(", ") : "No answer selected";
    }
    return answer.toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  if (loading)
    return (
      <div className="result-loading">
        <div className="loading-spinner"></div>
        <div>Loading Results...</div>
      </div>
    );

  if (error)
    return (
      <div className="result-error">
        <i className="bi bi-exclamation-triangle"></i>
        {error}
        <button
          className="action-btn primary"
          onClick={() => navigate("/")}
          style={{ marginTop: "20px" }}
        >
          <i className="bi bi-house"></i>
          Back to Dashboard
        </button>
      </div>
    );

  if (!result)
    return (
      <div className="result-error">
        <i className="bi bi-file-earmark-x"></i>
        No result found for this exam
      </div>
    );

  return (
    <div className="exam-result-page">
      <div className="result-card">
        {/* Header */}
        <div className="result-header">
          <h1 className="result-title">Examination Results</h1>
          <p className="result-subtitle">Detailed performance analysis</p>
          <div className="result-meta">
            <span className="meta-item">
              <i className="bi bi-calendar"></i>
              Submitted: {formatDate(result.submittedAt)}
            </span>
            <span className="meta-item">
              <i className="bi bi-award"></i>
              Status: {result.qualified ? "Qualified" : "Not Qualified"}
            </span>
          </div>
        </div>

        {/* Score Overview */}
        <div className="score-overview">
          <div className="score-card">
            <div className="score-icon candidate">
              <i className="bi bi-person"></i>
            </div>
            <div className="score-value">{result.candidate?.name}</div>
            <div className="score-label">Candidate</div>
          </div>

          <div className="score-card">
            <div className="score-icon questions">
              <i className="bi bi-file-text"></i>
            </div>
            <div className="score-value">{result.totalQuestions}</div>
            <div className="score-label">Total Questions</div>
          </div>

          <div className="score-card">
            <div className="score-icon correct">
              <i className="bi bi-check-circle"></i>
            </div>
            <div className="score-value">{result.correctAnswers}</div>
            <div className="score-label">Correct Answers</div>
          </div>

          <div className="score-card">
            <div className="score-icon score">
              <i className="bi bi-award"></i>
            </div>
            <div className="score-value">{result.score}%</div>
            <div className="score-label">Final Score</div>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="performance-indicator">
          <h3 className="performance-title">
            <i className="bi bi-graph-up"></i>
            Performance Summary
          </h3>
          <div className="score-bar">
            <div
              className={`score-fill ${result.passed ? "pass" : "fail"}`}
              style={{ width: `${result.score}%` }}
            ></div>
            <div className="pass-mark"></div>
          </div>
          <div className="score-labels">
            <span>0%</span>
            <span>Passing Score: 70%</span>
            <span>100%</span>
          </div>
          <div className="qualification-status">
            <div
              className={`status-indicator ${result.qualified ? "qualified" : "not-qualified"}`}
            >
              <i className={`bi ${result.qualified ? "bi-check-circle" : "bi-x-circle"}`}></i>
              {result.qualified ? "Qualified for Next Round" : "Needs Improvement"}
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="results-details">
          <h3 className="details-title">
            <i className="bi bi-list-check"></i>
            Detailed Question Analysis
          </h3>

          <div className="questions-list">
            {result.answers.map((answer, index) => (
              <div key={index} className={`question-result-card ${answer.status}`}>
                <div className="question-header">
                  <div className="question-number">{answer.questionNumber}</div>
                  <div className="question-content">
                    <p className="question-text">{answer.question}</p>
                    <div className="question-type">
                      <span className="type-badge">{answer.type.toUpperCase()}</span>
                    </div>
                  </div>
                  {getStatusBadge(answer.status)}
                </div>

                <div className="answer-comparison">
                  <div className="answer-section your-answer">
                    <div className="answer-label">
                      <i className="bi bi-person-check"></i>
                      Your Answer
                    </div>
                    <div
                      className={`answer-value ${
                        answer.status === "correct"
                          ? "correct"
                          : answer.status === "incorrect"
                          ? "incorrect"
                          : ""
                      }`}
                    >
                      {getAnswerDisplay(answer.userAnswer, answer.type)}
                    </div>
                  </div>

                  {(answer.type === "mcq" || answer.type === "msq") && (
                    <div className="answer-section correct-answer">
                      <div className="answer-label">
                        <i className="bi bi-check-circle"></i>
                        Correct Answer
                      </div>
                      <div className="answer-value correct">
                        {getAnswerDisplay(answer.correctAnswer, answer.type)}
                      </div>
                    </div>
                  )}
                </div>

                {(answer.type === "mcq" || answer.type === "msq") &&
                  answer.options &&
                  answer.options.length > 0 && (
                    <div className="options-section">
                      <div className="answer-label">
                        <i className="bi bi-list-ul"></i>
                        Available Options
                      </div>
                      <div className="options-list">
                        {answer.options.map((option, optIndex) => (
                          <span
                            key={optIndex}
                            className={`option-tag ${
                              Array.isArray(answer.correctAnswer)
                                ? answer.correctAnswer.includes(option)
                                  ? "correct-option"
                                  : ""
                                : answer.correctAnswer === option
                                ? "correct-option"
                                : ""
                            } ${
                              Array.isArray(answer.userAnswer)
                                ? answer.userAnswer.includes(option)
                                  ? "user-selected"
                                  : ""
                                : answer.userAnswer === option
                                ? "user-selected"
                                : ""
                            }`}
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {(answer.type === "short" || answer.type === "descriptive") && (
                  <div className="review-notice">
                    <div className="answer-label">
                      <i className="bi bi-info-circle"></i>
                      Note
                    </div>
                    <div className="notice-text">
                      This {answer.type} answer requires manual review by an examiner.
                      {answer.status === "neutral" &&
                        " Your answer has been submitted for evaluation."}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="result-actions">
          <button className="action-btn-dashboard" onClick={() => navigate("/")}> 
            <i className="bi bi-house"></i>
            Back to Dashboard
          </button>
          <button className="action-btn-dashboard secondary" onClick={() => window.print()}>
            <i className="bi bi-printer"></i>
            Print Results
          </button>
          {result.qualified && (
            <button className="action-btn-dashboard success" onClick={() => navigate("/next-round")}>
              <i className="bi bi-arrow-right-circle"></i>
              Proceed to Next Round
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamResult;
