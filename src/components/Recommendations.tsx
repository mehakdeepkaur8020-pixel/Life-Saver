import { useState } from "react";
import { Sparkles, Loader2, ArrowRight, Clock, HelpCircle, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { RecommendationsResponse, Task } from "../types";
import EmptyState from "./EmptyState";

interface RecommendationsProps {
  tasks: Task[];
  token: string;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  data: RecommendationsResponse | null;
  setData: (data: RecommendationsResponse | null) => void;
}

export default function Recommendations({ tasks, token, showToast, data, setData }: RecommendationsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingCount = tasks.filter(t => t.status === "Pending").length;

  const fetchRecommendations = async () => {
    if (pendingCount === 0) {
      showToast("No pending tasks found to analyze.", "error");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to retrieve recommendations.");
      }

      setData(json);
      showToast("AI Recommendations generated successfully!", "success");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      showToast(err.message || "Failed to generate recommendations.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ai-recommendations-view" className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Roadmap & Recommendations</h2>
          <p className="text-xs text-slate-400 mt-0.5">Let Gemini analyze tasks complexity and deadlines to formulate your optimized execution order</p>
        </div>

        <button
          onClick={fetchRecommendations}
          disabled={loading || pendingCount === 0}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/35 disabled:text-slate-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 active:scale-95 transition-all focus:outline-none whitespace-nowrap self-start sm:self-auto"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 fill-current" />
          )}
          <span>Generate Recommendations</span>
        </button>
      </div>

      {/* Loading section */}
      {loading && (
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl py-16 px-6 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
          <div className="text-center">
            <h4 className="font-bold text-white text-base">Analyzing Workload & Deadlines...</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Gemini is structuring an optimal order, computing execution budgets, and drafting tactical advice.
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex items-start gap-3.5 max-w-xl animate-fade-in">
          <AlertCircle className="w-5.5 h-5.5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-400 text-sm">Roadmap Calculation Failed</h4>
            <p className="text-slate-300 text-xs mt-1">{error}</p>
            <button
              onClick={fetchRecommendations}
              className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-[#0a0e17] font-bold rounded-lg text-[11px] transition-colors cursor-pointer focus:outline-none"
            >
              Retry Formulation
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !data && (
        <EmptyState
          id="ai-recommendations-empty-state"
          illustrationType="recommendations"
          title="Formulate Strategic Execution Order"
          description="When swamped with exams, assignments, and payments, deciding where to start can trigger fatigue. Let Gemini compute an optimized, highly focused sequence."
          action={
            <button
              onClick={fetchRecommendations}
              disabled={pendingCount === 0}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/40 disabled:text-slate-500 text-[#0a0e17] font-bold rounded-xl text-xs transition-colors cursor-pointer focus:outline-none shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              Calculate Roadmap
            </button>
          }
        />
      )}

      {/* Recommendations Presentation */}
      {data && (
        <div className="space-y-6 max-w-3xl animate-fade-in">
          {/* Executive Summary */}
          <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border border-amber-500/20">
                <FileText className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Mission Briefing Summary</h3>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  {data.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Recommendations list */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ordered Roadmap Checklist</h3>
            <div className="space-y-3">
              {data.recommendations.map((rec) => {
                return (
                  <div 
                    key={rec.order} 
                    className="bg-slate-800 border border-slate-700/50 rounded-xl p-5 flex items-start gap-4 hover:border-slate-600 transition-colors"
                  >
                    {/* Index block */}
                    <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700/50 flex items-center justify-center font-extrabold text-sm text-amber-400 flex-shrink-0">
                      {rec.order}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h4 className="font-bold text-white text-sm truncate">{rec.taskTitle}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900 text-slate-400 flex items-center gap-1 border border-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{rec.timeAllocationMinutes} mins suggested</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        <span className="text-amber-500 font-semibold mr-1">Tactical Tip:</span>
                        {rec.tip}
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
  );
}
