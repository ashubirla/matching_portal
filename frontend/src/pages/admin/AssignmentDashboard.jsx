import React, { useEffect, useState } from "react";
import api from "../api";
import DataTable from "../../components/DataTable";
import StatsCard from "../../components/StatsCard";

export default function AssignmentDashboard() {
  const [assignments, setAssignments] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    submitted: 0,
  });

  const [loading, setLoading] = useState(true);
  const [paperTitleSearch, setPaperTitleSearch] = useState("");
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [paperIdSearch, setPaperIdSearch] = useState("");
  const [reviewerIdSearch, setReviewerIdSearch] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [paperModal, setPaperModal] = useState(false);
  const [reviewerModal, setReviewerModal] = useState(false);

  const [selectedPaper, setSelectedPaper] =
    useState(null);

  const [selectedReviewer, setSelectedReviewer] =
    useState(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);

      const res = await api.get(
        "/api/reviewers/assignment-dashboard/"
      );

      if (res.data?.status) {
        setAssignments(
          res.data.assignments || []
        );

        setStats(
          res.data.counts || {
            total: 0,
            pending: 0,
            submitted: 0,
          }
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaperDetails = async (
    paperId
  ) => {
    try {
      const res = await api.get(
        `/api/papers/${paperId}/`
      );

      setSelectedPaper(res.data);
      setPaperModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviewerDetails = async (
    reviewerId
  ) => {
    try {
      const res = await api.get(
        `/api/auth/reviewer/${reviewerId}/`
      );

      if (res.data?.status) {
        setSelectedReviewer(
          res.data.reviewer
        );

        setReviewerModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAssignments =
    assignments.filter((item) => {

      const paperTitleMatch =
        !paperTitleSearch ||
        item.paper_title
          ?.toLowerCase()
          .includes(
            paperTitleSearch.toLowerCase()
          );

      const reviewerMatch =
        !reviewerSearch ||
        item.reviewer_name
          ?.toLowerCase()
          .includes(
            reviewerSearch.toLowerCase()
          );

      const paperIdMatch =
        !paperIdSearch ||
        String(item.paper_id).includes(
          paperIdSearch
        );

      const reviewerIdMatch =
        !reviewerIdSearch ||
        String(item.reviewer_id).includes(
          reviewerIdSearch
        );

      return (
        paperTitleMatch &&
        reviewerMatch &&
        paperIdMatch &&
        reviewerIdMatch
      );
    });

  const totalPages = Math.ceil(
    filteredAssignments.length /
    rowsPerPage
  );

  const startIndex =
    (currentPage - 1) * rowsPerPage;

  const endIndex =
    startIndex + rowsPerPage;

  const paginatedAssignments =
    filteredAssignments.slice(
      startIndex,
      endIndex
    );

  const columns = [
    {
      key: "paper_id",
      header: "Paper ID",

      render: (r) => (
        <button
          onClick={() =>
            fetchPaperDetails(
              r.paper_id
            )
          }
          className="text-blue-600 hover:underline font-semibold"
        >
          #{r.paper_id}
        </button>
      ),
    },

    {
      key: "paper_title",
      header: "Paper Title",

      render: (r) => (
        <div className="max-w-[250px] truncate font-medium">
          {r.paper_title}
        </div>
      ),
    },

    {
      key: "reviewer_id",
      header: "Reviewer ID",

      render: (r) => (
        <button
          onClick={() =>
            fetchReviewerDetails(
              r.reviewer_id
            )
          }
          className="text-indigo-600 hover:underline font-semibold"
        >
          #{r.reviewer_id}
        </button>
      ),
    },

    {
      key: "reviewer_name",
      header: "Reviewer",
    },

    {
      key: "reviewer_email",
      header: "Email",
    },

    {
      key: "reviewer_status",
      header: "Status",

      render: (r) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${r.reviewer_status?.toLowerCase() ===
            "submitted"
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
            }`}
        >
          {r.reviewer_status}
        </span>
      ),
    },

    {
      key: "paper_score",
      header: "Score",

      render: (r) =>
        r.paper_score ?? "-",
    },

    {
      key: "comments",
      header: "Comments",

      render: (r) => (
        <details>
          <summary className="cursor-pointer text-blue-600">
            View
          </summary>

          <div className="mt-2 p-3 bg-gray-50 rounded-lg border max-w-[300px]">
            {r.comments ||
              "No comments"}
          </div>
        </details>
      ),
    },
  ];
  if (loading) {
    return (
      <div className="flex justify-center py-24">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold">
            Assignment Dashboard
          </h2>

          <p className="text-gray-500">
            Track reviewer assignments
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">

          <input
            type="text"
            placeholder="Search Paper Title"
            value={paperTitleSearch}
            onChange={(e) => {
              setPaperTitleSearch(
                e.target.value
              );
              setCurrentPage(1);
            }}
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="text"
            placeholder="Search Reviewer Name"
            value={reviewerSearch}
            onChange={(e) => {
              setReviewerSearch(
                e.target.value
              );
              setCurrentPage(1);
            }}
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="text"
            placeholder="Search Paper ID"
            value={paperIdSearch}
            onChange={(e) => {
              setPaperIdSearch(
                e.target.value
              );
              setCurrentPage(1);
            }}
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="text"
            placeholder="Search Reviewer ID"
            value={reviewerIdSearch}
            onChange={(e) => {
              setReviewerIdSearch(
                e.target.value
              );
              setCurrentPage(1);
            }}
            className="border rounded-xl px-4 py-3"
          />

        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total Assignments"
          value={stats.total}
        />

        <StatsCard
          label="Pending Reviews"
          value={stats.pending}
        />

        <StatsCard
          label="Submitted Reviews"
          value={stats.submitted}
        />
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">

        <DataTable
          columns={columns}
          rows={paginatedAssignments}
          rowKey="id"
        />

        <div className="flex justify-between items-center p-4 border-t bg-gray-50">

          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(
                Number(
                  e.target.value
                )
              );

              setCurrentPage(1);
            }}
            className="border rounded-lg px-3 py-2"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </select>

          <div className="flex gap-3">
            <button
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  currentPage - 1
                )
              }
              className="px-4 py-2 border rounded-lg"
            >
              Previous
            </button>

            <span className="px-4 py-2">
              {currentPage} /{" "}
              {totalPages || 1}
            </span>

            <button
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  currentPage + 1
                )
              }
              className="px-4 py-2 border rounded-lg"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {paperModal && selectedPaper && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col">

            <div className="flex items-center justify-between border-b px-6 py-4 bg-white rounded-t-2xl">

              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Paper #{selectedPaper.id}
                </h3>

                <p className="text-sm text-gray-500">
                  Complete Paper Information
                </p>
              </div>

              <button
                onClick={() => setPaperModal(false)}
                className="w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 text-red-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Title
                </h4>

                <div className="bg-gray-50 border rounded-xl p-4">
                  {selectedPaper.title}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Abstract
                </h4>

                <div className="bg-gray-50 border rounded-xl p-4 whitespace-pre-wrap leading-relaxed">
                  {selectedPaper.abstract}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Authors
                </h4>

                <div className="flex flex-wrap gap-2">
                  {selectedPaper.author_names?.map(
                    (author, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {author}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Institutions
                </h4>

                <div className="flex flex-wrap gap-2">
                  {selectedPaper.paper_affiliations?.map(
                    (inst, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                      >
                        {inst}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Status
                  </h4>

                  <div className="bg-gray-50 border rounded-xl p-4">
                    {selectedPaper.status}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Paper ID
                  </h4>

                  <div className="bg-gray-50 border rounded-xl p-4">
                    {selectedPaper.id}
                  </div>
                </div>

              </div>

              {selectedPaper.pdf_url && (
                <a
                  href={selectedPaper.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  Open PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {reviewerModal && selectedReviewer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">

            <div className="flex justify-between items-center border-b px-6 py-4 bg-white rounded-t-2xl">

              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Reviewer #{selectedReviewer.id}
                </h3>

                <p className="text-sm text-gray-500">
                  Reviewer Profile
                </p>
              </div>

              <button
                onClick={() => setReviewerModal(false)}
                className="w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 text-red-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              <div className="grid md:grid-cols-2 gap-4">

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Name
                  </h4>

                  <div className="bg-gray-50 border rounded-xl p-4">
                    {selectedReviewer.name}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Email
                  </h4>

                  <div className="bg-gray-50 border rounded-xl p-4">
                    {selectedReviewer.email}
                  </div>
                </div>

              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Institutions
                </h4>

                <div className="flex flex-wrap gap-2">
                  {selectedReviewer.institutions?.map(
                    (inst, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                      >
                        {inst}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Work Experience / Research Profile
                </h4>

                <div className="bg-gray-50 border rounded-xl p-4 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                  {selectedReviewer.work ||
                    "No work information available"}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}