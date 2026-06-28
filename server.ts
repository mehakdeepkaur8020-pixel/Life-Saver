import express from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

import {
  createUser,
  findUserByEmail,
  hashPassword,
  getTasksForUser,
  createTask,
  updateTask,
  deleteTask,
  readDb,
  writeDb,
  Task
} from "./src/server/db";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent store for sessions to survive dev server restarts
const SESSIONS_PATH = path.join(process.cwd(), "data", "sessions.json");

function loadSessions(): Map<string, string> {
  const map = new Map<string, string>();
  try {
    if (fs.existsSync(SESSIONS_PATH)) {
      const data = fs.readFileSync(SESSIONS_PATH, "utf8");
      const obj = JSON.parse(data);
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
          map.set(key, value);
        }
      }
    }
  } catch (error) {
    console.error("Failed to load sessions from file:", error);
  }
  return map;
}

const sessions = loadSessions();

function saveSessions() {
  try {
    const obj: Record<string, string> = {};
    for (const [key, value] of sessions.entries()) {
      obj[key] = value;
    }
    const dir = path.dirname(SESSIONS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SESSIONS_PATH, JSON.stringify(obj, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to save sessions to file:", error);
  }
}

// Authentication Middleware
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  const userId = sessions.get(token);
  if (!userId) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }

  (req as any).userId = userId;
  next();
}

// Lazy initialization of Gemini client
let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiInstance;
}

// Wrapper to call Gemini with robust fallbacks in case of high demand (503) or other transient errors
async function generateContentWithFallback(
  ai: GoogleGenAI,
  options: {
    contents: string;
    responseSchema?: any;
    systemInstruction?: string;
  }
) {
  // Try 1: gemini-3.5-flash
  try {
    const config: any = {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    };
    if (options.responseSchema) {
      config.responseSchema = options.responseSchema;
    }
    if (options.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }
    
    return await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: options.contents,
      config,
    });
  } catch (error: any) {
    console.log("[Gemini Fallback] Primary model failed: " + (error.message || error));
    
    // Try 2: gemini-3.1-flash-lite
    try {
      const config: any = {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      };
      if (options.responseSchema) {
        config.responseSchema = options.responseSchema;
      }
      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      
      return await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: options.contents,
        config,
      });
    } catch (fallbackError: any) {
      console.log("[Gemini Fallback] Secondary model failed: " + (fallbackError.message || fallbackError));
      
      // Try 3: gemini-flash-latest (as a last resort stable model)
      const config: any = {
        responseMimeType: "application/json",
      };
      if (options.responseSchema) {
        config.responseSchema = options.responseSchema;
      }
      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      
      return await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: options.contents,
        config,
      });
    }
  }
}

// Helper to extract JSON block from markdown fences or commentary
function extractJson(text: string): any {
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  
  let startIdx = -1;
  let endIdx = -1;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = text.lastIndexOf("}");
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = text.lastIndexOf("]");
  }
  
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error("The AI response did not contain a valid JSON block.");
  }
  
  const jsonStr = text.substring(startIdx, endIdx + 1);
  return JSON.parse(jsonStr);
}

// AUTHENTICATION ENDPOINTS
app.post("/api/auth/signup", (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ error: "Email, password, and name are required." });
    return;
  }

  const existingUser = findUserByEmail(email);
  if (existingUser) {
    res.status(400).json({ error: "User with this email already exists." });
    return;
  }

  try {
    const user = createUser(email, password, name);
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, user.id);
    saveSessions();
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const user = findUserByEmail(email);
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(400).json({ error: "Invalid email or password." });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, user.id);
  saveSessions();
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const userId = sessions.get(token);
  if (!userId) {
    res.status(401).json({ error: "Session expired or invalid" });
    return;
  }

  const db = readDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

// TASK CRUD ENDPOINTS
app.get("/api/tasks", authenticateToken, (req, res) => {
  const userId = (req as any).userId;
  const tasks = getTasksForUser(userId);
  res.json(tasks);
});

