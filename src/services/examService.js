// src/services/examService.js
const API_BASE = "https://candidate-management-app-backend.onrender.com/api";

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.data || data;
};

// Existing exam functions...
export const getExamDetails = async (examId) => {
  try {
    console.log("📝 Fetching exam details for:", examId);
    const token = getToken();
    const res = await fetch(`${API_BASE}/exam/${examId}`, {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });
    
    const data = await handleResponse(res);
    console.log("✅ Exam details fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Failed to fetch exam details:", error);
    throw new Error(error.message || "Failed to fetch exam details");
  }
};

export const submitExam = async (examId, answers) => {
  try {
    console.log("🚀 Submitting exam:", examId);
    console.log("📤 Answers payload:", answers);

    // Validate answers format
    if (!answers || typeof answers !== 'object') {
      throw new Error('Answers must be provided as an object');
    }

    // Ensure all answers are properly formatted for backend
    const formattedAnswers = {};
    Object.keys(answers).forEach(key => {
      const answer = answers[key];
      if (answer === undefined || answer === null) {
        formattedAnswers[key] = ''; // Default empty string for undefined answers
      } else if (Array.isArray(answer) && answer.length === 0) {
        formattedAnswers[key] = []; // Empty array for MSQ
      } else {
        formattedAnswers[key] = answer;
      }
    });

    console.log("🎯 Formatted answers for submission:", formattedAnswers);

    const token = getToken();
    const payload = {
      answers: formattedAnswers
    };

    console.log("📦 Final payload:", payload);

    const res = await fetch(`${API_BASE}/exam/${examId}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await handleResponse(res);
    console.log("✅ Exam submitted successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Failed to submit exam:", error);
    throw new Error(error.message || "Failed to submit exam");
  }
};

export const getExamResult = async (examId) => {
  try {
    console.log("📊 Fetching exam result for:", examId);
    const token = getToken();
    const res = await fetch(`${API_BASE}/exam/${examId}/result`, {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });
    
    const data = await handleResponse(res);
    console.log("✅ Exam result fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Failed to fetch exam result:", error);
    throw new Error(error.message || "Failed to fetch exam result");
  }
};

// 🔐 PROCTORING APIs - Updated based on actual API structure
export const logProctoringEvent = async (examId, candidateId, activityType, message, severity, metadata = {}) => {
  try {
    console.log("📝 Logging proctoring event:", { 
      examId, 
      candidateId, 
      activityType, 
      message, 
      severity, 
      metadata 
    });
    
    const token = getToken();
    const payload = {
      examId,
      candidateId,
      activityType,
      message: message || `User performed ${activityType}`,
      severity: severity || "MEDIUM",
      metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata)
    };

    console.log("📦 Proctoring payload:", payload);

    const res = await fetch(`${API_BASE}/proctoring/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await handleResponse(res);
    console.log("✅ Proctoring event logged successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Failed to log proctoring event:", error);
    // Don't throw error for proctoring failures to avoid breaking exam flow
    return { success: false, error: error.message };
  }
};

// Predefined proctoring event types for consistency
export const ProctoringEvents = {
  TAB_SWITCH: {
    activityType: "INSPECT_WINDOW",
    message: "User switched tab/window",
    severity: "MEDIUM"
  },
  FULLSCREEN_EXIT: {
    activityType: "FULLSCREEN_EXIT",
    message: "User exited fullscreen mode",
    severity: "HIGH"
  },
  COPY_ATTEMPT: {
    activityType: "COPY_ATTEMPT",
    message: "User attempted to copy content",
    severity: "HIGH"
  },
  PASTE_ATTEMPT: {
    activityType: "PASTE_ATTEMPT",
    message: "User attempted to paste content",
    severity: "HIGH"
  },
  RIGHT_CLICK: {
    activityType: "RIGHT_CLICK",
    message: "User right-clicked on page",
    severity: "MEDIUM"
  },
  DEVTOOLS_OPEN: {
    activityType: "DEVTOOLS_OPEN",
    message: "User opened developer tools",
    severity: "HIGH"
  },
  FOCUS_LOST: {
    activityType: "FOCUS_LOST",
    message: "User switched to another application",
    severity: "MEDIUM"
  },
  MULTIPLE_PEOPLE: {
    activityType: "MULTIPLE_PEOPLE",
    message: "Multiple people detected",
    severity: "HIGH"
  },
  NO_FACE: {
    activityType: "NO_FACE",
    message: "No face detected",
    severity: "MEDIUM"
  },
  MULTIPLE_FACES: {
    activityType: "MULTIPLE_FACES",
    message: "Multiple faces detected",
    severity: "HIGH"
  },
  PHONE_USAGE: {
    activityType: "PHONE_USAGE",
    message: "Phone usage detected",
    severity: "HIGH"
  }
};

// Helper function for common proctoring events
export const logCommonProctoringEvent = (examId, candidateId, eventType, customMetadata = {}) => {
  const event = ProctoringEvents[eventType];
  if (!event) {
    console.error("❌ Unknown proctoring event type:", eventType);
    return;
  }

  return logProctoringEvent(
    examId,
    candidateId,
    event.activityType,
    event.message,
    event.severity,
    { ...customMetadata, timestamp: new Date().toISOString() }
  );
};

export const getProctoringLogs = async (examId) => {
  try {
    console.log("📊 Fetching proctoring logs for:", examId);
    const token = getToken();
    const res = await fetch(`${API_BASE}/proctoring/${examId}`, {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });
    
    const data = await handleResponse(res);
    console.log("✅ Proctoring logs fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Failed to fetch proctoring logs:", error);
    throw new Error(error.message || "Failed to fetch proctoring logs");
  }
};

// Get proctoring summary (counts by type and severity)
export const getProctoringSummary = async (examId) => {
  try {
    const logs = await getProctoringLogs(examId);
    return {
      totalLogs: logs.totalLogs,
      countsByType: logs.countsByType,
      countsBySeverity: logs.countsBySeverity,
      candidateInfo: logs.candidateId
    };
  } catch (error) {
    console.error("❌ Failed to get proctoring summary:", error);
    throw error;
  }
};

// Helper function to format answers correctly for submission
export const formatAnswersForSubmission = (questions, userAnswers) => {
  const formattedAnswers = {};
  
  questions.forEach((question, index) => {
    const answerKey = index.toString();
    const userAnswer = userAnswers[answerKey];
    
    if (userAnswer !== undefined && userAnswer !== null) {
      formattedAnswers[answerKey] = userAnswer;
    } else {
      // Provide default empty answer if none provided
      if (question.type === 'msq') {
        formattedAnswers[answerKey] = [];
      } else {
        formattedAnswers[answerKey] = '';
      }
    }
  });
  
  console.log("📝 Formatted answers:", formattedAnswers);
  return formattedAnswers;
};

// Debug function to validate answers before submission
export const validateAnswersBeforeSubmit = (answers, questions) => {
  console.log("🔍 Validating answers before submission...");
  
  if (!answers || typeof answers !== 'object') {
    console.error("❌ Answers is not an object");
    return false;
  }

  const answerKeys = Object.keys(answers);
  console.log("📋 Answer keys:", answerKeys);
  console.log("📋 Questions count:", questions.length);

  if (answerKeys.length !== questions.length) {
    console.error(`❌ Answers count (${answerKeys.length}) doesn't match questions count (${questions.length})`);
    return false;
  }

  // Check each answer
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const answerKey = i.toString();
    const givenAnswer = answers[answerKey];
    
    console.log(`Q${i} (${question.type}):`, {
      givenAnswer,
      question: question.question.substring(0, 50) + '...'
    });

    if (givenAnswer === undefined || givenAnswer === null) {
      console.error(`❌ No answer for question ${i}`);
      return false;
    }

    // Type validation
    if (question.type === 'msq' && !Array.isArray(givenAnswer)) {
      console.error(`❌ MSQ question ${i} should have array answer, got:`, typeof givenAnswer);
      return false;
    }

    if ((question.type === 'mcq' || question.type === 'short' || question.type === 'descriptive') && 
        typeof givenAnswer !== 'string') {
      console.error(`❌ ${question.type} question ${i} should have string answer, got:`, typeof givenAnswer);
      return false;
    }
  }

  console.log("✅ All answers validated successfully");
  return true;
};