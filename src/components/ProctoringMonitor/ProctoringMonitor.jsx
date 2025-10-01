// src/components/ProctoringMonitor/ProctoringMonitor.jsx
import React, { useEffect, useRef, useState } from 'react';
import { logProctoringEvent, logCommonProctoringEvent, ProctoringEvents } from '../../services/examService';
import './ProctoringMonitor.css';

const ProctoringMonitor = ({ examId, candidateId, onViolation, onDisqualify }) => {
  const [violations, setViolations] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [currentWarning, setCurrentWarning] = useState(null);
  const videoRef = useRef(null);
  const popupVideoRef = useRef(null);
  const streamRef = useRef(null);
  const lastFaceDetectionRef = useRef(Date.now());
  const detectionIntervalRef = useRef(null);
  const warningCountRef = useRef(0);
  const violationCountRef = useRef(0);
  const screenshotCanvasRef = useRef(null);
  const autoCloseTimerRef = useRef(null);

  // Initialize proctoring
  useEffect(() => {
    if (examId && candidateId) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [examId, candidateId]);

  const startMonitoring = async () => {
    try {
      setIsMonitoring(true);
      
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 250, height: 250 },
        audio: true 
      });
      
      streamRef.current = stream;
      
      // Set stream for both video elements
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      if (popupVideoRef.current) {
        popupVideoRef.current.srcObject = stream;
      }

      // Create screenshot canvas
      screenshotCanvasRef.current = document.createElement('canvas');

      // Start monitoring activities
      startTabSwitchDetection();
      startWindowFocusDetection();
      startFaceDetection();
      startSoundDetection();
      startInspectDetection();

      // Log monitoring start using the new API
      await logCommonProctoringEvent(
        examId,
        candidateId,
        'CUSTOM',
        { monitoringStarted: true, timestamp: new Date().toISOString() }
      );

    } catch (error) {
      console.error('Error starting proctoring:', error);
      // Log failure using the new API
      await logProctoringEvent(
        examId,
        candidateId,
        'CUSTOM',
        'Failed to start proctoring - camera/mic access denied',
        'HIGH',
        { error: error.message, timestamp: new Date().toISOString() }
      );
    }
  };

  const stopMonitoring = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    setIsMonitoring(false);
  };

  const captureScreenshot = () => {
    if (!videoRef.current || !screenshotCanvasRef.current) return null;
    
    try {
      const video = videoRef.current;
      const canvas = screenshotCanvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      return null;
    }
  };

  const showViolationWarning = async (violation) => {
    violationCountRef.current += 1;
    
    // Capture screenshot for evidence
    const screenshot = captureScreenshot();
    
    // Log the violation using the new API structure
    try {
      await logProctoringEvent(
        examId,
        candidateId,
        violation.type,
        violation.message,
        violation.severity,
        { 
          ...violation.metadata,
          violationNumber: violationCountRef.current,
          warningNumber: warningCountRef.current,
          timestamp: new Date().toISOString(),
          screenshot: screenshot ? 'captured' : 'failed'
        }
      );
    } catch (error) {
      console.error('Failed to log proctoring event:', error);
      // Don't break the flow if logging fails
    }

    // Show warning popup every 10 violations (at 10, 20, 30, 40)
    if (violationCountRef.current % 10 === 0 && warningCountRef.current < 4) {
      warningCountRef.current += 1;
      setCurrentWarning({
        ...violation,
        warningNumber: warningCountRef.current,
        totalViolations: violationCountRef.current,
        screenshot
      });
      setShowWarning(true);
      
      // Clear any existing timer
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
      
      // Auto-hide warning after 10 seconds
      autoCloseTimerRef.current = setTimeout(() => {
        setShowWarning(false);
      }, 10000);
    }
    
    // Auto-submit and disqualify after 4th warning (40+ violations)
    if (warningCountRef.current >= 4 && onDisqualify) {
      setTimeout(() => {
        onDisqualify(violationCountRef.current, warningCountRef.current);
      }, 2000);
    }

    if (onViolation) {
      onViolation(violation, violationCountRef.current);
    }
  };

  const handleCloseWarning = () => {
    setShowWarning(false);
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
  };

  const startTabSwitchDetection = () => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  };

  const handleVisibilityChange = async () => {
    if (document.hidden) {
      const violation = {
        type: 'INSPECT_WINDOW',
        message: 'You switched to another tab/window',
        severity: 'MEDIUM',
        timestamp: new Date().toISOString(),
        metadata: { hidden: document.hidden, durationSeconds: 5 }
      };

      setViolations(prev => [...prev, violation]);
      showViolationWarning(violation);
    } else {
      // Log return to tab using common event helper
      await logCommonProctoringEvent(
        examId,
        candidateId,
        'CUSTOM',
        { event: 'tab_return', timestamp: new Date().toISOString() }
      );
    }
  };

  const startWindowFocusDetection = () => {
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
  };

  const handleWindowBlur = async () => {
    const violation = {
      type: 'FOCUS_LOST',
      message: 'You switched to another application',
      severity: 'MEDIUM',
      timestamp: new Date().toISOString(),
      metadata: { event: 'window_blur', durationSeconds: 3 }
    };

    showViolationWarning(violation);
  };

  const handleWindowFocus = async () => {
    await logCommonProctoringEvent(
      examId,
      candidateId,
      'CUSTOM',
      { event: 'window_focus', timestamp: new Date().toISOString() }
    );
  };

  const startFaceDetection = () => {
    // Simulate face detection
    detectionIntervalRef.current = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastDetection = now - lastFaceDetectionRef.current;

      // Simulate random face detection issues
      if (Math.random() < 0.08) { // 8% chance of face issue
        const issueType = Math.random() < 0.5 ? 'NO_FACE' : 'MULTIPLE_FACES';
        
        const violation = {
          type: issueType,
          message: issueType === 'NO_FACE' ? 'Face not detected in frame' : 'Multiple faces detected in frame',
          severity: 'HIGH',
          timestamp: new Date().toISOString(),
          metadata: { duration: timeSinceLastDetection }
        };

        setViolations(prev => [...prev, violation]);
        showViolationWarning(violation);
      } else if (Math.random() < 0.05) { // 5% chance of insufficient light
        const violation = {
          type: 'CUSTOM',
          message: 'Insufficient lighting detected',
          severity: 'MEDIUM',
          timestamp: new Date().toISOString(),
          metadata: { lightLevel: 'low' }
        };

        showViolationWarning(violation);
      } else {
        lastFaceDetectionRef.current = now;
      }
    }, 10000); // Check every 10 seconds
  };

  const startSoundDetection = () => {
    // Simulate sound detection
    setInterval(async () => {
      if (Math.random() < 0.04) { // 4% chance of sound detection
        const violation = {
          type: 'CUSTOM',
          message: 'Unusual sound detected',
          severity: 'MEDIUM',
          timestamp: new Date().toISOString(),
          metadata: { soundLevel: Math.random() * 100 }
        };

        showViolationWarning(violation);
      }
    }, 15000); // Check every 15 seconds
  };

  const startInspectDetection = () => {
    // Simulate inspect element detection
    setInterval(async () => {
      if (Math.random() < 0.03) { // 3% chance of inspect detection
        const violationType = Math.random() < 0.5 ? 'INSPECT_TAB' : 'INSPECT_WINDOW';
        const message = violationType === 'INSPECT_TAB' 
          ? 'Inspect element detected' 
          : 'Developer tools detected';

        const violation = {
          type: violationType,
          message,
          severity: 'HIGH',
          timestamp: new Date().toISOString(),
          metadata: { durationSeconds: 2 }
        };

        showViolationWarning(violation);
      }
    }, 20000); // Check every 20 seconds
  };

  const getViolationCount = (type) => {
    return violations.filter(v => v.type === type).length;
  };

  const getTotalViolations = () => {
    return violationCountRef.current;
  };

  const getTotalWarnings = () => {
    return warningCountRef.current;
  };

  const getNextWarningAt = () => {
    const nextViolationThreshold = (warningCountRef.current + 1) * 10;
    return Math.max(0, nextViolationThreshold - violationCountRef.current);
  };

  return (
    <>
      {/* Warning Popup */}
      {showWarning && currentWarning && (
        <div className="warning-popup-overlay">
          <div className={`warning-popup ${currentWarning.severity.toLowerCase()}`}>
            <div className="warning-header">
              <i className={`bi bi-${currentWarning.severity === 'HIGH' ? 'exclamation-triangle' : 'exclamation-circle'}`}></i>
              <h4>Proctoring Alert - Warning {currentWarning.warningNumber}/4</h4>
              <button 
                className="close-warning" 
                onClick={handleCloseWarning}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            
            <div className="warning-content">
              <div className="warning-main">
                <p className="warning-message">{currentWarning.message}</p>
                
                {/* Live Video Feed in Popup */}
                <div className="warning-video-feed">
                  <div className="video-header">
                    <i className="bi bi-camera-video"></i>
                    <span>Live Camera Feed</span>
                  </div>
                  <video 
                    ref={popupVideoRef} 
                    autoPlay 
                    muted 
                    playsInline
                    className="popup-video"
                  />
                  {currentWarning.screenshot && (
                    <div className="screenshot-notice">
                      <i className="bi bi-camera"></i>
                      Screenshot captured for evidence
                    </div>
                  )}
                </div>
              </div>

              <div className="warning-details">
                <div className="violation-info">
                  <div className="info-item">
                    <span className="info-label">Violation Type:</span>
                    <span className="info-value">{currentWarning.type.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Severity:</span>
                    <span className={`severity-badge ${currentWarning.severity.toLowerCase()}`}>
                      {currentWarning.severity}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Total Violations:</span>
                    <span className="info-value">{currentWarning.totalViolations}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Warning Threshold:</span>
                    <span className="info-value">Every 10 violations</span>
                  </div>
                </div>

                {currentWarning.warningNumber >= 3 && (
                  <div className="warning-critical">
                    <i className="bi bi-exclamation-triangle"></i>
                    <div>
                      <strong>FINAL WARNING!</strong>
                      <p>Next violation will result in automatic exam disqualification and submission.</p>
                    </div>
                  </div>
                )}

                {currentWarning.warningNumber < 3 && (
                  <div className="warning-notice">
                    <i className="bi bi-info-circle"></i>
                    <span>
                      {currentWarning.warningNumber === 2 
                        ? "This is your 2nd warning. One more warning may lead to disqualification."
                        : "Continued violations may result in exam disqualification."
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="warning-footer">
              <button 
                className="acknowledge-btn"
                onClick={handleCloseWarning}
              >
                <i className="bi bi-check-circle"></i>
                I Understand
              </button>
              <div className="auto-close-timer">
                Auto-closing in <span className="timer">10</span>s
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proctoring Monitor */}
      <div className="proctoring-monitor">
        <div className="proctoring-header">
          <h4>
            <i className="bi bi-shield-check"></i>
            Proctoring Active
          </h4>
          <div className="monitoring-info">
            <div className={`monitoring-status ${isMonitoring ? 'active' : 'inactive'}`}>
              {isMonitoring ? '🟢 Monitoring' : '🔴 Inactive'}
            </div>
            <div className="warning-count">
              Warnings: {getTotalWarnings()}/4
            </div>
            <div className="violation-count">
              Violations: {getTotalViolations()}
            </div>
          </div>
        </div>

        <div className="proctoring-content">
          {/* Small Video Card */}
          <div className="video-card">
            <div className="video-card-header">
              <i className="bi bi-camera-video"></i>
              <span>Live Camera</span>
              <div className={`video-status ${isMonitoring ? 'recording' : 'offline'}`}>
                {isMonitoring ? '● Recording' : '○ Offline'}
              </div>
            </div>
            <div className="video-container">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline
                className="small-video"
              />
            </div>
            <div className="video-footer">
              <div className="resolution">250×250</div>
              <div className="fps">30 FPS</div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="stats-section">
            <div className="warning-progress">
              <h5>Warning Progress</h5>
              <div className="progress-bars">
                <div className="progress-item">
                  <span className="progress-label">Violations:</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill violations"
                      style={{ width: `${Math.min(100, (getTotalViolations() / 40) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="progress-value">{getTotalViolations()}/40</span>
                </div>
                <div className="progress-item">
                  <span className="progress-label">Warnings:</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill warnings"
                      style={{ width: `${(getTotalWarnings() / 4) * 100}%` }}
                    ></div>
                  </div>
                  <span className="progress-value">{getTotalWarnings()}/4</span>
                </div>
              </div>
              {getTotalWarnings() < 4 && (
                <div className="next-warning">
                  <i className="bi bi-clock"></i>
                  Next warning in: {getNextWarningAt()} violations
                </div>
              )}
            </div>

            <div className="proctoring-stats">
              <div className="stat-item">
                <span className="stat-label">Tab Switches</span>
                <span className="stat-value">{getViolationCount('INSPECT_WINDOW')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Face Issues</span>
                <span className="stat-value">
                  {getViolationCount('NO_FACE') + getViolationCount('MULTIPLE_FACES')}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Inspections</span>
                <span className="stat-value">
                  {getViolationCount('INSPECT_TAB') + getViolationCount('INSPECT_WINDOW')}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Sound Events</span>
                <span className="stat-value">{getViolationCount('CUSTOM')}</span>
              </div>
            </div>

            {/* Violations List */}
            {violations.length > 0 && (
              <div className="violations-list">
                <h5>Recent Violations ({getTotalViolations()} total):</h5>
                <div className="violations-scroll">
                  {violations.slice(-4).map((violation, index) => (
                    <div key={index} className={`violation-item ${violation.severity.toLowerCase()}`}>
                      <i className={`bi bi-${violation.severity === 'HIGH' ? 'exclamation-triangle' : 'exclamation-circle'}`}></i>
                      <span className="violation-message">{violation.message}</span>
                      <span className="violation-time">
                        {new Date(violation.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProctoringMonitor;