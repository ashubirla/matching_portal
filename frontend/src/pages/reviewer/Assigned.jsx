import React, { useEffect, useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { Link } from "react-router-dom";
import api from "../api"; // 🛠️ Changed from axios to your custom api instance

export default function ReviewerAssigned() {
  const [pending, setPending] = useState([]);
  const [submitted, setSubmitted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setLoading(true);
        // Using the same api instance as AdminDashboard
        const res = await api.get("/api/reviewers/my-papers/");

        if (res.data && res.data.status) {
          setPending(res.data.pending_papers || []);
          setSubmitted(res.data.submitted_papers || []);
        }
      } catch (err) {
        console.error("Error fetching assigned papers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, []);

  const allPapers = useMemo(() => [...pending, ...submitted], [pending, submitted]);

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return allPapers.filter((p) => {
      const title = String(p.paper_title || "").toLowerCase();
      const id = String(p.paper_id || "").toLowerCase(); // Matches Serializer key
      return title.includes(query) || id.includes(query);
    });
  }, [allPapers, q]);

  const columns = [
    {
      key: "paper_id",
      header: "Paper ID"
    },
    {
      key: "paper_title",
      header: "Title"
    },
    {
      key: "reviewer_status",
      header: "Review Status",
      render: (r) => (
        <StatusBadge
          status={
            r.reviewer_status?.toLowerCase() === "submitted"
              ? "SubmittedReview"
              : "Pending"
          }
        />
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (r) => (
        <Link
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          to={`/reviewer/paper/${r.paper_id}`}
        >
          Open Detail
        </Link>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center font-medium text-gray-500">
        Loading assigned papers...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Assigned Papers</h2>
          <p className="text-sm text-gray-500">Search and manage your review queue</p>
        </div>

        <div className="relative">
          <input
            className="w-full sm:w-72 rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm"
            placeholder="Search by title or ID..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="p-2 bg-yellow-100">
          Total Papers: {filtered.length}
        </div>
        <DataTable columns={columns} rows={filtered} rowKey="id" />

        {allPapers.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            No papers have been assigned to you yet.
          </div>
        )}
      </div>
    </div>
  );
}