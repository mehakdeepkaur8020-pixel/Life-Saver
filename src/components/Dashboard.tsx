import { ShieldAlert, ListTodo, CheckCircle2, Clock, CalendarDays, Zap, Award } from "lucide-react";
import { Task } from "../types";
import { getUrgencyInfo, formatDeadline, getCategoryIcon } from "../utils";

interface DashboardProps {
  tasks: Task[];
  onToggleStatus: (task: Task) => void;
  onTriggerRescue: (task: Task) => void;
  setViewAllTasks: () => void;
}

export default function Dashboard({ tasks, onToggleStatus, onTriggerRescue, setViewAllTasks }: DashboardProps) {
  // 1. Calculations
  const totalCount = tasks.length;
  const pendingTasks = tasks.filter(t => t.status === "Pending");
  const completedTasks = tasks.filter(t => t.status === "Complete");
  const pendingCount = pendingTasks.length;
  const completedCount = completedTasks.length;
  const productivityPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 2. Imminent tasks (urgency <= 24 hours & Pending)
  const pendingWithUrgency = pendingTasks.map(t => ({
    ...t,
    urgencyInfo: getUrgencyInfo(t.deadline, false)
  }));

  // Filter tasks with deadlines within 24 hours (critical, high, medium, overdue)
  const alertTasks = pendingWithUrgency.filter(
    item => item.urgencyInfo.hoursLeft <= 24
  );

  // Find the single closest task for the warning banner
  const closestTask = alertTasks.length > 0 
    ? alertTasks.sort((a, b) => a.urgencyInfo.hoursLeft - b.urgencyInfo.hoursLeft)[0] 
    : null;

  // 3. Upcoming Deadlines list (sorted by time, showing up to 5)
  const upcomingDeadlines = [...pendingTasks]
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  return (
    <div id="dashboard-view" className="space-y-8 animate-fade-in">
      {/* 1. URGENT WARNING BANNER */}
      {closestTask && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-red-500/5 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5.5 h-5.5 text-slate-950" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">Critical Warning: Imminent Deadline</h3>
              <p className="text-sm text-slate-300 mt-1">
                Your task <span className="font-semibold text-red-400">"{closestTask.title}"</span> is due in{" "}
                <span className="font-bold text-red-400">
                  {closestTask.urgencyInfo.hoursLeft < 0 
                    ? "OVERDUE" 
                    : `${Math.max(1, Math.round(closestTask.urgencyInfo.hoursLeft))} hours`}
                </span>! Do not panic — active planning is required.
              </p>
            </div>
          </div>
          <button
            onClick={() => onTriggerRescue(closestTask)}
            className="w-full md:w-auto px-5 py-2.5 bg-red-500 hover:bg-red-600 text-slate-950 font-bold rounded-xl text-sm shadow-md shadow-red-500/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
          >
            <Zap className="w-4.5 h-4.5 fill-current" />
            <span>Launch Rescue Plan</span>
          </button>
        </div>
      )}

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400">
            <ListTodo className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Tasks</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalCount}</p>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Clock className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pending</p>
            <p className="text-xl font-bold text-white mt-0.5">{pendingCount}</p>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
            <CheckCircle2 className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Completed</p>
            <p className="text-xl font-bold text-white mt-0.5">{completedCount}</p>
          </div>
        </div>

        {/* Productivity percentage */}
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-5 flex items-center gap-4 col-span-2 lg:col-span-1">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-teal-500/40 flex items-center justify-center text-amber-400">
            <Award className="w-5.5 h-5.5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Productivity</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <p className="text-xl font-bold text-white">{productivityPercentage}%</p>
              <span className="text-[10px] text-slate-400 font-medium">resolved</span>
            </div>
            {/* Minimal Progress Bar */}
            <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-teal-400 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${productivityPercentage}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENTS SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left 2 Cols: Imminent & Critical items */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Upcoming Deadlines</h2>
              <p className="text-xs text-slate-400 mt-0.5">Your soonest pending schedules sorted by urgency</p>
            </div>
            <button
              onClick={setViewAllTasks}
              className="text-amber-500 hover:text-amber-400 text-xs font-semibold hover:underline cursor-pointer focus:outline-none"
            >
              View All Tasks
            </button>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700/50 border-dashed rounded-xl py-12 px-6 text-center space-y-3">
              <div className="text-3xl">🎉</div>
              <p className="text-sm text-slate-400">All clear! No pending deadlines found.</p>
              <button
                onClick={setViewAllTasks}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Add Your First Task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingDeadlines.map((task) => {
                const urgency = getUrgencyInfo(task.deadline, false);
                const isImminent = urgency.hoursLeft <= 24;

                return (
                  <div
                    key={task.id}
                    className={`bg-slate-800 border border-slate-700/50 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                      isImminent && (urgency.urgency === "critical" || urgency.urgency === "overdue") 
                        ? `${urgency.pulseClass}` 
                        : "hover:border-slate-600 hover:shadow-lg hover:shadow-black/20"
                    }`}
                  >
                    {/* Urgency light strip */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      urgency.urgency === "critical" || urgency.urgency === "overdue"
                        ? "bg-red-500"
                        : urgency.urgency === "high"
                        ? "bg-orange-500"
                        : urgency.urgency === "medium"
                        ? "bg-amber-500"
                        : "bg-slate-700"
                    }`} />

                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="text-xl" title={task.category}>
                          {getCategoryIcon(task.category)}
                        </span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${urgency.badgeClass}`}>
                          {urgency.label}
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-base leading-snug line-clamp-1 mb-1">{task.title}</h4>
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 min-h-[2.5rem] mb-4">
                        {task.description || "No description provided."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between gap-2 mt-auto">
                      <button
                        onClick={() => onToggleStatus(task)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 focus:outline-none cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Done</span>
                      </button>

                      {isImminent && (
                        <button
                          onClick={() => onTriggerRescue(task)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/15 border border-red-500/30 hover:bg-red-500 text-red-400 hover:text-slate-950 font-bold rounded-lg text-[10px] transition-all cursor-pointer focus:outline-none shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                        >
                          <Zap className="w-3 h-3 fill-current" />
                          <span>Rescue</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Tips / Status indicators */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Active Plan Indicators</h3>
            <p className="text-xs text-slate-400 mt-0.5">Understanding mission urgency colors</p>
          </div>

          <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-5 space-y-4">
            {/* Color keys */}
            <div className="flex items-start gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 mt-0.5 animate-pulse" />
              <div>
                <h5 className="text-xs font-bold text-white uppercase tracking-wider">Critical (≤ 6h / Overdue)</h5>
                <p className="text-slate-400 text-xs mt-0.5">Severe risk. Cards pulse and glow with red light. Immediate action necessary.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-orange-500 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-white uppercase tracking-wider">High Urgency (≤ 12h)</h5>
                <p className="text-slate-400 text-xs mt-0.5">High warning. Task needs to be loaded into your immediate working block.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-white uppercase tracking-wider">Medium Urgency (≤ 24h)</h5>
                <p className="text-slate-400 text-xs mt-0.5">Alert active. Recommended to trigger Auto Rescue blueprinting.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-teal-400 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-white uppercase tracking-wider">Safe / Completed</h5>
                <p className="text-slate-400 text-xs mt-0.5">Target resolved successfully. Stored in history logs.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
