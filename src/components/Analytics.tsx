import { BarChart3, CheckCircle2, Clock, ListTodo, Award, PieChart, TrendingUp, Sparkles } from "lucide-react";
import { Task, TaskCategory } from "../types";

interface AnalyticsProps {
  tasks: Task[];
}

export default function Analytics({ tasks }: AnalyticsProps) {
  const totalCount = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "Complete");
  const pendingTasks = tasks.filter(t => t.status === "Pending");
  const completedCount = completedTasks.length;
  const pendingCount = pendingTasks.length;
  
  const productivityPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Compute stats by category
  const categories: TaskCategory[] = ["Assignment", "Exam", "Meeting", "Interview", "Bill Payment", "General"];
  
  const categoryStats = categories.map(cat => {
    const catTasks = tasks.filter(t => t.category === cat);
    const catTotal = catTasks.length;
    const catCompleted = catTasks.filter(t => t.status === "Complete").length;
    const percentage = catTotal > 0 ? Math.round((catCompleted / catTotal) * 100) : 0;
    
    return {
      category: cat,
      total: catTotal,
      completed: catCompleted,
      percentage
    };
  }).filter(stat => stat.total > 0); // Only show categories with tasks

  // Compute stats by priority
  const highTotal = tasks.filter(t => t.priority === "High").length;
  const highCompleted = tasks.filter(t => t.priority === "High" && t.status === "Complete").length;
  const highPercentage = highTotal > 0 ? Math.round((highCompleted / highTotal) * 100) : 0;

  const mediumTotal = tasks.filter(t => t.priority === "Medium").length;
  const mediumCompleted = tasks.filter(t => t.priority === "Medium" && t.status === "Complete").length;
  const mediumPercentage = mediumTotal > 0 ? Math.round((mediumCompleted / mediumTotal) * 100) : 0;

  const lowTotal = tasks.filter(t => t.priority === "Low").length;
  const lowCompleted = tasks.filter(t => t.priority === "Low" && t.status === "Complete").length;
  const lowPercentage = lowTotal > 0 ? Math.round((lowCompleted / lowTotal) * 100) : 0;

  return (
    <div id="analytics-view" className="space-y-8 animate-fade-in">
      {/* Header section */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Performance Analytics</h2>
        <p className="text-xs text-slate-400 mt-0.5">Visualize your task completion rates, categories metrics, and priority breakthroughs</p>
      </div>

      {totalCount === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/50 border-dashed rounded-xl py-16 px-6 text-center space-y-3">
          <div className="text-4xl">📊</div>
          <p className="text-sm text-slate-400 font-medium">No tasks logged. Track your completions once tasks are created.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel: Completion overview */}
          <div className="lg:col-span-1 bg-slate-800 border border-slate-700/50 rounded-xl p-6 flex flex-col justify-between space-y-6 shadow-xl shadow-black/15">
            <div className="space-y-1.5">
              <h3 className="font-bold text-white text-base">Resolution Rate</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Your overall ratio of completed versus pending milestones</p>
            </div>

            {/* Circular Productivity Dial */}
            <div className="py-6 flex justify-center items-center relative">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Gray background track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#111827"
                    strokeWidth="8"
                  />
                  {/* Dynamic colored progress track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="url(#amberToTealGrad)"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * productivityPercentage) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  {/* SVG Gradients definitions */}
                  <defs>
                    <linearGradient id="amberToTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#2dd4bf" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Numeric Dial text overlay */}
                <div className="text-center z-10">
                  <span className="text-3xl font-extrabold text-white leading-none tracking-tight">
                    {productivityPercentage}%
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Resolved
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics details */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700/50 text-center">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Total</span>
                <span className="text-base font-extrabold text-white mt-1 block">{totalCount}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Pending</span>
                <span className="text-base font-extrabold text-amber-400 mt-1 block">{pendingCount}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Done</span>
                <span className="text-base font-extrabold text-teal-400 mt-1 block">{completedCount}</span>
              </div>
            </div>
          </div>

          {/* Right panel: Metrics breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Performance metrics */}
            <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 space-y-5 shadow-xl shadow-black/15">
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Breakdown by Category</h3>
                <p className="text-xs text-slate-400">Resolution statistics grouped by category areas</p>
              </div>

              {categoryStats.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No tasks categorized yet.</p>
              ) : (
                <div className="space-y-4">
                  {categoryStats.map((stat) => (
                    <div key={stat.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">
                          {stat.category} ({stat.completed}/{stat.total})
                        </span>
                        <span className="font-extrabold text-white">{stat.percentage}%</span>
                      </div>
                      {/* Fluid Bar */}
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/30">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-teal-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Priority Breakout metrics */}
            <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 space-y-5 shadow-xl shadow-black/15">
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Breakdown by Priority</h3>
                <p className="text-xs text-slate-400">Resolution rates based on target priority hierarchies</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* High priority */}
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide">High Priority</span>
                    <span className="text-xs font-extrabold text-white">{highPercentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: `${highPercentage}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block">{highCompleted} of {highTotal} cleared</span>
                </div>

                {/* Medium priority */}
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">Medium Priority</span>
                    <span className="text-xs font-extrabold text-white">{mediumPercentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${mediumPercentage}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block">{mediumCompleted} of {mediumTotal} cleared</span>
                </div>

                {/* Low priority */}
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wide">Low Priority</span>
                    <span className="text-xs font-extrabold text-white">{lowPercentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className="bg-teal-400 h-full rounded-full" style={{ width: `${lowPercentage}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block">{lowCompleted} of {lowTotal} cleared</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
