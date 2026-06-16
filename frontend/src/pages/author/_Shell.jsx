import React, { useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";

export function DashboardShell({ role, title, children }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title={title} onMenuClick={() => setOpen(true)} />

      <div className="flex w-full">
        <Sidebar
          role={role}
          open={open}
          onClose={() => setOpen(false)}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        <main
          className={`
            flex-1 p-6 md:p-8 transition-all duration-300
          `}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardShell;