import { LayoutDashboard, ListTodo, CalendarDays, Sparkles, BarChart3, LogOut, Menu, X, ShieldAlert } from "lucide-react";
import { User } from "../types";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: User;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ currentTab, setCurrentTab, user, onLogout, isOpen, setIsOpen }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks", label: "Tasks", icon: ListTodo },
    { id: "schedule", label: "AI Schedule", icon: CalendarDays },
    { id: "recommendations", label: "Recommendations", icon: Sparkles },
    { id: "analytics", label: "Analytics", icon: BarChart3 }
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div id="mobile-header" className="md:hidden bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 py-3 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-amber-500 to-red-500 rounded-lg flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-slate-950" />
          </div>
          <span className="font-bold text-white text-base">Life Saver</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar overlay backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45 md:hidden"
        />
      )}

      {/* Sidebar navigation container */}
      <aside
        id="app-sidebar"
        className={`fixed md:sticky top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between h-screen transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 py-6">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 px-6 mb-8">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <ShieldAlert className="w-6 h-6 text-[#0a0e17]" />
            </div>
            <div>
              <h2 className="font-bold text-white leading-tight">Last-Minute</h2>
              <span className="text-xs text-amber-500 font-semibold tracking-wide">LIFE SAVER</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 px-4 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setIsOpen(false); // Close on mobile navigation
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all cursor-pointer focus:outline-none ${
                    isActive
                      ? "bg-slate-800 border-l-4 border-amber-500 text-amber-500 font-medium"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-amber-500" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile & signout panel at bottom */}
        <div className="px-6 py-4 border-t border-slate-800/80">
          <div className="bg-[#151b28] rounded-xl p-4 border border-slate-700/50 mb-3">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Profile</div>
            <div className="text-sm font-semibold text-white truncate" title={user.name}>{user.name}</div>
            <div className="text-[10px] text-teal-500 uppercase mt-2 flex items-center gap-1.5 font-bold">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span>System Online</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-red-500/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 text-xs font-semibold transition-colors cursor-pointer focus:outline-none"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
