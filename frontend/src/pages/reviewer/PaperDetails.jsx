import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api"; // 🛠️ Changed from axios to your configured api instance

export default function ReviewerPaperDetails() {
  // Ensure this matches the parameter name in your App.js route 
  // (e.g., <Route path="/reviewer/paper/:paperId" ... />)
  const { paperId } = useParams();
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchPaperDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/reviewers/paper/${paperId}/`);

        if (res.data && res.data.status) {
          setPaper(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching paper details:", err);
        setPaper(null);
      } finally {
        setLoading(false);
      }
    };

    if (paperId) {
      fetchPaperDetails();
    }
  }, [paperId]);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500 font-medium">
        Loading paper details...
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-center">
        <p className="text-gray-600">Paper not found or not assigned to you.</p>
        <Link to="/reviewer/assigned" className="mt-4 text-blue-600 inline-block">
          Return to List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 📄 Paper Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">
            ID: {paper.paper_id}
          </span>
          <span className="text-xs text-gray-400 italic">
            Double-blind: Author details hidden
          </span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 leading-tight">
          {paper.paper_title}
        </h2>

        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Abstract</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {paper.paper_abstract}
          </p>
        </div>
      </div>

      {/* 📦 Actions Card */}
      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-800">Reviewer Actions</h3>
            <p className="text-xs text-gray-500">Download the manuscript and submit your final score.</p>
          </div>

          {/* 🔗 PDF Download */}
          <a
            href={paper.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto text-center rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all"
          >
            Open PDF
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-50 flex flex-wrap gap-4">
          {/* ⚡ Submit Review */}
          <button
            className="flex-1 sm:flex-none rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-black transition-colors"
            onClick={() => navigate(`/reviewer/review/${paper.paper_id}`)}
          >
            Submit Review
          </button>

          {/* Conflict button */}
          <button
            className="flex-1 sm:flex-none rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={() => setMsg("Conflict reporting has been logged. Please contact the administrator.")}
          >
            Declare Conflict
          </button>

          <Link
            className="flex-1 sm:flex-none text-center rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            to="/reviewer/assigned"
          >
            Back
          </Link>
        </div>

        {/* ⚠️ Message Notification */}
        {msg && (
          <div className="mt-6 rounded-xl bg-yellow-50 border border-yellow-100 px-4 py-3 text-sm text-yellow-800 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}