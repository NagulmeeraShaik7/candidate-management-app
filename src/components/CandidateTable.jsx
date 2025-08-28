import React, { useState, useEffect } from "react";
import CandidateForm from "./CandidateForm";
import FilterSidebar from "./FilterSidebar";
import { useNavigate } from "react-router-dom";
import "./CandidateTable.css";

const CANDIDATES_PER_PAGE = 5;

const CandidateTable = () => {
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editCandidate, setEditCandidate] = useState(null);
  const [filters, setFilters] = useState({});
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const navigate = useNavigate();

  const fetchCandidates = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const response = await fetch("https://candidate-management-app-backend.onrender.com/api/candidates");
      if (!response.ok) {
        if ([400, 404, 500].includes(response.status)) {
          navigate(`/error/${response.status}`);
          return;
        }
        setFetchError("Failed to load candidates. Please try again.");
        setCandidates([]);
        setLoading(false);
        return;
      }
      const result = await response.json();
      setCandidates(Array.isArray(result.data) ? result.data : []);
     
    } catch (error) {
      setCandidates([]);
      navigate("/error/500");
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      setFetchError("");
      try {
        const response = await fetch("https://candidate-management-app-backend.onrender.com/api/candidates");
        if (!response.ok) {
          if ([400, 404, 500].includes(response.status)) {
            navigate(`/error/${response.status}`);
            return;
          }
          setFetchError("Failed to load candidates. Please try again.");
          setCandidates([]);
          setLoading(false);
          return;
        }
        const result = await response.json();
        setCandidates(Array.isArray(result.data) ? result.data : []);
       
      } catch (error) {
        setCandidates([]);
        navigate("/error/500");
      }
      setLoading(false);
    };
    fetchCandidates();
  }, [navigate]);

  // Filtering logic
  const filteredCandidates = candidates.filter((c) => {
    // Search bar filter
    const matchesSearch = [c.name, c.email, c.phone].some((field) =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
    // Gender filter
    const matchesGender = !filters.gender || c.gender === filters.gender;
    // Qualification filter (substring match, case-insensitive)
    const matchesQualification = !filters.qualification || (c.highestqualification || "").toLowerCase().includes(filters.qualification.toLowerCase());
    // Experience filter
    const expNum = parseInt(c.experience);
    const minExp = filters.expMin ? parseInt(filters.expMin) : null;
    const maxExp = filters.expMax ? parseInt(filters.expMax) : null;
    const matchesExp = (
      (minExp === null || (expNum >= minExp)) &&
      (maxExp === null || (expNum <= maxExp))
    );
    // Skills filter (substring match, case-insensitive, any skill)
    const matchesSkills = !filters.skills || c.skills.some(skill => skill.toLowerCase().includes(filters.skills.toLowerCase()));
    return matchesSearch && matchesGender && matchesQualification && matchesExp && matchesSkills;
  });

  const totalPages = Math.ceil(filteredCandidates.length / CANDIDATES_PER_PAGE) || 1;

  const paginatedCandidates = filteredCandidates.slice(
    (page - 1) * CANDIDATES_PER_PAGE,
    page * CANDIDATES_PER_PAGE
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const handleCandidateSaved = () => {
    fetchCandidates();
    setShowForm(false);
    setEditCandidate(null);
    setSuccessMsg("Candidate saved successfully!");
    setTimeout(() => setSuccessMsg(""), 2500);
  };

  const handleEdit = (candidate) => {
    setEditCandidate(candidate);
    setShowForm(true);
  };

  const handleDelete = (candidate) => {
    setDeleteCandidate(candidate);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      const response = await fetch(`https://candidate-management-app-backend.onrender.com/api/candidates/${deleteCandidate._id || deleteCandidate.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSuccessMsg("Candidate deleted successfully!");
        fetchCandidates();
        setTimeout(() => setSuccessMsg(""), 2500);
      } else {
        setFetchError("Failed to delete candidate.");
      }
    } catch (error) {
      setFetchError("Failed to delete candidate.");
    }
    setDeleteCandidate(null);
  };

  const cancelDelete = () => {
    setDeleteCandidate(null);
  };

  return (
    <div className="candidate-table-container">
      <div className="candidate-table-header">
        <h1 className="candidates-heading">Candidates</h1>
        <div className="actions">
          <div className="search-bar-wrapper">
            <span className="search-icon">
              <i className="bi bi-search"></i>
            </span>
            <input
              className="search-bar"
              placeholder="Search by Candidate, Email, Phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-btn" onClick={() => setShowForm(true)}>
            <i className="bi bi-person-plus-fill"></i> Add
          </button>
          <button
            className="filter-btn"
            onClick={() => setShowFilter(!showFilter)}
            title="Show Filters"
          >
            <i className="bi bi-funnel-fill"></i>
          </button>
        </div>
      </div>

      {showFilter && <FilterSidebar onClose={() => setShowFilter(false)} onFilter={setFilters} />}

      {successMsg && (
        <div style={{textAlign: 'center', color: '#16a34a', fontWeight: 600, marginBottom: '1rem', fontSize: '1.1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '0.5rem 1rem'}}> {successMsg} </div>
      )}
      {loading && (
        <div style={{textAlign: 'center', color: '#2563eb', fontWeight: 500, marginBottom: '1rem', fontSize: '1.1rem'}}>Loading candidates...</div>
      )}
      {fetchError && (
        <div style={{textAlign: 'center', color: '#ef4444', fontWeight: 500, marginBottom: '1rem', fontSize: '1.1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.5rem 1rem'}}>{fetchError}</div>
      )}

      <table className="candidate-table">
        <thead>
          <tr>
            <th>Candidate Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Highest Qualification</th>
            <th>Gender</th>
            <th>Experience</th>
            <th>Skills/Technology</th>
            <th style={{ textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedCandidates.map((c, index) => (
            <tr key={c._id || c.id || index}>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.phone}</td>
              <td>{c.highestqualification || "-"}</td>
              <td>{c.gender}</td>
              <td>{c.experience}</td>
              <td>{c.skills.join(", ")}</td>
              <td style={{ textAlign: 'center' }}>
                <button
                  className="action-btn update-btn"
                  title="Update"
                  onClick={() => handleEdit(c)}
                >
                  <i className="bi bi-pencil-square"></i>
                </button>
                <button
                  className="action-btn delete-btn"
                  title="Delete"
                  onClick={() => handleDelete(c)}
                >
                  <i className="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
        >
          <i className="bi bi-chevron-left"></i>
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            className={`pagination-btn${page === i + 1 ? " active" : ""}`}
            onClick={() => handlePageChange(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
        >
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>

      {showForm && (
        <CandidateForm
          onClose={() => {
            setShowForm(false);
            setEditCandidate(null);
          }}
          onSaved={handleCandidateSaved}
          candidate={editCandidate}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <div className="delete-icon">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div className="delete-title">
              Delete Candidate?
            </div>
            <div className="delete-desc">
              Are you sure you want to delete <b>{deleteCandidate.name}</b>? This action cannot be undone.
            </div>
            <div className="delete-actions">
              <button
                className="action-btn delete-btn"
                style={{ minWidth: 90, fontWeight: 600 }}
                onClick={confirmDelete}
              >
                <i className="bi bi-trash"></i> Delete
              </button>
              <button
                className="action-btn update-btn"
                style={{ minWidth: 90, fontWeight: 600 }}
                onClick={cancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateTable;
