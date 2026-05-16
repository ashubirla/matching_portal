import React, { useEffect, useState } from "react";
import StatsCard from "../../components/StatsCard";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { Link } from "react-router-dom";
import api from "../api"; 

export default function AuthorDashboard() {
  const [papers, setPapers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    assigned: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/papers/");
        
        if (res.data && res.data.status) {
          setPapers(res.data.papers || []);
          setStats(res.data.counts || { total: 0, submitted: 0, assigned: 0 });
        }
      } catch (err) {
        console.error("Author Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorData(); 
  }, []);

  const columns = [
    { 
      key: "id", 
      header: "ID",
      render: (r) => <span className="text-gray-500 font-mono text-xs">#{r.id}</span>
    },
    { 
      key: "title", 
      header: "Title",
      render: (r) => <span className="font-medium text-gray-800">{r.title}</span>
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "action",
      header: "Action",
      render: (r) => (
        <Link
          className="text-blue-600 font-bold hover:underline"
          to={`/author/submissions/${r.id}`}
        >
          View
        </Link>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400 italic">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard label="Total Submissions" value={stats.total} />
        <StatsCard label="Successfully Submitted" value={stats.submitted} />
        <StatsCard label="Under Review" value={stats.assigned} />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">My Recent Submissions</h3>
          <Link 
            to="/author/submit" 
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            + New Submission
          </Link>
        </div>

        {papers.length > 0 ? (
          <DataTable columns={columns} rows={papers.slice(0, 5)} rowKey="id" />
        ) : (
          <div className="py-20 text-center text-gray-400 border-2 border-dashed border-gray-50 rounded-2xl">
            <div className="text-3xl mb-2">📄</div>
            <p>You haven't submitted any papers yet.</p>
            <Link to="/author/submit" className="text-blue-600 text-sm underline mt-2 inline-block">
              Submit your first paper
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}