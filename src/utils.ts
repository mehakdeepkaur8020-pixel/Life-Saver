import { Task, TaskPriority, TaskCategory } from "./types";

export interface UrgencyInfo {
  hoursLeft: number;
  urgency: 'critical' | 'high' | 'medium' | 'normal' | 'overdue';
  label: string;
  badgeClass: string;
  pulseClass: string;
}

export function getUrgencyInfo(deadlineStr: string, isCompleted: boolean): UrgencyInfo {
  if (isCompleted) {
    return {
      hoursLeft: 0,
      urgency: 'normal',
      label: 'Completed',
      badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
      pulseClass: ''
    };
  }

  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const hoursLeft = diffMs / (1000 * 60 * 60);

  if (hoursLeft < 0) {
    return {
      hoursLeft,
      urgency: 'overdue',
      label: 'Overdue',
      badgeClass: 'bg-red-500/10 text-red-500 border-red-500/30 font-bold',
      pulseClass: 'animate-pulse ring-2 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
    };
  } else if (hoursLeft <= 6) {
    return {
      hoursLeft,
      urgency: 'critical',
      label: `${Math.max(1, Math.round(hoursLeft))}h left (CRITICAL)`,
      badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30 font-bold',
      pulseClass: 'animate-pulse ring-1 ring-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
    };
  } else if (hoursLeft <= 12) {
    return {
      hoursLeft,
      urgency: 'high',
      label: `${Math.round(hoursLeft)}h left`,
      badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      pulseClass: ''
    };
  } else if (hoursLeft <= 24) {
    return {
      hoursLeft,
      urgency: 'medium',
      label: `${Math.round(hoursLeft)}h left`,
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      pulseClass: ''
    };
  } else {
    const daysLeft = Math.round(hoursLeft / 24);
    return {
      hoursLeft,
      urgency: 'normal',
      label: daysLeft === 1 ? '1 day left' : `${daysLeft} days left`,
      badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      pulseClass: ''
    };
  }
}

export function formatDeadline(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
}

export function getCategoryIcon(category: TaskCategory): string {
  switch (category) {
    case 'Assignment': return '📝';
    case 'Exam': return '🎓';
    case 'Meeting': return '🤝';
    case 'Interview': return '💼';
    case 'Bill Payment': return '💳';
    default: return '📌';
  }
}

export function getPriorityBadgeColor(priority: TaskPriority): string {
  switch (priority) {
    case 'High': return 'bg-red-500/15 text-red-400 border border-red-500/30';
    case 'Medium': return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
    case 'Low': return 'bg-teal-500/15 text-teal-400 border border-teal-500/30';
    default: return 'bg-slate-500/15 text-slate-400 border border-slate-500/20';
  }
}

export function parseVoiceInput(transcript: string): { title: string; deadline: string; category: string } {
  let title = transcript;
  let deadline = new Date(); // default to now
  let category = "General";

  const text = transcript.toLowerCase();

  // Extract category
  if (text.includes("assignment") || text.includes("homework") || text.includes("essay") || text.includes("report")) {
    category = "Assignment";
  } else if (text.includes("exam") || text.includes("test") || text.includes("quiz") || text.includes("midterm") || text.includes("finals") || text.includes("studying")) {
    category = "Exam";
  } else if (text.includes("meeting") || text.includes("meet") || text.includes("synch") || text.includes("discuss")) {
    category = "Meeting";
  } else if (text.includes("interview") || text.includes("job") || text.includes("recruitment")) {
    category = "Interview";
  } else if (text.includes("bill") || text.includes("payment") || text.includes("rent") || text.includes("pay")) {
    category = "Bill Payment";
  }

  // Parse time phrase
  if (text.includes("due tomorrow") || text.includes("tomorrow")) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    deadline = tomorrow;
    title = title.replace(/due tomorrow/i, "").replace(/tomorrow/i, "");
  } else if (text.includes("due today") || text.includes("today")) {
    const today = new Date();
    today.setHours(23, 59, 0, 0);
    deadline = today;
    title = title.replace(/due today/i, "").replace(/today/i, "");
  } else {
    const hoursMatch = text.match(/in (\d+) hours/i) || text.match(/in (\d+) hour/i);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1]);
      const date = new Date();
      date.setHours(date.getHours() + hours);
      deadline = date;
      title = title.replace(new RegExp(`in ${hours} hours`, "i"), "").replace(new RegExp(`in ${hours} hour`, "i"), "");
    }
  }

  // Strip "add" or "add a" prefixes
  if (title.toLowerCase().startsWith("add a ")) {
    title = title.substring(6);
  } else if (title.toLowerCase().startsWith("add ")) {
    title = title.substring(4);
  }

  title = title.replace(/^[,\s.]+/, "").replace(/[,\s.]+$/, "").trim();
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  // Convert to local YYYY-MM-DDTHH:mm for datetime-local input fields
  const tzoffset = (new Date()).getTimezoneOffset() * 60000; // offset in milliseconds
  const localISOTime = (new Date(deadline.getTime() - tzoffset)).toISOString().slice(0, 16);

  return {
    title: title || "New Task",
    deadline: localISOTime,
    category
  };
}
