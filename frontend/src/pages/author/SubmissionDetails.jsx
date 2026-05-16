import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import StatusBadge from "../../components/StatusBadge";

export default function SubmissionDetails() {
  const { paperId } = useParams();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaper = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/papers/${paperId}/`);
        setPaper(res.data); 
      } catch (err) {
        console.error("Error fetching paper detail:", err);
      } finally {
        setLoading(false);
      }
    };

    if (paperId) fetchPaper();
  }, [paperId]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center font-medium text-gray-500">
        Loading paper details...
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
        Paper not found or you don't have permission to view it.
        <div className="mt-4">
          <Link to="/author/submissions" className="text-sm font-bold underline">Go Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Submission ID: {paper.id}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{paper.title}</h2>
        </div>
        <StatusBadge status={paper.status} />
      </div>
      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="space-y-6">
          {/* Abstract */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-tight">Abstract</h3>
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl">
              {paper.abstract}
            </p>
          </div>

          {/* Keywords */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-tight">Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {paper.keywords?.map((k, index) => (
                <span key={index} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200">
                  {k}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-tight">Author List</h3>
            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
              {paper.author_names?.join(", ") || "No authors listed"}
            </div>
          </div>
          <div className="pt-6 border-t border-gray-50 flex flex-wrap gap-3">
            <a
              href={paper.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
            >
              Download PDF
            </a>

            <Link
              to="/author/submissions"
              className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Back to Submissions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}