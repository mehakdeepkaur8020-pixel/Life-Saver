import React, { useState, useRef, useEffect } from "react";
import { 
  Plus, Search, Filter, Mic, MicOff, AlertCircle, Edit2, Trash2, CheckCircle2, 
  Sparkles, Loader2, X, Calendar, Clock, Tag, ChevronDown, CheckSquare, Square
} from "lucide-react";
import { Task, TaskPriority, TaskCategory, TaskStatus } from "../types";
import { 
  getUrgencyInfo, formatDeadline, getCategoryIcon, 
  getPriorityBadgeColor, parseVoiceInput 
} from "../utils";
import EmptyState from "./EmptyState";

interface TasksPageProps {
  tasks: Task[];
  token: string;
  onAddTask: (task: Omit<Task, "id" | "userId" | "createdAt">) => Promise<void>;
  onEditTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onRefreshTasks: () => Promise<void>;
  onTriggerRescue: (task: Task) => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function TasksPage({ 
  tasks, token, onAddTask, onEditTask, onDeleteTask, 
  onRefreshTasks, onTriggerRescue, showToast 
}: TasksPageProps) {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // CRUD Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Form States
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formCategory, setFormCategory] = useState<TaskCategory>("General");
  const [formPriority, setFormPriority] = useState<TaskPriority>("Unranked");

  // AI Loading state
  const [aiPrioritizing, setAiPrioritizing] = useState(false);

  // Voice Input States
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          showToast(`Voice heard: "${transcript}"`, "info");
          const parsed = parseVoiceInput(transcript);
          
