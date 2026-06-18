import React, { useState, useEffect } from "react";
import DataTable from "../../components/DataTable";
import api from "../api";

export default function ReviewerList() {
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("name");

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        setLoading(true);

        const res = await api.get("/api/auth/reviewers/");

        if (res.data?.status) {
          const sortedReviewers = [...(res.data.reviewers || [])]
            .sort((a, b) => a.id - b.id);

          setReviewers(sortedReviewers);
        }
      } catch (err) {
        console.error("Reviewer API Error:", err);

        if (err.response) {
          console.log("Status:", err.response.status);
          console.log("Response:", err.response.data);
        }

        setError("Unable to load reviewer directory.");
      } finally {
        setLoading(false);
      }
    };

    fetchReviewers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredReviewers = reviewers.filter((reviewer) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return true;

    switch (searchType) {
      case "id":
        return String(reviewer.id).includes(search);

      case "name":
      default:
        return reviewer.name
          ?.toLowerCase()
          .includes(search);
    }
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentReviewers = filteredReviewers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(
    filteredReviewers.length / itemsPerPage
  );

  const columns = [
    {
      key: "id",
      header: "ID",
    },

    {
      key: "name",
      header: "Full Name",
    },

    {
      key: "email",
      header: "Email",
    },

    {
      key: "institutions",
      header: "Institutions",
      render: (r) => (
        <details className="group">
          <summary className="cursor-pointer list-none flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700">
            <span>View Institutions</span>

            <svg
              className="w-4 h-4 transition-transform duration-200 group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>

          <div className="mt-2 p-3 bg-gray-50 rounded-lg border text-sm text-gray-700 max-w-[300px]">
            {Array.isArray(r.institutions) &&
              r.institutions.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {r.institutions.map((inst, idx) => (
                  <li key={idx}>{inst}</li>
                ))}
              </ul>
            ) : (
              "No institutions available"
            )}
          </div>
        </details>
      ),
    },

    {
      key: "work",
      header: "Work Experience",
      render: (r) => (
        <details className="group">
          <summary className="cursor-pointer list-none flex items-center gap-2 text-green-600 font-medium hover:text-green-700">
            <span>View Work</span>

            <svg
              className="w-4 h-4 transition-transform duration-200 group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>

          <div className="mt-2 p-3 bg-green-50 rounded-lg border text-sm text-gray-700 whitespace-pre-wrap max-w-[400px]">
            {r.work || "No work experience provided"}
          </div>
        </details>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="text-lg font-medium text-gray-600">
          Loading reviewers...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="text-red-500 font-medium text-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Reviewer Management
          </h2>

          <p className="text-gray-500 mt-1">

          </p>
        </div>

        {/* Search */}
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Reviewer
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={searchType}
            onChange={(e) =>
              setSearchType(e.target.value)
            }
            className="px-4 py-3 border border-gray-300 rounded-xl bg-white"
          >
            <option value="id">
              Search by Reviewer ID
            </option>

            <option value="name">
              Search by Reviewer Name
            </option>
          </select>

          <div className="relative flex-1">
            <input
              type="text"
              placeholder={
                searchType === "id"
                  ? "Enter reviewer ID..."
                  : "Enter reviewer name..."
              }
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <svg
              className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m1.85-5.65a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
              />
            </svg>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl shadow">
          <p className="text-sm opacity-90">
            Matching Reviewers
          </p>

          <p className="text-2xl font-bold">
            {filteredReviewers.length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {filteredReviewers.length > 0 ? (
          <>
            <DataTable
              columns={columns}
              rows={currentReviewers}
              rowKey="id"
            />

            {filteredReviewers.length > itemsPerPage && (
              <div className="px-6 py-4 bg-gray-50 border-t flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold">
                    {indexOfFirstItem + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold">
                    {Math.min(
                      indexOfLastItem,
                      filteredReviewers.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">
                    {filteredReviewers.length}
                  </span>{" "}
                  reviewers
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.max(1, p - 1)
                      )
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold">
                    {currentPage}
                  </span>

                  <button
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(totalPages, p + 1)
                      )
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-24 text-center">
            <div className="text-gray-500 text-lg">
              {searchTerm
                ? `No reviewers found matching "${searchTerm}"`
                : "No active reviewers found"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}