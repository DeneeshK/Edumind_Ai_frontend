import { useState } from "react";
import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppShell() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="notebook-grid flex min-h-screen overflow-x-hidden text-slate-100">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex items-center border-b border-line bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-slate-100 transition hover:bg-mint/10 hover:text-mint"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
            <span>
              EduMind<span className="text-mint">.ai</span>
            </span>
          </button>
        </div>
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
