import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export type TaskCategory = 'Assignment' | 'Exam' | 'Meeting' | 'Interview' | 'Bill Payment' | 'General';
export type TaskPriority = 'High' | 'Medium' | 'Low' | 'Unranked';
export type TaskStatus = 'Pending' | 'Complete';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  deadline: string; // ISO format
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  tasks: Task[];
}

const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Ensure data directory exists
function ensureDbExists() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], tasks: [] }, null, 2), "utf8");
  }
}

export function readDb(): DatabaseSchema {
  ensureDbExists();
  try {
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data) as DatabaseSchema;
  } catch (error) {
    console.error("Error reading database:", error);
    return { users: [], tasks: [] };
  }
}

export function writeDb(data: DatabaseSchema) {
  ensureDbExists();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing database:", error);
  }
}

// Helpers for Auth
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "salt_life_saver_123").digest("hex");
}

export function findUserByEmail(email: string): User | undefined {
  const db = readDb();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(email: string, passwordPlain: string, name: string): User {
  const db = readDb();
  const newUser: User = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    name: name,
    passwordHash: hashPassword(passwordPlain)
  };
  db.users.push(newUser);
  writeDb(db);
  return newUser;
}

// Helpers for Tasks
export function getTasksForUser(userId: string): Task[] {
  const db = readDb();
  return db.tasks.filter(t => t.userId === userId);
}

export function createTask(userId: string, task: Omit<Task, "id" | "userId" | "createdAt">): Task {
  const db = readDb();
  const newTask: Task = {
    ...task,
    id: crypto.randomUUID(),
    userId,
    createdAt: new Date().toISOString()
  };
  db.tasks.push(newTask);
  writeDb(db);
  return newTask;
}

export function updateTask(userId: string, taskId: string, updates: Partial<Omit<Task, "id" | "userId" | "createdAt">>): Task | null {
  const db = readDb();
  const taskIndex = db.tasks.findIndex(t => t.id === taskId && t.userId === userId);
  if (taskIndex === -1) return null;

  const updatedTask = {
    ...db.tasks[taskIndex],
    ...updates
  };
  db.tasks[taskIndex] = updatedTask;
  writeDb(db);
  return updatedTask;
}

export function deleteTask(userId: string, taskId: string): boolean {
  const db = readDb();
  const initialLength = db.tasks.length;
  db.tasks = db.tasks.filter(t => !(t.id === taskId && t.userId === userId));
  writeDb(db);
  return db.tasks.length < initialLength;
}