          // Open Modal & Pre-fill Form
          setFormTitle(parsed.title);
          setFormDeadline(parsed.deadline);
          setFormCategory(parsed.category as TaskCategory);
          setFormDescription(`Created via voice command: "${transcript}"`);
          setFormPriority("Unranked");
          setIsAddModalOpen(true);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setSpeechError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceListen = () => {
    if (!recognitionRef.current) {
      showToast("Web Speech API is not supported in this browser.", "error");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Trigger server-side AI Prioritization
  const handleAIPrioritize = async () => {
    setAiPrioritizing(true);
    showToast("Gemini is analyzing and prioritizing your tasks...", "info");

    try {
      const response = await fetch("/api/ai/prioritize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to prioritize tasks.");
      }

      await onRefreshTasks();
      showToast(`AI Prioritized: Successfully updated ${data.updatedCount} tasks!`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to trigger AI prioritization.", "error");
    } finally {
      setAiPrioritizing(false);
    }
  };

  // Task Handlers
  const handleOpenAddModal = () => {
    setFormTitle("");
    setFormDescription("");
    // Set default deadline to tomorrow same hour
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tzoffset = tomorrow.getTimezoneOffset() * 60000;
    const localISOTime = new Date(tomorrow.getTime() - tzoffset).toISOString().slice(0, 16);
    setFormDeadline(localISOTime);
    setFormCategory("General");
    setFormPriority("Unranked");
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setSelectedTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description);
    
    // Parse deadline back to local datetime ISO format
    const date = new Date(task.deadline);
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
    setFormDeadline(localISOTime);
    setFormCategory(task.category);
    setFormPriority(task.priority);
    setIsEditModalOpen(true);
  };

  const handleSaveNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast("Task title is required.", "error");
      return;
    }
    try {
      await onAddTask({
        title: formTitle,
        description: formDescription,
        deadline: new Date(formDeadline).toISOString(),
        category: formCategory,
        priority: formPriority,
        status: "Pending"
      });
      setIsAddModalOpen(false);
      showToast("Task created successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save task.", "error");
    }
  };

  const handleSaveEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (!formTitle.trim()) {
      showToast("Task title is required.", "error");
      return;
    }
    try {
      await onEditTask(selectedTask.id, {
        title: formTitle,
        description: formDescription,
        deadline: new Date(formDeadline).toISOString(),
        category: formCategory,
        priority: formPriority
      });
      setIsEditModalOpen(false);
      showToast("Task updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update task.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await onDeleteTask(id);
        showToast("Task deleted successfully.", "success");
      } catch (err: any) {
        showToast(err.message || "Failed to delete task.", "error");
      }
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const newStatus: TaskStatus = task.status === "Pending" ? "Complete" : "Pending";
      await onEditTask(task.id, { status: newStatus });
      showToast(
        newStatus === "Complete" ? `"${task.title}" completed!` : `"${task.title}" marked as pending`,
        "success"
      );
    } catch (err: any) {
      showToast(err.message || "Failed to update status.", "error");
    }
  };

  // Filter Logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
    const matchesCategory = categoryFilter === "All" || task.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  return (
    <div id="tasks-view" className="space-y-6">
      {/* 1. HEADER & AI TRIGGERS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Task Command Station</h2>
          <p className="text-xs text-slate-400 mt-0.5">Control, filter, create and leverage AI prioritization</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* AI Prioritize */}
          <button
            onClick={handleAIPrioritize}
            disabled={aiPrioritizing || tasks.filter(t => t.status === "Pending").length === 0}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 disabled:from-amber-500/40 disabled:to-amber-600/40 disabled:text-slate-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-md shadow-amber-500/10 focus:outline-none"
          >
            {aiPrioritizing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 fill-current" />
            )}
            <span>AI Prioritize</span>
          </button>

          {/* Add Task */}
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer focus:outline-none border border-slate-700"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>

          {/* Voice Command Dictation */}
          <button
            onClick={toggleVoiceListen}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer focus:outline-none ${
              isListening 
                ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse" 
                : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white"
            }`}
            title="Dictate with voice, e.g. 'Add DBMS assignment due tomorrow'"
          >
            {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Speech Feedback Banner */}
      {isListening && (
        <div className="bg-red-500/5 border border-red-500/25 rounded-xl p-4 flex items-center gap-3 text-red-400 text-xs animate-pulse">
          <Mic className="w-4.5 h-4.5 animate-bounce" />
          <span>Listening active. Try saying: <span className="font-semibold text-white">"Add DBMS assignment due tomorrow"</span> or <span className="font-semibold text-white">"Add client meeting in 2 hours"</span></span>
        </div>
      )}

      {speechError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4" />
          <span>{speechError}</span>
        </div>
      )}

      {/* 2. FILTERS PANEL */}
      <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search title, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/50 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status */}
          <div className="flex items-center bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-slate-300">
            <span className="text-slate-500 mr-2">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium border-none focus:outline-none text-white [&>option]:bg-slate-900"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Complete">Complete</option>
            </select>
          </div>

          {/* Priority */}
          <div className="flex items-center bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-slate-300">
            <span className="text-slate-500 mr-2">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent font-medium border-none focus:outline-none text-white [&>option]:bg-slate-900"
            >
              <option value="All">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Unranked">Unranked</option>
            </select>
          </div>

          {/* Category */}
          <div className="flex items-center bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-slate-300">
            <span className="text-slate-500 mr-2">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent font-medium border-none focus:outline-none text-white [&>option]:bg-slate-900"
            >
              <option value="All">All</option>
              <option value="Assignment">Assignment</option>
              <option value="Exam">Exam</option>
              <option value="Meeting">Meeting</option>
              <option value="Interview">Interview</option>
              <option value="Bill Payment">Bill Payment</option>
              <option value="General">General</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. TASKS GRID/LIST */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          id="tasks-empty-state"
          illustrationType="tasks"
          title={tasks.length === 0 ? "Your Command Station is Empty" : "No Matching Tasks Found"}
          description={
            tasks.length === 0
              ? "You don't have any tasks logged yet. Create your first task to leverage the timeline planning and AI prioritization features!"
              : "No tasks match your selected status, priority, or category filters. Try adjusting your filters to find them."
          }
          action={
            tasks.length === 0 ? (
              <button
                onClick={handleOpenAddModal}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)] focus:outline-none"
              >
                Create Your First Task
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("All");
                  setPriorityFilter("All");
                  setCategoryFilter("All");
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer border border-slate-700/50"
              >
                Reset Filter Settings
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => {
            const urgency = getUrgencyInfo(task.deadline, task.status === "Complete");
            const isPending = task.status === "Pending";
            const isImminent = isPending && urgency.hoursLeft <= 24;

            return (
              <div
                key={task.id}
                className={`bg-slate-800 border border-slate-700/50 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                  isImminent && (urgency.urgency === "critical" || urgency.urgency === "overdue")
                    ? `${urgency.pulseClass}`
                    : "hover:border-slate-600 hover:shadow-xl hover:shadow-black/20"
                }`}
              >
                {/* Imminent stripe */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  task.status === "Complete"
                    ? "bg-teal-500"
                    : urgency.urgency === "critical" || urgency.urgency === "overdue"
                    ? "bg-red-500"
                    : urgency.urgency === "high"
                    ? "bg-orange-500"
                    : urgency.urgency === "medium"
                    ? "bg-amber-500"
                    : "bg-slate-700"
                }`} />

                <div>
                  <div className="flex items-start justify-between gap-2 mb-3.5">
                    <span className="text-xl px-2 py-1 bg-slate-900 border border-slate-700/50 rounded-lg" title={task.category}>
                      {getCategoryIcon(task.category)}
                    </span>
                    <div className="flex flex-col items-end gap-1.5">
                      {isPending ? (
                        <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${urgency.badgeClass}`}>
                          {urgency.label}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full border bg-teal-500/10 text-teal-400 border-teal-500/30">
                          Completed
                        </span>
                      )}
                      {task.priority !== "Unranked" && (
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${getPriorityBadgeColor(task.priority)}`}>
                          {task.priority} Priority
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className={`font-bold text-base leading-snug line-clamp-1 mb-1 ${
                    task.status === "Complete" ? "text-slate-500 line-through" : "text-white"
                  }`}>
                    {task.title}
                  </h3>
                  <p className={`text-xs leading-relaxed line-clamp-3 min-h-[3.3rem] mb-4 ${
                    task.status === "Complete" ? "text-slate-600" : "text-slate-400"
                  }`}>
                    {task.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between gap-2 mt-auto">
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white focus:outline-none cursor-pointer"
                  >
                    {task.status === "Complete" ? (
                      <>
                        <CheckSquare className="w-4 h-4 text-teal-400" />
                        <span className="text-teal-400">Done</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4" />
                        <span>Mark Done</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Rescue Mode */}
                    {isImminent && (
                      <button
                        onClick={() => onTriggerRescue(task)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/15 border border-red-500/30 hover:bg-red-500 text-red-400 hover:text-slate-950 font-bold rounded-lg text-[9px] transition-all cursor-pointer focus:outline-none shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                      >
                        <Sparkles className="w-3 h-3 fill-current" />
                        <span>Rescue</span>
                      </button>
                    )}

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEditModal(task)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 cursor-pointer focus:outline-none"
                      title="Edit task details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer focus:outline-none"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== CREATE TASK MODAL ==================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700/50 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Create Mission Task</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer focus:outline-none">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewTask} className="p-6 space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DBMS Assignment 3"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Add specific requirements, syllabus topics or sub-details..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Deadline Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TaskCategory)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors [&>option]:bg-slate-900"
                  >
                    <option value="Assignment">Assignment</option>
                    <option value="Exam">Exam</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Interview">Interview</option>
                    <option value="Bill Payment">Bill Payment</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Priority (AI Prioritization can update this automatically)</label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors [&>option]:bg-slate-900"
                >
                  <option value="Unranked">Unranked</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs cursor-pointer focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 cursor-pointer focus:outline-none"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT TASK MODAL ==================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700/50 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Edit Task</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer focus:outline-none">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTask} className="p-6 space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Deadline Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TaskCategory)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors [&>option]:bg-slate-900"
                  >
                    <option value="Assignment">Assignment</option>
                    <option value="Exam">Exam</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Interview">Interview</option>
                    <option value="Bill Payment">Bill Payment</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors [&>option]:bg-slate-900"
                >
                  <option value="Unranked">Unranked</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs cursor-pointer focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 cursor-pointer focus:outline-none"
                >
                  Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
