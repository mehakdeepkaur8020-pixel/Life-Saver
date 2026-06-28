import { useState, useEffect } from "react";
import { X, ShieldAlert, CheckCircle2, Clock, CalendarDays, Loader2, PlayCircle } from "lucide-react";
import { Task, RescuePlan } from "../types";
import { getUrgencyInfo, formatDeadline } from "../utils";
import { motion, AnimatePresence } from "motion/react";

interface RescueModalProps {
  task: Task | null;
  token: string;
  onClose: () => void;
}

export default function RescueModal({ task, token, onClose }: RescueModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<RescuePlan | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (task) {
      fetchRescuePlan();
    } else {
      setPlan(null);
      setCompletedSteps([]);
    }
  }, [task]);

  const fetchRescuePlan = async () => {
    if (!task) return;
    setLoading(true);
    setError(null);
    setPlan(null);
    setCompletedSteps([]);

    try {
      const response = await fetch("/api/ai/rescue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ taskId: task.id })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate Rescue Plan.");
      }
      setPlan(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps(prev =>
      prev.includes(stepNumber)
        ? prev.filter(num => num !== stepNumber)
        : [...prev, stepNumber]
    );
  };

  if (!task) return null;

  const urgency = getUrgencyInfo(task.deadline, task.status === "Complete");

  return (
    <div id="rescue-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-900 border border-red-500/40 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.15)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse">
              <ShieldAlert className="w-5 h-5 text-[#0a0e17]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">Auto Rescue Plan</h3>
              <p className="text-xs text-red-400 font-semibold tracking-wide uppercase mt-0.5">Crisis Salvage Blueprint</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Target Task Briefing */}
          <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mission Target</span>
              <h4 className="font-semibold text-white text-base mt-0.5">{task.title}</h4>
              <p className="text-slate-400 text-sm mt-1 line-clamp-2">{task.description || "No description provided."}</p>
            </div>
            <div className="flex flex-col items-start sm:items-end flex-shrink-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Time Frame</span>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                {urgency.label}
              </span>
              <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{formatDeadline(task.deadline)}</span>
              </span>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-white">Analyzing Task & Time Remaining...</p>
                <p className="text-xs text-slate-400 mt-1">Gemini is formulating an hour-by-hour rescue plan.</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-center space-y-3">
              <p className="text-red-400 text-sm font-medium">{error}</p>
              <button
                onClick={fetchRescuePlan}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-[#0a0e17] font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                Retry Rescue Request
              </button>
            </div>
          )}

          {/* Plan Display */}
          {plan && (
            <div className="space-y-6">
              {/* Verdict Banner */}
              <div className={`border rounded-xl p-5 ${
                plan.verdict === "achievable"
                  ? "bg-teal-500/5 border-teal-500/20 text-teal-300"
                  : "bg-amber-500/5 border-amber-500/20 text-amber-300"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-slate-900 border border-current">
                    Verdict: {plan.verdict}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Total Plan: {plan.totalEstimatedMinutes} mins</span>
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{plan.verdictReason}</p>
              </div>

              {/* Step list */}
              <div className="space-y-3.5">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Calculated Action Steps</h5>
                <div className="space-y-3">
                  {plan.steps.map((step) => {
                    const isCompleted = completedSteps.includes(step.stepNumber);
                    return (
                      <div
                        key={step.stepNumber}
                        onClick={() => toggleStep(step.stepNumber)}
                        className={`border rounded-xl p-4 flex gap-4 cursor-pointer select-none transition-all ${
                          isCompleted
                            ? "bg-slate-950/20 border-slate-800/30 opacity-60"
                            : "bg-slate-800 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/80"
                        }`}
                      >
                        <button className="focus:outline-none flex-shrink-0 mt-0.5">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5.5 h-5.5 text-teal-400" />
                          ) : (
                            <div className="w-5.5 h-5.5 rounded-full border-2 border-slate-600 hover:border-red-500 transition-colors flex items-center justify-center font-bold text-[10px] text-slate-400">
                              {step.stepNumber}
                            </div>
                          )}
                        </button>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h6 className={`font-semibold text-sm ${isCompleted ? "line-through text-slate-500" : "text-white"}`}>
                              {step.title}
                            </h6>
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{step.durationMinutes} mins</span>
                            </span>
                          </div>
                          <p className={`text-xs ${isCompleted ? "text-slate-600" : "text-slate-400"} leading-relaxed`}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950/60 px-6 py-4 border-t border-slate-800/80 flex items-center justify-between">
          {plan && (
            <div className="text-xs text-slate-500">
              {completedSteps.length} of {plan.steps.length} steps resolved
            </div>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer ml-auto"
          >
            Close Mission Brief
          </button>
        </div>
      </motion.div>
    </div>
  );
}
