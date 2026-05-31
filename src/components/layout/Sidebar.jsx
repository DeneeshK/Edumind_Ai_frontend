import {
  BookOpen,
  Gauge,
  Home,
  LogIn,
  LogOut,
  NotebookTabs,
  PanelLeftClose,
  PlusCircle,
  ShieldCheck,
  X
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const links = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/study-assistant", label: "Study Assistant", icon: NotebookTabs },
  { to: "/courses/new", label: "New Course", icon: PlusCircle },
  { to: "/progress", label: "Progress", icon: Gauge },
  { to: "/debug", label: "Debug", icon: ShieldCheck }
];

function getInitials(user) {
  const name = user?.name || user?.email || "Student";
  return name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SidebarContent({
  collapsed = false,
  onNavigate,
  onToggleCollapsed,
  showCollapseButton = false,
  showCloseButton = false,
  onClose
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const displayName = user?.name || user?.email || "Student";
  const displayEmail = user?.email || "Ready to learn";
  const avatarUrl = user?.avatar_url || user?.avatar || user?.picture || user?.photoURL;

  async function handleLogout() {
    try {
      await logout();
    } finally {
      onNavigate?.();
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`mb-9 flex gap-3 ${collapsed ? "justify-center" : "items-center justify-between"}`}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg bg-mint text-lg font-black tracking-normal text-white transition hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-mint/40"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            E
          </button>
        ) : (
          <Link
            to="/dashboard"
            onClick={onNavigate}
            className="flex min-w-0 items-center gap-1 rounded-lg px-2 py-1 transition hover:bg-mint/5"
            title="EduMind.ai"
            aria-label="EduMind.ai dashboard"
          >
            <span className="truncate text-3xl font-black tracking-normal text-slate-100">EduMind</span>
            <span className="text-3xl font-black tracking-normal text-mint">.ai</span>
          </Link>
        )}
        {showCollapseButton && !collapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-mint/10 hover:text-mint"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        )}
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-mint/10 hover:text-mint"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className={`space-y-2 ${collapsed ? "flex flex-col items-center" : ""}`} aria-label="Main navigation">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            aria-label={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex h-11 items-center rounded-lg text-sm font-semibold transition ${
                collapsed ? "w-11 justify-center px-0" : "w-full gap-3 px-3"
              } ${
                isActive
                  ? "bg-mint/10 text-mint"
                  : "text-slate-100 hover:bg-panel2 hover:text-mint"
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className={collapsed ? "sr-only" : "truncate"}>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={`mt-auto border-t border-line pt-5 ${collapsed ? "flex flex-col items-center gap-3" : "space-y-3"}`}>
        <div
          className={`flex min-w-0 rounded-lg ${
            collapsed ? "justify-center" : "items-center gap-3 bg-panel2/70 p-3"
          }`}
          title={`${displayName}${user?.email ? ` - ${user.email}` : ""}`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mint/10 text-sm font-bold text-mint ring-1 ring-mint/20">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              getInitials(user)
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-100">{displayName}</div>
              <div className="truncate text-xs text-slate-500">{displayEmail}</div>
            </div>
          )}
        </div>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleLogout}
            className={`inline-flex items-center rounded-lg text-sm font-semibold text-slate-300 transition hover:bg-mint/10 hover:text-mint ${
              collapsed ? "h-11 w-11 justify-center" : "w-full gap-3 px-3 py-2.5"
            }`}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={collapsed ? "sr-only" : "truncate"}>Log out</span>
          </button>
        ) : (
          <Link
            to="/login"
            onClick={onNavigate}
            className={`inline-flex items-center rounded-lg text-sm font-semibold text-slate-300 transition hover:bg-mint/10 hover:text-mint ${
              collapsed ? "h-11 w-11 justify-center" : "w-full gap-3 px-3 py-2.5"
            }`}
            title="Log in"
            aria-label="Log in"
          >
            <LogIn className="h-5 w-5 shrink-0" />
            <span className={collapsed ? "sr-only" : "truncate"}>Log in</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({
  collapsed = false,
  mobileOpen = false,
  onMobileClose,
  onToggleCollapsed
}) {
  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden h-screen shrink-0 overflow-x-hidden overflow-y-auto border-r border-line bg-white/95 py-7 shadow-sm transition-all duration-300 ease-in-out lg:flex ${
          collapsed ? "w-16 px-2" : "w-72 px-6"
        }`}
        aria-label="Primary navigation"
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapsed={onToggleCollapsed}
          showCollapseButton
        />
      </aside>
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onMobileClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-line bg-white px-5 py-5 shadow-2xl transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigation menu"
      >
        <SidebarContent
          onNavigate={onMobileClose}
          onClose={onMobileClose}
          showCloseButton
        />
      </aside>
    </>
  );
}
