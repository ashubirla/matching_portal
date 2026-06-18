import React, { useState } from "react";
import api from "../api";
import { Plus, X } from "lucide-react";

export default function SubmitPaper() {
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  const [authors, setAuthors] = useState([
    { name: "" },
  ]);

  const [affiliations, setAffiliations] = useState([
    "",
  ]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const addAuthor = () => {
    setAuthors([
      ...authors,
      { name: "" },
    ]);
  };

  const removeAuthor = (index) => {
    setAuthors(
      authors.filter(
        (_, i) => i !== index
      )
    );
  };

  const addAffiliation = () => {
    setAffiliations([
      ...affiliations,
      "",
    ]);
  };

  const removeAffiliation = (
    index
  ) => {
    setAffiliations(
      affiliations.filter(
        (_, i) => i !== index
      )
    );
  };

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = {
        title,
        abstract,
        pdf_url: pdfUrl,

        authors: authors.filter(
          (a) => a.name.trim()
        ),

        affiliations:
          affiliations.filter(
            (a) => a.trim()
          ),
      };

      await api.post(
        "/api/papers/create/",
        payload
      );

      setMessage(
        "✅ Paper submitted successfully!"
      );

      setTitle("");
      setAbstract("");
      setPdfUrl("");

      setAuthors([
        { name: "" },
      ]);

      setAffiliations([
        "",
      ]);
    } catch (error) {
      console.error(error);

      setMessage(
        "❌ Failed to submit paper"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Submit Paper
        </h1>

        <p className="text-gray-500 mb-8">
          Upload paper information for
          review.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Paper Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Enter paper title"
              required
            />
          </div>

          {/* Abstract */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Abstract
            </label>

            <textarea
              rows={8}
              value={abstract}
              onChange={(e) =>
                setAbstract(
                  e.target.value
                )
              }
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Enter paper abstract"
              required
            />
          </div>

          {/* Authors */}
          <div className="border rounded-2xl p-5">

            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">
                Authors
              </h2>

              <button
                type="button"
                onClick={addAuthor}
                className="flex items-center gap-2 text-blue-600"
              >
                <Plus size={16} />
                Add Author
              </button>
            </div>

            <div className="space-y-3">
              {authors.map(
                (
                  author,
                  index
                ) => (
                  <div
                    key={index}
                    className="flex gap-3"
                  >
                    <input
                      type="text"
                      value={
                        author.name
                      }
                      onChange={(
                        e
                      ) => {
                        const updated =
                          [
                            ...authors,
                          ];

                        updated[
                          index
                        ].name =
                          e.target.value;

                        setAuthors(
                          updated
                        );
                      }}
                      placeholder="Author Name"
                      className="flex-1 border rounded-xl px-4 py-3"
                    />

                    {authors.length >
                      1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeAuthor(
                              index
                            )
                          }
                          className="text-red-500"
                        >
                          <X />
                        </button>
                      )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Institutions */}
          <div className="border rounded-2xl p-5">

            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">
                Institutions
              </h2>

              <button
                type="button"
                onClick={
                  addAffiliation
                }
                className="flex items-center gap-2 text-blue-600"
              >
                <Plus size={16} />
                Add Institution
              </button>
            </div>

            <div className="space-y-3">
              {affiliations.map(
                (
                  affiliation,
                  index
                ) => (
                  <div
                    key={index}
                    className="flex gap-3"
                  >
                    <input
                      type="text"
                      value={
                        affiliation
                      }
                      onChange={(
                        e
                      ) => {
                        const updated =
                          [
                            ...affiliations,
                          ];

                        updated[
                          index
                        ] =
                          e.target.value;

                        setAffiliations(
                          updated
                        );
                      }}
                      placeholder="Institution Name"
                      className="flex-1 border rounded-xl px-4 py-3"
                    />

                    {affiliations.length >
                      1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeAffiliation(
                              index
                            )
                          }
                          className="text-red-500"
                        >
                          <X />
                        </button>
                      )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* PDF URL */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              PDF URL
            </label>

            <input
              type="url"
              value={pdfUrl}
              onChange={(e) =>
                setPdfUrl(
                  e.target.value
                )
              }
              placeholder="https://example.com/paper.pdf"
              className="w-full border rounded-xl px-4 py-3"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl transition"
          >
            {loading
              ? "Submitting..."
              : "Submit Paper"}
          </button>

          {message && (
            <div className="text-center font-medium">
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}