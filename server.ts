import express from "express";
import path from "path";
import { promises as fs } from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Set high limits for support of multi-image attachments base64 stringified
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const DB_DIR = path.join(process.cwd(), "db-data");
const DB_PATH = path.join(DB_DIR, "projects.json");

// Ensure folder and store exist
async function ensureDbExists() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    try {
      await fs.access(DB_PATH);
    } catch {
      await fs.writeFile(DB_PATH, JSON.stringify([]), "utf-8");
    }
  } catch (e) {
    console.error("Error securing database structure:", e);
  }
}

// 1. GET ALL PROJECTS
app.get("/api/projects", async (req, res) => {
  try {
    await ensureDbExists();
    const raw = await fs.readFile(DB_PATH, "utf-8");
    const projects = JSON.parse(raw);
    res.json(projects);
  } catch (error) {
    console.error("Failed to read projects:", error);
    res.status(500).json({ error: "خطا در خواندن فایل پایگاه داده" });
  }
});

// 2. GET SINGLE PROJECT BY ID
app.get("/api/projects/:id", async (req, res) => {
  try {
    await ensureDbExists();
    const raw = await fs.readFile(DB_PATH, "utf-8");
    const projects = JSON.parse(raw);
    const project = projects.find((p: any) => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ error: "پروژه مورد نظر یافت نشد" });
    }
    res.json(project);
  } catch (error) {
    console.error(`Failed to get project by id ${req.params.id}:`, error);
    res.status(500).json({ error: "خطا در دریافت مشخصات پروژه" });
  }
});

// 3. SAVE OR UPDATE PROJECT
app.post("/api/projects", async (req, res) => {
  try {
    await ensureDbExists();
    const project = req.body;
    if (!project || !project.id) {
      return res.status(400).json({ error: "فرمت پروژه ارسالی نامعتبر است" });
    }

    const raw = await fs.readFile(DB_PATH, "utf-8");
    const projects = JSON.parse(raw);
    
    const existingIndex = projects.findIndex((p: any) => p.id === project.id);
    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }

    await fs.writeFile(DB_PATH, JSON.stringify(projects, null, 2), "utf-8");
    res.json({ status: "success", project });
  } catch (error) {
    console.error("Failed to save project:", error);
    res.status(500).json({ error: "خطا در ذخیره‌سازی اطلاعات روی سرور" });
  }
});

// 4. DELETE PROJECT
app.delete("/api/projects/:id", async (req, res) => {
  try {
    await ensureDbExists();
    const { id } = req.params;
    
    const raw = await fs.readFile(DB_PATH, "utf-8");
    let projects = JSON.parse(raw);
    projects = projects.filter((p: any) => p.id !== id);
    
    await fs.writeFile(DB_PATH, JSON.stringify(projects, null, 2), "utf-8");
    res.json({ status: "success", message: "پروژه با موفقیت حذف شد" });
  } catch (error) {
    console.error(`Failed to delete project ${req.params.id}:`, error);
    res.status(500).json({ error: "خطا در حذف پروژه از روی سرور" });
  }
});

// Mount Vite in development inside Express, or serve static build in production
async function startWebserver() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
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
    console.log(`[Express Backend DB] Server listening on port ${PORT}`);
  });
}

startWebserver();
