import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* Public Pages */
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

/* Route Protection */
import ProtectedRoute from "./routes/ProtectedRoute";

/* Author */
import AuthorLayout from "./pages/author/AuthorLayout";
import AuthorDashboard from "./pages/author/Dashboard";
import SubmitPaper from "./pages/author/SubmitPaper";
import AuthorSubmissions from "./pages/author/Submissions";
import SubmissionDetails from "./pages/author/SubmissionDetails";

/* Reviewer */
import ReviewerLayout from "./pages/reviewer/ReviewerLayout";
import ReviewerDashboard from "./pages/reviewer/Dashboard";
import ReviewerProfile from "./pages/reviewer/Profile";
import ReviewerAssigned from "./pages/reviewer/Assigned";
import ReviewerPaperDetails from "./pages/reviewer/PaperDetails";
import ReviewForm from "./pages/reviewer/ReviewForm";

/* Admin */
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSubmissions from "./pages/admin/Submissions";
import AdminReviewers from "./pages/admin/Reviewers";
import AdminAssign from "./pages/admin/Assign";
import AdminDecisions from "./pages/admin/Decisions";
import ShowAssignments from "./pages/admin/ShowAssignments";

/* NEW Assignment Dashboard */
import AssignmentDashboard from "./pages/admin/AssignmentDashboard";

/* Profile */
import EditProfile from "./pages/profile/EditProfile";

export default function App() {
  return (
    <Routes>
      {/* =======================================
          PUBLIC ROUTES
      ======================================= */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/adminlogin" element={<AdminLogin />} />
      <Route path="/register" element={<Register />} />

      {/* =======================================
          AUTHOR ROUTES
      ======================================= */}
      <Route
        path="/author/*"
        element={
          <ProtectedRoute allowedRoles={["author"]}>
            <AuthorLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AuthorDashboard />} />
        <Route path="submit" element={<SubmitPaper />} />
        <Route path="submissions" element={<AuthorSubmissions />} />
        <Route
          path="submissions/:paperId"
          element={<SubmissionDetails />}
        />
        <Route
          index
          element={<Navigate to="dashboard" replace />}
        />
      </Route>

      {/* =======================================
          REVIEWER ROUTES
      ======================================= */}
      <Route
        path="/reviewer/*"
        element={
          <ProtectedRoute allowedRoles={["reviewer"]}>
            <ReviewerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ReviewerDashboard />} />
        <Route path="profile" element={<ReviewerProfile />} />
        <Route path="assigned" element={<ReviewerAssigned />} />
        <Route
          path="paper/:paperId"
          element={<ReviewerPaperDetails />}
        />
        <Route
          path="review/:paperId"
          element={<ReviewForm />}
        />
        <Route
          index
          element={<Navigate to="dashboard" replace />}
        />
      </Route>

      {/* =======================================
          ADMIN ROUTES
      ======================================= */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Main Dashboard */}
        <Route
          path="dashboard"
          element={<AdminDashboard />}
        />

        {/* Papers */}
        <Route
          path="submissions"
          element={<AdminSubmissions />}
        />

        {/* Review Committee */}
        <Route
          path="reviewers"
          element={<AdminReviewers />}
        />

        {/* Reviewer Assignment Tool */}
        <Route
          path="assign"
          element={<AdminAssign />}
        />

        {/* Existing Assignments Page */}
        <Route
          path="assignments"
          element={<ShowAssignments />}
        />

        {/* NEW Assignment Dashboard */}
        <Route
          path="assignmentDashboard"
          element={<AssignmentDashboard />}
        />

        {/* Decisions */}
        <Route
          path="decisions"
          element={<AdminDecisions />}
        />

        <Route
          index
          element={<Navigate to="dashboard" replace />}
        />
      </Route>

      {/* =======================================
          PROFILE
      ======================================= */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute
            allowedRoles={[
              "author",
              "reviewer",
              "admin",
            ]}
          >
            <EditProfile />
          </ProtectedRoute>
        }
      />

      {/* =======================================
          404 PAGE
      ======================================= */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}