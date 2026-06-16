
import React, { useState, useEffect } from "react";
import api from "../api";

export default function AdminAssign() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [crossJoinReady, setCrossJoinReady] = useState(false);

  const [selectedAlgorithm, setSelectedAlgorithm] = useState("");
  const [selectedEdgeWeight, setSelectedEdgeWeight] = useState("");

  useEffect(() => {
    async function checkTable() {
      try {
        const res = await api.get(
          "/api/check_edge_weight_table/"
        );

        if (res.data.doesExist) {
          setCrossJoinReady(true);
        }
      } catch (err) {
        console.error(
          "Error checking table:",
          err
        );
      }
    }

    checkTable();
  }, []);

  // ----------------------------------
  // Soft Paper-Reviewer Edge Weights
  // ----------------------------------

  async function generateCrossJoin() {
    if (crossJoinReady) {
      const confirmAction = window.confirm(
        "Edge weights already exist. Regenerating will overwrite existing data. Continue?"
      );

      if (!confirmAction) return;
    }

    setLoading(true);

    try {
      const res = await api.post(
        "/api/run_edge_weights/"
      );

      console.log(
        "Paper-Reviewer Soft Weights:",
        res.data
      );

      setCrossJoinReady(true);

      alert(
        "Paper-Reviewer (Soft Constraint) edge weights generated successfully."
      );
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
        "Failed to generate edge weights."
      );
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------------
  // Hard Paper-Reviewer Edge Weights
  // ----------------------------------

  async function generateHardSimilarityWeights() {
    setLoading(true);

    try {
      const res = await api.post(
        "/api/run_edge_weights_hard/"
      );

      console.log(
        "Paper-Reviewer Hard Weights:",
        res.data
      );

      alert(
        "Paper-Reviewer (Hard Constraint) edge weights generated successfully."
      );
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
        "Failed to generate hard constraint edge weights."
      );
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------------
  // Reviewer-Reviewer Edge Weights
  // ----------------------------------

  async function generateReviewerEdgeWeights() {
    setLoading(true);

    try {
      const res = await api.post(
        "/api/run_reviewer_edge_weights/"
      );

      console.log(
        "Reviewer-Reviewer Weights:",
        res.data
      );

      alert(
        "Reviewer-Reviewer edge weights generated successfully."
      );
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
        "Failed to generate reviewer-reviewer edge weights."
      );
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------------
  // Algorithms
  // ----------------------------------

  async function runAlgorithm(algoKey) {
    setLoading(true);
    setResult(null);

    try {
      let endpoint = "";

      switch (algoKey) {
        case "ILP":
          endpoint = "/api/run_ilp/";
          break;

        case "LP_with_iterative_rounding":
          endpoint =
            "/api/run_lp_with_iterative_rounding/";
          break;

        case "NF":
          endpoint = "/api/run_network_flow/";
          break;

        case "IA":
          endpoint =
            "/api/iterative_assignment/";
          break;

        default:
          throw new Error(
            "Invalid algorithm selected"
          );
      }

      const res = await api.post(endpoint);

      console.log(
        "Algorithm Result:",
        res.data
      );

      setResult(res.data);
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
        "Algorithm execution failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="
        max-w-6xl
        mx-auto
        rounded-3xl
        border
        bg-white
        p-8
        shadow-lg
        space-y-8
      "
    >
      {/* Header */}

      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Reviewer Assignment Dashboard
        </h2>

        <p className="text-gray-500 mt-2">
          Generate edge weights and run
          reviewer assignment algorithms.
        </p>
      </div>

      {/* Main Cards */}

      <div className="grid md:grid-cols-2 gap-6">

        {/* Edge Weight Generation */}

        <div className="border rounded-3xl p-6 bg-gray-50 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Edge Weight Generation
          </h3>

          <select
            value={selectedEdgeWeight}
            onChange={(e) =>
              setSelectedEdgeWeight(
                e.target.value
              )
            }
            className="
              w-full
              rounded-xl
              border
              border-gray-300
              p-3
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
            "
          >
            <option value="">
              Select Edge Weight Type
            </option>

            <option value="paperReviewer">
              Paper → Reviewer Edge Weights (Soft Constraint)
            </option>

            <option value="paperReviewerHard">
              Paper → Reviewer Edge Weights (Hard Constraint)
            </option>

            <option value="reviewerReviewer">
              Reviewer → Reviewer Edge Weights
            </option>
          </select>

          <button
            disabled={
              !selectedEdgeWeight || loading
            }
            onClick={() => {
              switch (selectedEdgeWeight) {
                case "paperReviewer":
                  generateCrossJoin();
                  break;

                case "paperReviewerHard":
                  generateHardSimilarityWeights();
                  break;

                case "reviewerReviewer":
                  generateReviewerEdgeWeights();
                  break;

                default:
                  break;
              }
            }}
            className={`
              w-full
              py-3
              rounded-xl
              text-white
              font-medium
              transition
              ${!selectedEdgeWeight || loading
                ? "bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700"
              }
            `}
          >
            Generate
          </button>

          {crossJoinReady && (
            <div className="text-green-600 text-sm font-medium">
              ✔ Paper-Reviewer edge weight table detected
            </div>
          )}
        </div>

        {/* Algorithm Card */}

        <div className="border rounded-3xl p-6 bg-gray-50 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Assignment Algorithms
          </h3>

          <select
            value={selectedAlgorithm}
            onChange={(e) =>
              setSelectedAlgorithm(
                e.target.value
              )
            }
            className="
              w-full
              rounded-xl
              border
              border-gray-300
              p-3
              focus:outline-none
              focus:ring-2
              focus:ring-gray-700
            "
          >
            <option value="">
              Select Algorithm
            </option>

            <option value="ILP">
              Integer Linear Programming (ILP)
            </option>

            <option value="LP_with_iterative_rounding">
              LP with Iterative Rounding
            </option>

            <option value="NF">
              Network Flow
            </option>

            <option value="IA">
              Iterative Assignment
            </option>
          </select>

          <button
            disabled={
              !selectedAlgorithm || loading
            }
            onClick={() =>
              runAlgorithm(
                selectedAlgorithm
              )
            }
            className={`
              w-full
              py-3
              rounded-xl
              text-white
              font-medium
              transition
              ${!selectedAlgorithm || loading
                ? "bg-gray-400"
                : "bg-gray-900 hover:bg-black"
              }
            `}
          >
            Run Algorithm
          </button>
        </div>
      </div>

      {/* Loading State */}

      {loading && (
        <div className="flex items-center gap-3 text-blue-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>

          <span>
            Processing... This may take several
            minutes depending on dataset size.
          </span>
        </div>
      )}

      {/* Results */}

      {Array.isArray(result) &&
        result.length > 0 && (
          <div className="border rounded-3xl p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">
              Assignment Results
            </h3>

            <div className="space-y-3">
              {result.map((r) => (
                <div
                  key={r.id}
                  className="
                    border
                    rounded-xl
                    bg-white
                    p-4
                  "
                >
                  <div className="font-medium">
                    {r.id}
                  </div>

                  <div className="text-sm text-gray-600 mt-1">
                    {r.assignedReviewers?.join(
                      ", "
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}