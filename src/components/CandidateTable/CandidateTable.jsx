import React, { useState, useEffect } from "react";
import CandidateForm from "../CandidateForm/CandidateForm";
import FilterSidebar from "../FilterSidebar/FilterSidebar";
import { useNavigate } from "react-router-dom";
import "./CandidateTable.css";

const CANDIDATES_PER_PAGE = 10;

const CandidateTable = () => {
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editCandidate, setEditCandidate] = useState(null);
  const [filters, setFilters] = useState({});
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const navigate = useNavigate();

  // 🔹 Helper: get stored token
  const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

  // 🔹 Logout API Call
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
      setFetchError("Logout request failed.");
    }
  };

  const fetchCandidates = async (currentPage = page) => {
    setLoading(true);
    setFetchError("");
    try {
      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `https://candidate-management-app-backend.onrender.com/api/candidates?page=${currentPage}&limit=${CANDIDATES_PER_PAGE}`,
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
        }
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
      setCandidates(Array.isArray(result.data?.results) ? result.data.results : []);
      setTotalPages(Math.ceil(result.data?.meta?.total / CANDIDATES_PER_PAGE));
    } catch (error) {
      setCandidates([]);
      navigate("/error/500");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCandidates(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // ✅ UPDATED: Immediately refresh list after saving candidate
  const handleCandidateSaved = () => {
    setShowForm(false);
    setEditCandidate(null);
    fetchCandidates(page); // Re-fetch current page immediately
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
      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `https://candidate-management-app-backend.onrender.com/api/candidates/${
          deleteCandidate._id || deleteCandidate.id
        }`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setSuccessMsg("Candidate deleted successfully!");
        fetchCandidates(page);
        setTimeout(() => setSuccessMsg(""), 2500);
      } else if ([401, 403].includes(response.status)) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        navigate("/login");
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

  // 🔹 Filtering logic
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = [c.name, c.email, c.phone].some((field) =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesGender = !filters.gender || c.gender === filters.gender;
    const matchesQualification =
      !filters.qualification ||
      (c.highestqualification || "")
        .toLowerCase()
        .includes(filters.qualification.toLowerCase());
    const expNum = parseInt(c.experience);
    const minExp = filters.expMin ? parseInt(filters.expMin) : null;
    const maxExp = filters.expMax ? parseInt(filters.expMax) : null;
    const matchesExp =
      (minExp === null || expNum >= minExp) &&
      (maxExp === null || expNum <= maxExp);
    const matchesSkills =
      !filters.skills ||
      c.skills.some((skill) =>
        skill.toLowerCase().includes(filters.skills.toLowerCase())
      );
    return (
      matchesSearch &&
      matchesGender &&
      matchesQualification &&
      matchesExp &&
      matchesSkills
    );
  });

  return (
    <div className="candidate-table-container">
      <div className="candidate-table-header">
        <h1 className="candidates-heading">Candidates Dashboard</h1>
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
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </div>

      {showFilter && (
        <FilterSidebar
          onClose={() => setShowFilter(false)}
          onFilter={setFilters}
        />
      )}

      {successMsg && <div className="success-banner">{successMsg}</div>}
      {loading && <div className="loading-banner">Loading candidates...</div>}
      {fetchError && <div className="error-banner">{fetchError}</div>}

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
            <th style={{ textAlign: "center" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCandidates.map((c, index) => (
            <tr key={c._id || c.id || index}>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.phone}</td>
              <td>{c.highestqualification || "-"}</td>
              <td>{c.gender}</td>
              <td>{c.experience}</td>
              <td>{c.skills.join(", ")}</td>
              <td style={{ textAlign: "center" }}>
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
            <div className="delete-title">Delete Candidate?</div>
            <div className="delete-desc">
              Are you sure you want to delete <b>{deleteCandidate.name}</b>? This
              action cannot be undone.
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
