import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ExamDashboard.css";

const ExamDashboard = () => {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingExam, setGeneratingExam] = useState(false);
  const navigate = useNavigate();

  // Get user info from token or session
  const getUserInfo = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        email: payload.email,
        role: payload.role
      };
    } catch (err) {
      console.error("Error decoding token:", err);
      return null;
    }
  };

  const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

  // Alternative: Try to fetch candidate by ID if we know the candidate ID
  const fetchCandidateById = async (candidateId) => {
    try {
      const token = getToken();
      const response = await fetch(
        `https://candidate-management-app-backend.onrender.com/api/candidates/${candidateId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching candidate by ID:", error);
      return null;
    }
  };

  // Main function to fetch candidate data
  const fetchCandidateData = async () => {
    setLoading(true);
    setError("");
    
    try {
      const userInfo = getUserInfo();
      
      if (!userInfo) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      // Check if user has correct role - MANDATORY
      if (userInfo.role !== "user") {
        setError("Access denied. This dashboard is for candidates only.");
        setLoading(false);
        return;
      }

      const token = getToken();
      
      // Fetch ALL candidates by looping through pages until we find the matching email
      let allCandidates = [];
      let currentPage = 1;
      let hasMorePages = true;
      const limit = 50; // Increased limit to reduce API calls

      while (hasMorePages) {
        const response = await fetch(
          `https://candidate-management-app-backend.onrender.com/api/candidates?page=${currentPage}&limit=${limit}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          if ([401, 403].includes(response.status)) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            navigate("/login");
            return;
          } else {
            throw new Error(`Failed to load candidates data. Status: ${response.status}`);
          }
        }

        const result = await response.json();
        const candidates = Array.isArray(result.data?.results) ? result.data.results : [];
        
        // Add current page candidates to our collection
        allCandidates = [...allCandidates, ...candidates];
        
        // Check if we found the candidate in this batch
        const foundCandidate = candidates.find(c => 
          c.email.toLowerCase() === userInfo.email.toLowerCase()
        );

        if (foundCandidate) {
          setCandidate(foundCandidate);
          setLoading(false);
          return; // Found the candidate, stop searching
        }

        // Check if there are more pages to search
        const totalPages = Math.ceil(result.data?.meta?.total / limit);
        if (currentPage >= totalPages || candidates.length === 0) {
          hasMorePages = false;
        } else {
          currentPage++;
        }
      }

      // If we get here, we searched all pages and didn't find the candidate
      setError(`No candidate profile found for your email: ${userInfo.email}. Please contact administrator.`);
      
    } catch (err) {
      setError("An error occurred while fetching candidate data: " + err.message);
      console.error("Error fetching candidate:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCandidateData();
  }, [navigate]);

  const handleStartExam = async () => {
    if (!candidate) return;
    
    setGeneratingExam(true);
    try {
      const token = getToken();
      const response = await fetch(
        "https://candidate-management-app-backend.onrender.com/api/exam/generate/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ candidateId: candidate._id }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate exam");
      }

      const data = await response.json();
      navigate(`/exam/${data.data._id}`);
    } catch (err) {
      console.error("Error generating exam:", err);
      setError("You can only attempt the exam once every 10 days.");
    }
    setGeneratingExam(false);
  };

  const handleLogout = async () => {
    try {
      const token = getToken();
      await fetch(
        "https://candidate-management-app-backend.onrender.com/api/auth/logout",
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      navigate("/login");
    } catch (error) {
      setError("Logout request failed.");
    }
  };

  // Retry loading with different approach
  const handleRetry = async () => {
    setLoading(true);
    setError("");
    
    const userInfo = getUserInfo();
    if (!userInfo) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    // Try alternative approach: Check if we can get candidate info from token
    try {
      const token = getToken();
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // If token contains candidate ID, try to fetch by ID
      if (payload.candidateId) {
        const candidateData = await fetchCandidateById(payload.candidateId);
        if (candidateData) {
          setCandidate(candidateData);
          setLoading(false);
          return;
        }
      }
      
      // If no candidate ID in token, try the paginated search again
      await fetchCandidateData(); // Now this function is defined
    } catch (err) {
      setError("Failed to load candidate data. Please contact administrator.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="exam-dashboard-container">
        <div className="loading-banner">
          <i className="bi bi-hourglass-split"></i> Searching for your candidate profile...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exam-dashboard-container">
        <div className="error-banner">
          <i className="bi bi-exclamation-triangle"></i> {error}
        </div>
        <div className="recovery-actions">
          <button onClick={handleRetry} className="retry-btn">
            <i className="bi bi-arrow-clockwise"></i> Try Again
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="exam-dashboard-container">
        <div className="error-banner">No candidate data found.</div>
        <div className="recovery-actions">
          <button onClick={handleRetry} className="retry-btn">
            <i className="bi bi-arrow-clockwise"></i> Try Again
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-dashboard-container">
      {/* Header */}
      <div className="exam-dashboard-header">
        <h1 className="exam-dashboard-heading">Technical Assessment Portal</h1>
        <button className="logout-btn" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i> Logout
        </button>
      </div>

      {/* Candidate Info Card */}
      <div className="candidate-info-card">
        <div className="card-header">
          <div className="profile-icon">
            <i className="bi bi-person-circle"></i>
          </div>
          <h2>Candidate Information</h2>
        </div>
        
        <div className="candidate-details-grid">
          <div className="detail-group">
            <label className="detail-label">Full Name</label>
            <span className="detail-value">{candidate.name}</span>
          </div>
          
          <div className="detail-group">
            <label className="detail-label">Email Address</label>
            <span className="detail-value">{candidate.email}</span>
          </div>
          
          <div className="detail-group">
            <label className="detail-label">Phone Number</label>
            <span className="detail-value">{candidate.phone}</span>
          </div>
          
          <div className="detail-group">
            <label className="detail-label">Highest Qualification</label>
            <span className="detail-value">{candidate.highestqualification || "Not specified"}</span>
          </div>
          
          <div className="detail-group">
            <label className="detail-label">Gender</label>
            <span className="detail-value">{candidate.gender}</span>
          </div>
          
          <div className="detail-group">
            <label className="detail-label">Experience</label>
            <span className="detail-value">{candidate.experience} years</span>
          </div>
          
          <div className="detail-group full-width">
            <label className="detail-label">Skills & Technologies</label>
            <div className="skills-container">
              {candidate.skills.map((skill, index) => (
                <span key={index} className="skill-tag">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Exam Instructions */}
      <div className="exam-instructions-card">
        <h3>
          <i className="bi bi-info-circle"></i>
          Examination Guidelines
        </h3>
        
        <div className="instructions-list">
          <div className="instruction-item">
            <i className="bi bi-clock instruction-icon"></i>
            <span>60 minutes time limit for the entire examination</span>
          </div>
          
          <div className="instruction-item">
            <i className="bi bi-list-ol instruction-icon"></i>
            <span>Given 20-25 multiple choice questions to complete</span>
          </div>
          
          <div className="instruction-item">
            <i className="bi bi-laptop instruction-icon"></i>
            <span>Questions generated by AI on your technical skills</span>
          </div>
          
          <div className="instruction-item">
            <i className="bi bi-graph-up instruction-icon"></i>
            <span>Minimum 70% score required to pass the exam</span>
          </div>
          
          <div className="instruction-item">
            <i className="bi bi-arrow-right instruction-icon"></i>
            <span>Linear navigation - cannot return to previous questions</span>
          </div>
          
          <div className="instruction-item">
            <i className="bi bi-check-circle instruction-icon"></i>
            <span>Auto-save functionality ensures no progress loss</span>
          </div>
          <div className="instruction-item">
            <i className="bi bi-shield-lock instruction-icon"></i>
            <span>Proctored environment - webcam and screen monitoring</span>
          </div>
          <div className="instruction-item">
            <i className="bi bi-exclamation-triangle instruction-icon"></i>
            <span>Strictly no cheating - violations may lead to disqualification</span>
          </div>
          <div className="instruction-item">
            <i className="bi bi-people instruction-icon"></i>
            <span>Contact support team for any technical issues during the exam</span>
          </div>
        </div>
      </div>

      {/* Start Exam Section */}
      <div className="start-exam-section">
        <div className="ready-indicator">
          <i className="bi bi-check-circle-fill ready-icon"></i>
          <span className="ready-text">You are ready to begin the assessment</span>
        </div>
        
        <button 
          className="start-exam-btn"
          onClick={handleStartExam}
          disabled={generatingExam}
        >
          {generatingExam ? (
            <>
              <i className="bi bi-hourglass-split"></i>
              Generating Exam...
            </>
          ) : (
            <>
              <i className="bi bi-play-fill"></i>
              Start Assessment
            </>
          )}
        </button>
        
        <p className="exam-note">
          Once you click "Start Assessment", the timer will begin and you'll have 60 minutes to complete the exam.
        </p>
      </div>
    </div>
  );
};

export default ExamDashboard;