import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import axios from "axios";
import { X, Plus, Upload, GraduationCap } from "lucide-react";
import collegesData from "../../data/colleges.json";
import researchDomainsData from "../../data/researchDomains.json";

function formatDomainLabel(domain) {
  return domain.replaceAll("_", " ");
}

export default function SubmitPaper() {
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [research_domain, setResearchDomain] = useState("");
  const [pdf, setPdf] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [authors, setAuthors] = useState([{ name: "", institute: "" }]);
  const [openInstituteIndex, setOpenInstituteIndex] = useState(null);
  const instituteRefs = useRef([]);

  const collegeOptions = useMemo(() => {
    return (collegesData?.institutes || []).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const researchDomainMap = researchDomainsData?.cs_domains || {};
  const subjectAreaOptions = useMemo(() => Object.keys(researchDomainMap), [researchDomainMap]);

  // Handle keyword addition on comma or enter
  const handleKeywordKeyDown = (e) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      const val = keywordInput.trim().replace(",", "");
      if (val && !keywords.includes(val)) {
        setKeywords([...keywords, val]);
        setKeywordInput("");
      }
    }
  };

  const removeKeyword = (tag) => setKeywords(keywords.filter((k) => k !== tag));

  const handleInstituteSelect = (index, collegeName) => {
    const updatedAuthors = [...authors];
    updatedAuthors[index].institute = collegeName;
    setAuthors(updatedAuthors);
    setOpenInstituteIndex(null);
  };

  const addAuthor = () => setAuthors([...authors, { name: "", institute: "" }]);
  const removeAuthor = (index) => setAuthors(authors.filter((_, i) => i !== index));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (!pdf) return alert("Please select a PDF first.");
      if (keywords.length === 0) return alert("Please add at least one keyword.");
      const authRes = await api.get("/api/files/upload_auth/");
      const { token, signature, expire, publicKey } = authRes.data;
      const formData = new FormData();
      formData.append("file", pdf);
      formData.append("fileName", `paper_${Date.now()}.pdf`);
      formData.append("token", token);
      formData.append("signature", signature);
      formData.append("expire", expire);
      formData.append("publicKey", publicKey);
      formData.append("folder", "/Research_Papers");

      const uploadRes = await axios.post("https://upload.imagekit.io/api/v1/files/upload", formData);


      await api.post("/api/papers/create/", {
        title,
        abstract,
        keywords,
        research_domain: [research_domain],
        pdf_url: uploadRes.data.url,
        authors: authors,
      });

      setMsg("✅ Paper submitted successfully! Redirecting to dashboard...");
      setTimeout(() => (window.location.href = "/author/submissions"), 2000);
    } catch (err) {
      console.error(err);
      alert("Submission failed. Check console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Submit New Paper</h2>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          {/* Metadata */}
          <input
            className="w-full rounded-xl border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            placeholder="Full Paper Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            className="w-full rounded-xl border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            rows={5}
            placeholder="Abstract (Summarize your research objective and findings)"
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            required
          />

          <select
            className="w-full rounded-xl border-gray-200 px-4 py-3 text-sm bg-white outline-none"
            value={research_domain}
            onChange={(e) => setResearchDomain(e.target.value)}
            required
          >
            <option value="">Select Research Domain</option>
            {subjectAreaOptions.map((d) => (
              <option key={d} value={d}>{formatDomainLabel(d)}</option>
            ))}
          </select>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {keywords.map((k) => (
                <span key={k} className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-100">
                  {k} <X size={12} className="cursor-pointer" onClick={() => removeKeyword(k)} />
                </span>
              ))}
            </div>
            <input
              className="w-full rounded-xl border-gray-200 px-4 py-3 text-sm outline-none"
              placeholder="Add Keywords (Press Enter or Comma)"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={handleKeywordKeyDown}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Author Details</h3>
          {authors.map((author, index) => (
            <div key={index} className="relative flex flex-col sm:flex-row gap-3">
              <input
                className="flex-1 rounded-xl border-gray-200 px-4 py-3 text-sm"
                placeholder="Author Name"
                value={author.name}
                onChange={(e) => {
                  const updated = [...authors];
                  updated[index].name = e.target.value;
                  setAuthors(updated);
                }}
                required
              />
              <div className="flex-1 relative" ref={(el) => (instituteRefs.current[index] = el)}>
                <input
                  className="w-full rounded-xl border-gray-200 px-4 py-3 text-sm"
                  placeholder="Institute/College"
                  value={author.institute}
                  onFocus={() => setOpenInstituteIndex(index)}
                  onChange={(e) => {
                    const updated = [...authors];
                    updated[index].institute = e.target.value;
                    setAuthors(updated);
                    setOpenInstituteIndex(index);
                  }}
                  required
                />
                {openInstituteIndex === index && (
                  <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-xl border bg-white shadow-xl">
                    {collegeOptions
                      .filter((c) => c.name.toLowerCase().includes(author.institute.toLowerCase()))
                      .map((c) => (
                        <div
                          key={c.name}
                          className="cursor-pointer p-3 text-xs hover:bg-blue-50"
                          onClick={() => handleInstituteSelect(index, c.name)}
                        >
                          <div className="font-bold">{c.name}</div>
                          <div className="text-gray-400">{c.country}</div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              {authors.length > 1 && (
                <button type="button" onClick={() => removeAuthor(index)} className="text-red-400 hover:text-red-600 px-2">
                  <X size={18} />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addAuthor} className="flex items-center gap-2 text-blue-600 text-sm font-bold">
            <Plus size={16} /> Add Another Author
          </button>
        </div>

        {/* PDF Upload Area */}
        <div className="relative">
          <input
            id="pdfUpload"
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdf(e.target.files?.[0] || null)}
            className="hidden"
          />
          <label
            htmlFor="pdfUpload"
            className={`cursor-pointer flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all ${
              pdf ? "border-green-500 bg-green-50" : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
            }`}
          >
            <Upload className={`mb-3 ${pdf ? "text-green-600" : "text-gray-400"}`} />
            <span className="text-sm font-medium text-gray-600">
              {pdf ? `Selected: ${pdf.name}` : "Click to upload paper (PDF only)"}
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-2xl py-4 text-sm font-bold text-white transition-all ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"
          }`}
        >
          {loading ? "Processing Submission..." : "Confirm & Submit Paper"}
        </button>

        {msg && <p className="text-center text-sm font-medium text-green-600">{msg}</p>}
      </form>
    </div>
  );
}