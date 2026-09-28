import express from "express";
import fs from "fs";

const app = express();
app.use(express.json());

function readTasks() {
  const raw = fs.readFileSync("data.json", "utf8");
  const tasks = JSON.parse(raw);
  return Array.isArray(tasks) ? tasks : [tasks];
}

function writeTasks(tasks) {
  fs.writeFileSync("data.json", JSON.stringify(tasks, null, 2));
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/tasks", (req, res) => {
  const { status } = req.query;

  if (status && status !== "completed" && status !== "pending") {
    return res.status(400).json({ error: "status must be completed or pending" });
  }

  const tasks = readTasks();
  let result = tasks;
  if (status === "completed") {
    result = tasks.filter((task) => task.completed);
  } else if (status === "pending") {
    result = tasks.filter((task) => !task.completed);
  }

  res.status(200).json(result);
});

app.post("/api/tasks", (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  const tasks = readTasks();
  const nextId = tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
  const task = {
    id: nextId,
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  writeTasks(tasks);
  res.status(201).json(task);
});

app.patch("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const tasks = readTasks();
  const task = tasks.find((item) => item.id === id);
  if (!task) {
    return res.status(404).json({ error: "task not found" });
  }

  const { title, completed } = req.body ?? {};

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title cannot be empty" });
    }
    task.title = title.trim();
  }

  if (completed !== undefined) {
    if (typeof completed !== "boolean") {
      return res.status(400).json({ error: "completed must be a boolean" });
    }
    task.completed = completed;
  }

  writeTasks(tasks);
  res.status(200).json(task);
});

app.delete("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const tasks = readTasks();
  const index = tasks.findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "task not found" });
  }

  tasks.splice(index, 1);
  writeTasks(tasks);
  res.status(204).send();
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
