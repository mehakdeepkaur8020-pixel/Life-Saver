import { useState, useEffect } from "react";
import { ShieldAlert, Info, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import TasksPage from "./components/TasksPage";
import AISchedule from "./components/AISchedule";
import Recommendations from "./components/Recommendations";
import Analytics from "./components/Analytics";
import RescueModal from "./components/RescueModal";
import AuthPage from "./components/AuthPage";

import { Task, User, ScheduleSlot, RecommendationsResponse } from "./types";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("lifesaver_token"));
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [rescueTask, setRescueTask] = useState<Task | null>(null);

  // Lifted & persistent AI States
  const [schedule, setSchedule] = useState<ScheduleSlot[] | null>(() => {
    const saved = localStorage.getItem("lifesaver_schedule");
    return saved ? JSON.parse(saved) : null;
  });
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(() => {
    const saved = localStorage.getItem("lifesaver_recommendations");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (schedule) {
      localStorage.setItem("lifesaver_schedule", JSON.stringify(schedule));
    } else {
      localStorage.removeItem("lifesaver_schedule");
    }
  }, [schedule]);

  useEffect(() => {
    if (recommendations) {
      localStorage.setItem("lifesaver_recommendations", JSON.stringify(recommendations));
    } else {
      localStorage.removeItem("lifesaver_recommendations");
    }
  }, [recommendations]);
  
  // App-wide loaders & feedback
  const [initializing, setInitializing] = useState(true);
  const [fetchingTasks, setFetchingTasks] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // 1. Toast Alerts Manager
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // 2. Initialize and verify session on mount
  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setInitializing(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error("Session expired.");
        }

        const data = await response.json();
        setUser(data.user);
        await fetchTasks(token);
      } catch (err) {
        console.error("Session verification failed:", err);
        handleLogout();
        showToast("Session expired. Please log in again.", "error");
      } finally {
        setInitializing(false);
      }
    };

    verifySession();
  }, [token]);

  // 3. Fetch Tasks from DB
  const fetchTasks = async (authToken: string) => {
    setFetchingTasks(true);
    try {
      const response = await fetch("/api/tasks", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!response.ok) throw new Error("Failed to load tasks.");
      const data = await response.json();
      setTasks(data);
    } catch (err: any) {
      showToast(err.message || "Failed to load tasks from server.", "error");
    } finally {
      setFetchingTasks(false);
    }
  };

  const handleAuthSuccess = (newToken: string, authenticatedUser: User) => {
    localStorage.setItem("lifesaver_token", newToken);
    setToken(newToken);
    setUser(authenticatedUser);
    fetchTasks(newToken);
    showToast(`Welcome back, ${authenticatedUser.name}!`, "success");
  };

  const handleLogout = () => {
    localStorage.removeItem("lifesaver_token");
    localStorage.removeItem("lifesaver_schedule");
    localStorage.removeItem("lifesaver_recommendations");
    setToken(null);
    setUser(null);
    setTasks([]);
    setSchedule(null);
    setRecommendations(null);
    setCurrentTab("dashboard");
    showToast("Signed out successfully.", "info");
  };

  // 4. Tasks Mutation Helpers
  const handleAddTask = async (taskData: Omit<Task, "id" | "userId" | "createdAt">) => {
    if (!token) return;
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });
      if (!response.ok) throw new Error("Failed to add task.");
      await fetchTasks(token);
    } catch (err: any) {
      throw new Error(err.message || "Failed to create task.");
    }
  };

  const handleEditTask = async (id: string, updates: Partial<Task>) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error("Failed to update task.");
      await fetchTasks(token);
    } catch (err: any) {
      throw new Error(err.message || "Failed to update task.");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to delete task.");
      await fetchTasks(token);
    } catch (err: any) {
      throw new Error(err.message || "Failed to delete task.");
    }
  };

  const handleRefreshTasks = async () => {
    if (token) {
      await fetchTasks(token);
    }
  };

  // Trigger Rescue Modal
  const handleTriggerRescue = (task: Task) => {
    setRescueTask(task);
  };

  // Rendering Routing
  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        return (
          <Dashboard
            tasks={tasks}
            onToggleStatus={(task) => 
              handleEditTask(task.id, { status: task.status === "Pending" ? "Complete" : "Pending" })
            }
            onTriggerRescue={handleTriggerRescue}
            setViewAllTasks={() => setCurrentTab("tasks")}
          />
        );
      case "tasks":
        return (
          <TasksPage
            tasks={tasks}
            token={token || ""}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onRefreshTasks={handleRefreshTasks}
            onTriggerRescue={handleTriggerRescue}
            showToast={showToast}
          />
        );
      case "schedule":
        return (
          <AISchedule
            tasks={tasks}
            token={token || ""}
            showToast={showToast}
            schedule={schedule}
            setSchedule={setSchedule}
          />
        );
      case "recommendations":
        return (
          <Recommendations
            tasks={tasks}
            token={token || ""}
            showToast={showToast}
            data={recommendations}
            setData={setRecommendations}
          />
        );
      case "analytics":
        return <Analytics tasks={tasks} />;
      default:
        return <div className="text-white">Under Construction</div>;
    }
  };

  // App startup loading screen
  if (initializing) {
    return (
      <div id="startup-loader" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        <div className="text-center">
          <h2 className="text-white font-bold text-lg">Last-Minute Life Saver</h2>
          <p className="text-slate-500 text-xs mt-1">Synchronizing files and databases...</p>
        </div>
      </div>
    );
  }

  // Auth Guard
  if (!token || !user) {
    return (
      <>
        <AuthPage onAuthSuccess={handleAuthSuccess} />
        {/* Simple Toast display for Auth errors */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`px-4 py-3 rounded-xl border shadow-lg flex items-center gap-2 text-xs font-semibold ${
                t.type === "success"
                  ? "bg-teal-500/10 border-teal-500/30 text-teal-400"
                  : t.type === "error"
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-slate-900 border-slate-800 text-slate-300"
              }`}
            >
              {t.type === "success" && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
              {t.type === "error" && <AlertCircle className="w-4 h-4 text-red-400" />}
              {t.type === "info" && <Info className="w-4 h-4 text-slate-400" />}
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">
      {/* Collapsible Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main content body wrapper */}
      <main id="main-content-layout" className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Spacer for Mobile Floating Header */}
        <div className="h-14 md:hidden flex-shrink-0" />

        {/* Content View Scroll Stage */}
        <div className="flex-1 px-4 py-6 md:p-8 lg:p-10 max-w-6xl w-full mx-auto space-y-6">
          {/* Synchronizer state indicator */}
          {fetchingTasks && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-2 flex items-center gap-2 text-amber-500 text-xs w-fit">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing deadlines in real-time...</span>
            </div>
          )}

          {renderTabContent()}
        </div>
      </main>

      {/* Global Rescue Modal (renders over views) */}
      <AnimatePresence>
        {rescueTask && (
          <RescueModal
            task={rescueTask}
            token={token}
            onClose={() => setRescueTask(null)}
          />
        )}
      </AnimatePresence>

      {/* Elegant Toast notifications system */}
      <div id="toast-container" className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`p-4 rounded-xl border shadow-2xl flex items-start gap-3 pointer-events-auto w-full text-xs font-semibold backdrop-blur-md ${
                toast.type === "success"
                  ? "bg-teal-950/90 border-teal-500/30 text-teal-300"
                  : toast.type === "error"
                  ? "bg-red-950/90 border-red-500/30 text-red-300"
                  : "bg-slate-900/95 border-slate-800 text-slate-200"
              }`}
            >
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />}
              <div className="space-y-0.5">
                <p className="leading-relaxed">{toast.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