app.post("/api/tasks", authenticateToken, (req, res) => {
  const userId = (req as any).userId;
  const { title, description, deadline, category, priority, status } = req.body;

  if (!title || !deadline || !category) {
    res.status(400).json({ error: "Title, deadline, and category are required." });
    return;
  }

  try {
    const task = createTask(userId, {
      title,
      description: description || "",
      deadline,
      category,
      priority: priority || "Unranked",
      status: status || "Pending"
    });
    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/tasks/:id", authenticateToken, (req, res) => {
  const userId = (req as any).userId;
  const taskId = req.params.id;

  try {
    const updated = updateTask(userId, taskId, req.body);
    if (!updated) {
      res.status(404).json({ error: "Task not found." });
      return;
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/tasks/:id", authenticateToken, (req, res) => {
  const userId = (req as any).userId;
  const taskId = req.params.id;

  try {
    const success = deleteTask(userId, taskId);
    if (!success) {
      res.status(404).json({ error: "Task not found." });
      return;
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI ENDPOINTS (GEMINI API)

// 1. AI Prioritize
app.post("/api/ai/prioritize", authenticateToken, async (req, res) => {
  const userId = (req as any).userId;
  const tasks = getTasksForUser(userId).filter(t => t.status === "Pending");

  if (tasks.length === 0) {
    res.status(400).json({ error: "No pending tasks found to prioritize." });
    return;
  }

  try {
    const ai = getAI();
    const currentTime = "2026-06-28T00:40:11-07:00";

    const prompt = `You are an expert AI productivity assistant.
The current date and time is: ${currentTime}.
I am providing you with a list of my pending tasks.
Your job is to assign each task a priority of "High", "Medium", or "Low" based on BOTH deadline urgency AND the workload/complexity suggested in the description (e.g., studying for an exam or coding a big assignment is complex and deserves High or Medium priority, whereas a 5-minute utility bill payment might be Low or Medium priority even if due soon).

Return a strict JSON object with a single root array "priorities". Each item in "priorities" must contain:
- "taskId": string matching the task's ID
- "priority": must be exactly "High", "Medium", or "Low"
- "reason": brief, encouraging explanation (15 words max) for why this priority was assigned

Tasks:
${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, description: t.description, deadline: t.deadline, category: t.category })), null, 2)}`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      responseSchema: {
        type: Type.OBJECT,
        required: ["priorities"],
        properties: {
          priorities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["taskId", "priority", "reason"],
              properties: {
                taskId: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                reason: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from AI model.");
    }

    const result = extractJson(text);
    const db = readDb();

    // Apply the suggested priorities to the DB
    let countUpdated = 0;
    if (result && Array.isArray(result.priorities)) {
      result.priorities.forEach((item: any) => {
        const taskIdx = db.tasks.findIndex(t => t.id === item.taskId && t.userId === userId);
        if (taskIdx !== -1) {
          db.tasks[taskIdx].priority = item.priority;
          countUpdated++;
        }
      });
      writeDb(db);
    }

    res.json({
      success: true,
      updatedCount: countUpdated,
      suggestions: result.priorities,
      tasks: getTasksForUser(userId)
    });
  } catch (error: any) {
    console.error("AI Prioritize error:", error);
    res.status(500).json({ error: error.message || "Failed to prioritize tasks via AI." });
  }
});

// 2. AI Schedule Generator
app.post("/api/ai/schedule", authenticateToken, async (req, res) => {
  const userId = (req as any).userId;
  const tasks = getTasksForUser(userId).filter(t => t.status === "Pending");

  if (tasks.length === 0) {
    res.status(400).json({ error: "No pending tasks found to build a schedule." });
    return;
  }

  try {
    const ai = getAI();
    const currentTime = "2026-06-28T00:40:11-07:00";

    const prompt = `You are an expert schedule planner.
The current date and time is: ${currentTime}.
Create a realistic hourly timeline/timetable for the rest of today based on these pending tasks.
The timeline must respect urgency, estimated task complexity, and include short breaks where reasonable.
Return a strict JSON object with a root key "schedule" containing an array of schedule slots.
Each slot must contain:
- "startTime": "HH:MM" format
- "endTime": "HH:MM" format
- "taskName": string (one of the task titles, or "Break", "Short Nap", "Meals", "Stretch Break")
- "note": very short encouraging tip or focus directive (max 15 words)

Tasks:
${JSON.stringify(tasks.map(t => ({ title: t.title, description: t.description, deadline: t.deadline, category: t.category, priority: t.priority })), null, 2)}`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      responseSchema: {
        type: Type.OBJECT,
        required: ["schedule"],
        properties: {
          schedule: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["startTime", "endTime", "taskName", "note"],
              properties: {
                startTime: { type: Type.STRING },
                endTime: { type: Type.STRING },
                taskName: { type: Type.STRING },
                note: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from AI model.");
    }

    const result = extractJson(text);
    res.json(result);
  } catch (error: any) {
    console.error("AI Schedule error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI schedule." });
  }
});

// 3. AI Recommendations
app.post("/api/ai/recommendations", authenticateToken, async (req, res) => {
  const userId = (req as any).userId;
  const tasks = getTasksForUser(userId).filter(t => t.status === "Pending");

  if (tasks.length === 0) {
    res.status(400).json({ error: "No pending tasks found to analyze." });
    return;
  }

  try {
    const ai = getAI();
    const currentTime = "2026-06-28T00:40:11-07:00";

    const prompt = `You are a professional productivity mentor.
The current date and time is: ${currentTime}.
Analyze my pending tasks and recommend an ordered roadmap of what to do first.
Provide:
1. One overall encouraging summary paragraph outlining the focus strategy for the day.
2. An ordered list of recommendations. For each recommendation, provide:
   - "order": number starting at 1
   - "taskTitle": title of the task
   - "timeAllocationMinutes": suggested time to allocate for this chunk in minutes (e.g. 30, 45, 90)
   - "tip": high-impact, actionable, direct tip (max 20 words) for how to tackle this efficiently

Return a strict JSON object with root keys "summary" (string) and "recommendations" (array).

Tasks:
${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, description: t.description, deadline: t.deadline, category: t.category, priority: t.priority })), null, 2)}`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      responseSchema: {
        type: Type.OBJECT,
        required: ["summary", "recommendations"],
        properties: {
          summary: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["order", "taskTitle", "timeAllocationMinutes", "tip"],
              properties: {
                order: { type: Type.INTEGER },
                taskTitle: { type: Type.STRING },
                timeAllocationMinutes: { type: Type.INTEGER },
                tip: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from AI model.");
    }

    const result = extractJson(text);
    res.json(result);
  } catch (error: any) {
    console.error("AI Recommendations error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI recommendations." });
  }
});

// 4. Auto Rescue Mode
app.post("/api/ai/rescue", authenticateToken, async (req, res) => {
  const userId = (req as any).userId;
  const { taskId } = req.body;

  if (!taskId) {
    res.status(400).json({ error: "Task ID is required for Rescue Mode." });
    return;
  }

  const db = readDb();
  const task = db.tasks.find(t => t.id === taskId && t.userId === userId);

  if (!task) {
    res.status(404).json({ error: "Task not found." });
    return;
  }

  try {
    const ai = getAI();
    const currentTime = "2026-06-28T00:40:11-07:00";

    const prompt = `You are an elite productivity crisis rescue specialist.
I am dealing with a critical deadline that is less than 24 hours away.
Task details:
- Title: ${task.title}
- Description: ${task.description}
- Category: ${task.category}
- Deadline: ${task.deadline}

Current time is: ${currentTime}.

Please break this task down into immediate, actionable, sequential steps that can be started right now.
For each step, specify:
- "stepNumber": integer starting at 1
- "title": short name of this step
- "durationMinutes": estimated duration in minutes
- "description": brief action directive

Also provide:
- "totalEstimatedMinutes": total sum of minutes of all steps combined
- "verdict": must be exactly "achievable" or "not achievable" based on the remaining hours from now (${currentTime}) until the deadline (${task.deadline}).
- "verdictReason": brief explanation of why it is or isn't achievable and how to successfully pull it off (encouraging but highly realistic).

Return a strict JSON object with root keys "totalEstimatedMinutes", "verdict", "verdictReason", and "steps" (array).`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      responseSchema: {
        type: Type.OBJECT,
        required: ["totalEstimatedMinutes", "verdict", "verdictReason", "steps"],
        properties: {
          totalEstimatedMinutes: { type: Type.INTEGER },
          verdict: { type: Type.STRING, enum: ["achievable", "not achievable"] },
          verdictReason: { type: Type.STRING },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["stepNumber", "title", "durationMinutes", "description"],
              properties: {
                stepNumber: { type: Type.INTEGER },
                title: { type: Type.STRING },
                durationMinutes: { type: Type.INTEGER },
                description: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from AI model.");
    }

    const result = extractJson(text);
    res.json(result);
  } catch (error: any) {
    console.error("AI Rescue error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI Rescue plan." });
  }
});


// FRONTEND ROUTING & VITE MIDDLEWARE
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
