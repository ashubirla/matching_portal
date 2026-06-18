import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");

    if (!token) return;

    fetch("http://127.0.0.1:8000/api/auth/verify_token/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        navigate("/author/dashboard");
      })
      .catch(() => {
        fetch("http://127.0.0.1:8000/api/auth/token/refresh/", {
          refresh: refresh,
        })
          .then((res) => {
            localStorage.setItem("access", res.access);
          })
          .catch(() => {
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
          });
      });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-12">

        {/* HERO */}
        <section className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-12 shadow-xl">
          <div className="text-xs uppercase tracking-widest text-indigo-200">
            ACM SIGMOD Conference
          </div>

          <h1 className="mt-4 text-4xl md:text-5xl font-bold leading-tight">
            SIGMOD 2026
          </h1>

          <h2 className="mt-2 text-xl md:text-2xl text-indigo-200">
            International Conference on Management of Data
          </h2>

          <p className="mt-6 max-w-3xl text-indigo-100 leading-relaxed">
            SIGMOD 2026 is a premier international forum for database
            researchers, practitioners, and developers to explore innovations in
            data management, scalable systems, and data-driven applications.
          </p>

          <div className="mt-4 text-sm text-indigo-200">
            📍 Bangalore, India • 🗓 June 2026
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/login"
              className="rounded-xl bg-white text-indigo-900 px-6 py-3 text-sm font-semibold hover:bg-gray-100 transition"
            >
              Author / Reviewer Login
            </Link>

            {/* <Link
              to="/register"
              className="rounded-xl border border-white px-6 py-3 text-sm font-semibold hover:bg-white hover:text-indigo-900 transition"
            >
              Submit Paper
            </Link> */}

            <Link
              to="/adminlogin"
              className="rounded-xl bg-black/30 px-6 py-3 text-sm font-semibold hover:bg-black/50 transition"
            >
              Admin
            </Link>
          </div>
        </section>

        {/* IMPORTANT DATES */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Important Dates
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              ["Abstract Deadline", "Jan 15, 2026"],
              ["Paper Submission", "Jan 22, 2026"],
              ["Notification", "Apr 10, 2026"],
              ["Conference", "June 2026"],
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-6 shadow hover:shadow-lg transition"
              >
                <div className="text-sm text-gray-500">{item[0]}</div>
                <div className="mt-2 text-lg font-semibold text-indigo-700">
                  {item[1]}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CALL FOR PAPERS */}
        <section className="mt-12 bg-white rounded-3xl p-10 shadow">
          <h2 className="text-2xl font-semibold text-gray-800">
            Call for Research Papers
          </h2>

          <p className="mt-4 text-gray-600 max-w-3xl">
            We invite submissions describing original research contributions to
            the theory and practice of data management.
          </p>

          <div className="mt-6 grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            {[
              "Query Processing & Optimization",
              "Database Systems & Storage Engines",
              "Distributed Data Systems",
              "Cloud & Edge Data Management",
              "Data Mining & Analytics",
              "Data Privacy & Security",
              "Graph & Stream Processing",
              "AI for Data Management",
            ].map((topic, i) => (
              <div
                key={i}
                className="bg-slate-50 rounded-xl px-4 py-3 border"
              >
                {topic}
              </div>
            ))}
          </div>
        </section>

        {/* REVIEW + PROCESS */}
        <section className="mt-12 grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 shadow">
            <h2 className="text-xl font-semibold text-gray-800">
              Review Process
            </h2>

            <ul className="mt-4 space-y-3 text-gray-600 text-sm">
              <li>✔ Double-blind reviewing</li>
              <li>✔ Multiple expert reviewers per paper</li>
              <li>✔ Rebuttal phase for authors</li>
              <li>✔ Program committee discussions</li>
              <li>✔ Final meta-review decision</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow">
            <h2 className="text-xl font-semibold text-gray-800">
              Submission Flow
            </h2>

            <div className="mt-6 flex items-center justify-between text-xs text-gray-600">
              {["Submit", "Review", "Rebuttal", "Decision"].map((step, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 text-white">
                    {i + 1}
                  </div>
                  <span className="mt-2">{step}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 h-1 bg-gray-200 relative">
              <div className="absolute top-0 left-0 h-1 w-full bg-indigo-600"></div>
            </div>
          </div>
        </section>



        {/* FOOTER */}
        <footer className="mt-16 text-center text-sm text-gray-500">
          © SIGMOD 2026 · ACM Special Interest Group on Management of Data
          <div className="mt-1">contact@sigmod2026.org</div>
        </footer>

      </div>
    </div>
  );
}