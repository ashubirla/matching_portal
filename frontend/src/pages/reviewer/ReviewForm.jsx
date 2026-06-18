import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function ReviewForm() {
  const { paperId } = useParams();
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null);
  const [score, setScore] = useState("");
  const [comments, setComments] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPaper = async () => {
      try {
        setLoading(true);

        const res = await api.get(
          `/api/reviewers/paper/${paperId}/`
        );

        if (res.data?.status) {
          setPaper(res.data.data);
        }
      } catch (err) {
        console.error(
          "Paper Fetch Error:",
          err.response?.data || err
        );
        setPaper(null);
      } finally {
        setLoading(false);
      }
    };

    if (paperId) {
      fetchPaper();
    }
  }, [paperId]);

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const response = await api.post(
        `/api/reviewers/submit-review/${paperId}/`,
        {
          paper_score: Number(score),
          comments: comments,
        }
      );

      if (response.data?.status) {
        setMsg({
          text: "Review submitted successfully!",
          type: "success",
        });

        setTimeout(() => {
          navigate("/reviewer/assigned");
        }, 1500);
      }
    } catch (err) {
      console.error(
        "Submit Review Error:",
        err.response?.data || err
      );

      setMsg({
        text:
          err.response?.data?.error ||
          "Failed to submit review.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="text-lg text-gray-500">
          Loading review form...
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="bg-white rounded-2xl border p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-800">
          Paper not found
        </h2>

        <p className="mt-2 text-gray-500">
          This paper is either not assigned to you
          or no longer exists.
        </p>

        <Link
          to="/reviewer/assigned"
          className="inline-block mt-5 text-blue-600 hover:underline"
        >
          Back to Assigned Papers
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
            Paper #{paper.paper_id}
          </span>

          <span className="text-xs text-gray-500">
            Double Blind Review
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          {paper.paper_title}
        </h1>

        <div className="mt-5">
          <h3 className="font-semibold text-gray-800 mb-2">
            Abstract
          </h3>

          <div className="bg-gray-50 border rounded-xl p-4 text-sm text-gray-700 leading-relaxed max-h-64 overflow-y-auto">
            {paper.paper_abstract}
          </div>
        </div>

        {paper.pdf_url && (
          <div className="mt-5">
            <a
              href={paper.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-3 text-white font-medium hover:bg-blue-700 transition"
            >
              Open PDF
            </a>
          </div>
        )}
      </div>

      {/* Review Form */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Submit Review
        </h2>

        {msg.text && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium ${msg.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
              }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Paper Score
            </label>

            <select
              value={score}
              onChange={(e) =>
                setScore(e.target.value)
              }
              required
              className="w-full border rounded-xl px-4 py-3"
            >
              <option value="">
                Select Score
              </option>
              <option value="5">
                Accept (5)
              </option>
              <option value="4">
                Weak Accept (4)
              </option>
              <option value="3">
                Borderline (3)
              </option>
              <option value="2">
                Weak Reject (2)
              </option>
              <option value="1">
                Reject (1)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reviewer Comments
            </label>

            <textarea
              rows={8}
              value={comments}
              onChange={(e) =>
                setComments(e.target.value)
              }
              required
              placeholder="Provide detailed feedback for the authors..."
              className="w-full border rounded-xl px-4 py-3 resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : "Submit Review"}
            </button>

            <Link
              to={`/reviewer/paper/${paper.paper_id}`}
              className="px-6 py-3 rounded-xl border text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}