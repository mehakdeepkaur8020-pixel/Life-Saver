import { useState } from "react";
import { CalendarDays, Clock, Sparkles, Loader2, Play, Smile, Coffee, ChevronRight, AlertCircle } from "lucide-react";
import { ScheduleSlot, Task } from "../types";
import EmptyState from "./EmptyState";

interface AIScheduleProps {
  tasks: Task[];
  token: string;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  schedule: ScheduleSlot[] | null;
  setSchedule: (schedule: ScheduleSlot[] | null) => void;
}

export default function AISchedule({ tasks, token, showToast, schedule, setSchedule }: AIScheduleProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingCount = tasks.filter(t => t.status === "Pending").length;

  const generateSchedule = async () => {
    if (pendingCount === 0) {
      showToast("No pending tasks found to organize.", "error");
      return;
    }

    setLoading(true);
    setError(null);
    setSchedule(null);

    try {
      const response = await fetch("/api/ai/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate AI Schedule.");
      }

      setSchedule(data.schedule || []);
      showToast("AI Schedule generated successfully!", "success");
    } catch (err: any) {
      setError(err.message || "Could not generate schedule.");
      showToast(err.message || "Failed to generate schedule.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ai-schedule-view" className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Hourly Schedule</h2>
          <p className="text-xs text-slate-400 mt-0.5">Let Gemini build an active timeline for today incorporating breaks and deadlines</p>
        </div>

        <button
          onClick={generateSchedule}
          disabled={loading || pendingCount === 0}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/35 disabled:text-slate-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 active:scale-95 transition-all focus:outline-none whitespace-nowrap self-start sm:self-auto"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 fill-current" />
          )}
          <span>Generate Timetable</span>
        </button>
      </div>

      {/* Main Contents Area */}
      {loading && (
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl py-16 px-6 flex flex-col items-center justify-center space-y-4 shadow-[0_0_20px_rgba(245,158,11,0.05)]">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
          <div className="text-center">
            <h4 className="font-bold text-white text-base">Formulating High-Impact Schedule...</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Gemini is assessing deadlines, estimating complexity, and allocating optimized time blocks.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex items-start gap-3.5 max-w-xl">
          <AlertCircle className="w-5.5 h-5.5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-400 text-sm">Failed to generate Schedule</h4>
            <p className="text-slate-300 text-xs mt-1">{error}</p>
            <button
              onClick={generateSchedule}
              className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-[#0a0e17] font-bold rounded-lg text-[11px] transition-colors cursor-pointer focus:outline-none"
            >
              Retry Generation
            </button>
          </div>
        </div>
      )}

      {!loading && !error && !schedule && (
        <EmptyState
          id="ai-schedule-empty-state"
          illustrationType="schedule"
          title="Plan Your Day with AI"
          description={`Have Gemini build an hour-by-hour action plan for the rest of today. It analyzes your ${pendingCount} pending task${pendingCount !== 1 ? 's' : ''}, sets breaks, and schedules them.`}
          action={
            <button
              onClick={generateSchedule}
              disabled={pendingCount === 0}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/40 disabled:text-slate-500 text-[#0a0e17] font-bold rounded-xl text-xs transition-colors cursor-pointer focus:outline-none shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              Generate Today's Timeline
            </button>
          }
        />
      )}

      {/* Schedule Lists */}
      {schedule && (
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Action Plan</h3>
            <span className="text-xs text-slate-500 font-medium">{schedule.length} scheduled timeblocks</span>
          </div>

          <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
            {schedule.map((slot, index) => {
              const isBreak = ["break", "nap", "stretch", "meals", "meal", "rest", "coffee"].some(term => 
                slot.taskName.toLowerCase().includes(term)
              );

              return (
                <div key={index} className="relative group">
                  {/* Timeline bullet */}
                  <span className={`absolute top-1.5 -left-[31px] w-4 h-4 rounded-full border-2 bg-slate-950 flex items-center justify-center transition-colors ${
                    isBreak 
                      ? "border-teal-500 text-teal-400" 
                      : "border-amber-500 text-amber-500"
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  </span>

                  <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-600 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isBreak ? (
                          <Coffee className="w-4 h-4 text-teal-400" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                        )}
                        <h4 className={`font-semibold text-sm ${isBreak ? "text-teal-400" : "text-white"}`}>
                          {slot.taskName}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                        {slot.note}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-700/50 px-2.5 py-1.5 rounded-lg flex-shrink-0 self-start sm:self-auto">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{slot.startTime}</span>
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      <span>{slot.endTime}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
