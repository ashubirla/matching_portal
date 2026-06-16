import React, { useState, useEffect } from "react";
import StatsCard from "../../components/StatsCard";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import api from "../api";

export default function AdminDashboard() {
  const [papers, setPapers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    assigned: 0,
    reviewers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const res = await api.get("/api/papers/");

        if (res.data?.status) {
          setPapers(res.data.papers || []);
          setStats(res.data.counts || {});
        } else {
          throw new Error(
            res.data?.message || "Failed to fetch dashboard data"
          );
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredPapers = papers.filter((paper) => {
    const search = searchTerm.toLowerCase();

    return (
      paper.title?.toLowerCase().includes(search) ||
      paper.author_names?.some((a) =>
        a.toLowerCase().includes(search)
      )
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentPapers = filteredPapers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(
    filteredPapers.length / itemsPerPage
  );

  const columns = [
    {
      key: "id",
      header: "ID",
    },

    {
      key: "title",
      header: "Paper Title",
      render: (r) => (
        <div className="font-medium text-gray-800 max-w-[250px] truncate">
          {r.title}
        </div>
      ),
    },

    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusBadge status={r.status} />
      ),
    },

    {
      key: "primary_author",
      header: "Primary Author",
      render: (r) =>
        r.author_names?.[0] || "N/A",
    },

    {
      key: "authors",
      header: "Authors",
      render: (r) => (
        <details className="group">
          <summary className="cursor-pointer text-blue-600 font-medium flex items-center gap-2">
            View
            <span className="transition-transform group-open:rotate-180">
              ▼
            </span>
          </summary>

          <div className="mt-2 p-3 bg-blue-50 border rounded-lg">
            {r.author_names?.length ? (
              <ul className="list-disc list-inside text-sm space-y-1">
                {r.author_names.map((author, idx) => (
                  <li key={idx}>{author}</li>
                ))}
              </ul>
            ) : (
              "No authors"
            )}
          </div>
        </details>
      ),
    },

    {
      key: "institutions",
      header: "Institutions",
      render: (r) => (
        <details className="group">
          <summary className="cursor-pointer text-indigo-600 font-medium flex items-center gap-2">
            View
            <span className="transition-transform group-open:rotate-180">
              ▼
            </span>
          </summary>

          <div className="mt-2 p-3 bg-indigo-50 border rounded-lg">
            {r.paper_affiliations?.length ? (
              <ul className="list-disc list-inside text-sm space-y-1">
                {r.paper_affiliations.map((inst, idx) => (
                  <li key={idx}>{inst}</li>
                ))}
              </ul>
            ) : (
              "No affiliations"
            )}
          </div>
        </details>
      ),
    },

    {
      key: "abstract",
      header: "Abstract",
      render: (r) => (
        <details className="group">
          <summary className="cursor-pointer text-green-600 font-medium flex items-center gap-2">
            View
            <span className="transition-transform group-open:rotate-180">
              ▼
            </span>
          </summary>

          <div className="mt-2 p-3 bg-green-50 border rounded-lg max-w-md text-sm whitespace-pre-wrap">
            {r.abstract}
          </div>
        </details>
      ),
    },

    {
      key: "pdf",
      header: "PDF",
      render: (r) =>
        r.pdf_url ? (
          <a
            href={r.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition"
          >
            Open PDF
          </a>
        ) : (
          "N/A"
        ),
    },
  ];

  if (loading) {
    return (
      <div className="p-20 text-center">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-20 text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Papers"
          value={stats.total}
        />

        <StatsCard
          label="Reviewers"
          value={stats.reviewers}
        />

        <StatsCard
          label="Submitted"
          value={stats.submitted}
        />

        <StatsCard
          label="Under Review"
          value={stats.assigned}
        />
      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Platform Submissions
            </h3>

            <p className="text-sm text-gray-500">
              Manage and review submitted papers
            </p>
          </div>

          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            className="w-full lg:w-80 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <DataTable
          columns={columns}
          rows={currentPapers}
          rowKey="id"
        />

        {filteredPapers.length > itemsPerPage && (
          <div className="mt-6 pt-4 border-t flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(
                indexOfLastItem,
                filteredPapers.length
              )}{" "}
              of {filteredPapers.length}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.max(1, p - 1)
                  )
                }
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-40"
              >
                Previous
              </button>

              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                {currentPage}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(totalPages, p + 1)
                  )
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}