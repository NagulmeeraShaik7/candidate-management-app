import React from "react";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
import CandidateTable from "./components/CandidateTable";
import ErrorPage from "./components/ErrorPage";

function ErrorPageWrapper() {
  const { code } = useParams();
  return <ErrorPage code={parseInt(code, 10)} />;
}

const App = () => {
  return (
    <Router>
      <div className="p-6">
        <Routes>
          <Route path="/" element={<CandidateTable />} />
          <Route path="/error/:code" element={<ErrorPageWrapper />} />
          <Route path="*" element={<ErrorPage code={404} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;