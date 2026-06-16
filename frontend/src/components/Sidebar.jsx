import React from "react";
import { NavLink } from "react-router-dom";

function Item({ to, label, icon, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center ${collapsed ? "justify-center" : "gap-3"
        } rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive
          ? "bg-gray-900 text-white shadow-sm"
          : "text-gray-700 hover:bg-gray-100"
        }`
      }
      title={collapsed ? label : ""}
    >
      <span className="text-base">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

export default function Sidebar({
  role,
  open,
  onClose,
  collapsed,
  setCollapsed,
}) {
  const menus = {
    author: [
      {
        to: "/author/dashboard",
        label: "Dashboard",
        icon: "📊",
      },
      {
        to: "/author/submit",
        label: "Submit Paper",
        icon: "📄",
      },
      {
        to: "/author/submissions",
        label: "My Submissions",
        icon: "📚",
      },
    ],

    reviewer: [
      {
        to: "/reviewer/dashboard",
        label: "Dashboard",
        icon: "🔍",
      },
    ],

    admin: [
      {
        to: "/admin/dashboard",
        label: "Submitted Papers",
        icon: "📄",
      },
      {
        to: "/admin/reviewers",
        label: "Review Committee",
        icon: "👨‍🔬",
      },
      {
        to: "/admin/assign",
        label: "Paper Assignment",
        icon: "📌",
      },
      {
        to: "/admin/assignmentDashboard",
        label: "Show Assignments",
        icon: "📈",
      },
    ],
  };

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-40 h-full
          ${collapsed ? "w-20" : "w-72"}
          border-r border-gray-200 bg-white
          transition-all duration-300
          md:translate-x-0 md:static
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="border-b px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="overflow-hidden">
              {!collapsed && (
                <h2 className="text-lg font-bold text-gray-900">
                  {role?.toUpperCase()}
                </h2>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Desktop Collapse Toggle */}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 transition"
              >
                {collapsed ? "→" : "←"}
              </button>

              {/* Mobile Close Button */}
              <button
                className="md:hidden rounded-lg border px-3 py-2 text-sm"
                onClick={onClose}
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4">
          {!collapsed && (
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Navigation
            </div>
          )}

          <div className="space-y-2">
            {(menus[role] || []).map((item) => (
              <Item
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                collapsed={collapsed}
              />
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}