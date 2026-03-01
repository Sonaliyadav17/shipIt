import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import dns from "dns";
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from "./models/User.js";
import Project from "./models/Project.js";
import Task from "./models/Task.js";
import InvestmentInterest from "./models/InvestmentInterest.js";
import NocAgreement from "./models/NocAgreement.js";
import ThinkingNote from "./models/ThinkingNote.js";
import Invite from "./models/Invite.js";
import nodemailer from "nodemailer";
import { jsPDF } from "jspdf";
import groq from "./config/groq.js";

import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Or specify exact frontend URLs
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

// handle server errors, notably EADDRINUSE when port is occupied
httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${process.env.PORT || 4000} is already in use. ` +
                  'If you have another instance running, stop it or set a different PORT.');
    process.exit(1);
  } else {
    throw err;
  }
});

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Load env with project root taking precedence.
// First load the project root .env so it can provide canonical values,
// then load server/.env to fill any missing values without overriding.
// Prefer values from the project root .env — read and copy explicitly so
// root values override any placeholders in server/.env.
try {
  const rootPath = fileURLToPath(new URL('../.env', import.meta.url));
  if (fs.existsSync(rootPath)) {
    console.log('Found project root .env at', rootPath);
    const raw = fs.readFileSync(rootPath, { encoding: 'utf8' });
    const parsed = dotenv.parse(raw);
    console.log('root .env parsed keys:', Object.keys(parsed));
    if (parsed.MONGODB_URI) console.log('root MONGODB_URI (masked):', maskMongoUri(parsed.MONGODB_URI));
    Object.entries(parsed).forEach(([k, v]) => {
      process.env[k] = v;
    });
  } else {
    console.log('No project root .env found at', rootPath);
  }
} catch (e) {
  // ignore
}
// load local server/.env to fill any remaining missing variables
dotenv.config();

console.log(`Groq key exists: ${!!process.env.GROQ_API_KEY}`);

const MONGODB_URI = process.env.MONGODB_URI;
// Print a masked form of the URI to help diagnose overriding issues without exposing secrets
function maskMongoUri(uri) {
  try {
    const parts = uri.split('@');
    if (parts.length === 2) {
      const left = parts[0];
      const right = parts[1];
      const userPart = left.split('//')[1] || left;
      const user = userPart.split(':')[0];
      return `mongodb://${user}:***@${right}`;
    }
  } catch (e) { }
  return uri.replace(/:[^:/@]+@/, ':***@');
}
console.log('MONGODB_URI (masked):', maskMongoUri(MONGODB_URI || ''));
if (!MONGODB_URI) {
  console.error("MONGODB_URI not set — please set MONGODB_URI in server/.env or project root .env");
  process.exit(1);
}

// validate scheme
if (!(MONGODB_URI.startsWith('mongodb://') || MONGODB_URI.startsWith('mongodb+srv://'))) {
  console.error('Invalid MONGODB_URI scheme — expected mongodb:// or mongodb+srv://');
  process.exit(1);
}

// Work around DNS issues when using mongodb+srv URIs. Atlas clusters rely on SRV lookups
// which can fail if the local resolver blocks outbound DNS or if you're on a restrictive
// network.  Point Node at well‑known public resolvers before attempting to connect.
// This makes the code more resilient out of the box.
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (err) {
  // dns.setServers may throw in some environments; log and continue without crashing
  console.warn("Could not override DNS servers:", err.message);
}

// Connect to MongoDB and only start server after connection succeeds
const PORT = process.env.PORT || 4000;

mongoose.connect(MONGODB_URI, { dbName: "shipit" })
  .then(() => {
    console.log("Connected to MongoDB");
    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    // If the failure was due to an SRV lookup we often see "querySrv ECONNREFUSED".
    // Include a more actionable message so the developer can switch to a non-SRV
    // connection string or check their network/firewall settings.
    console.error('MongoDB connection error:', err.message);
    if (/querySrv/i.test(err.message)) {
      console.error(
        'DNS lookup for SRV record failed. Either your network is blocking DNS or '
        + 'the MongoDB URI is incorrect.  You can avoid SRV lookups by using the '
        + 'explicit (mongodb://) connection string that Atlas provides, or configure '
        + 'dns.setServers([...]) to a working resolver.  See README for details.'
      );
    }
    process.exit(1);
  });

// POST /api/auth/user -> check or create user
app.post("/api/auth/user", async (req, res) => {
  try {
    const { uid, name, email, role } = req.body;
    if (!uid || !email) return res.status(400).json({ error: "Missing uid or email" });

    let user = await User.findOne({ uid });
    if (user) {
      return res.json({ user, created: false });
    }

    // create new user; only include role field if the caller supplied one
    const newUserData = { uid, name: name || "", email };
    if (role !== undefined && role !== null) {
      newUserData.role = role;
    }

    user = new User(newUserData);
    await user.save();
    const needsRole = !user.role;
    return res.json({ user, created: true, needsRole });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/auth/user/:uid -> fetch user
app.get("/api/auth/user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/auth/user/:uid -> update user
app.patch("/api/auth/user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    // strip out any fields explicitly set to null since our schema no longer
    // accepts null for enums/strings; undefined fields simply won't be updated.
    const rawUpdates = req.body || {};
    const updates = {};
    Object.entries(rawUpdates).forEach(([k, v]) => {
      if (v !== null) updates[k] = v;
    });

    const user = await User.findOneAndUpdate({ uid }, updates, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/settings/:uid -> get settings info
app.get("/api/settings/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
      appearance: user.appearance || "dark",
      notifications: user.notifications || { emailNotif: true, pushNotif: true, inAppAlerts: false }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/settings/:uid -> update user settings and profile
app.patch("/api/settings/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, appearance, notifications } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (appearance) updates.appearance = appearance;
    if (notifications) updates.notifications = notifications;

    const user = await User.findOneAndUpdate({ uid }, updates, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/projects -> create new project, save to MongoDB
app.post("/api/projects", async (req, res) => {
  try {
    const { title, description, status, dueDate, ownerId, teamMembers, progress, isOpenToInvestment } = req.body;
    if (!title || !ownerId) {
      return res.status(400).json({ error: "Missing required fields: title or ownerId" });
    }
    const project = new Project({
      title,
      description,
      status: status || "active",
      dueDate,
      ownerId,
      teamMembers: teamMembers || [],
      progress: progress || 0,
      isOpenToInvestment: isOpenToInvestment || false
    });
    await project.save();
    return res.status(201).json(project);
  } catch (err) {
    console.error("Error creating project:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/projects/open -> fetch all projects where isOpenToInvestment is true (must be before /:uid)
app.get("/api/projects/open", async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { isOpenToInvestment: true },
        { isOpenToInvestment: "true" }
      ]
    }).sort({ createdAt: -1 }).lean();
    const enrichedProjects = await Promise.all(projects.map(async (p) => {
      const owner = await User.findOne({ uid: p.ownerId }).lean();
      return { ...p, id: p._id, builderName: owner?.name || "Unknown Builder" };
    }));
    console.log("Open projects found:", enrichedProjects.length, enrichedProjects);
    return res.json(enrichedProjects);
  } catch (err) {
    console.error("Error fetching open investment projects:", err);
    return res.status(500).json({ error: "Failed to fetch open projects" });
  }
});

// GET /api/projects/:uid -> fetch all projects belonging to this user
app.get("/api/projects/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    // Projects where user is the owner OR is a team member
    const projects = await Project.find({
      $or: [{ ownerId: uid }, { teamMembers: uid }]
    }).sort({ createdAt: -1 });
    return res.json(projects);
  } catch (err) {
    console.error("Error fetching projects:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/projects/:id -> delete a project
app.delete("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    return res.json({ success: true });
  } catch (err) {
    console.error("Error deleting project:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/projects/:id/investment-toggle -> toggle open to investment on or off
app.patch("/api/projects/:id/investment-toggle", async (req, res) => {
  try {
    const { id } = req.params;
    const { isOpenToInvestment } = req.body;

    const project = await Project.findByIdAndUpdate(
      id,
      { isOpenToInvestment: Boolean(isOpenToInvestment) },
      { new: true }
    ).lean();
    if (!project) return res.status(404).json({ error: "Project not found" });

    return res.json({ ...project, id: project._id });
  } catch (err) {
    console.error("Error toggling investment:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Helper function to recalculate project progress based on tasks
async function recalculateProjectProgress(projectId) {
  try {
    const tasks = await Task.find({ projectId });
    if (tasks.length === 0) {
      return await Project.findByIdAndUpdate(projectId, { progress: 0 });
    }
    const doneTasks = tasks.filter(t => t.status === "done");
    const progress = Math.round((doneTasks.length / tasks.length) * 100);
    return await Project.findByIdAndUpdate(projectId, { progress });
  } catch (err) {
    console.error(`Failed to recalculate progress for project ${projectId}:`, err);
  }
}

// POST /api/tasks -> create new task, save to MongoDB
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description, status, priority, projectId, projectName, assigneeId, assigneeName, dueDate } = req.body;
    if (!title || !projectId) {
      return res.status(400).json({ error: "Missing required fields: title or projectId" });
    }
    const task = new Task({
      title,
      description,
      status: status || "todo",
      priority: priority || "medium",
      projectId,
      projectName: projectName || "Unknown Project",
      assigneeId,
      assigneeName,
      dueDate
    });
    await task.save();
    await recalculateProjectProgress(projectId);
    return res.status(201).json(task);
  } catch (err) {
    console.error("Error creating task:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/tasks/user/:uid -> fetch all tasks assigned to this user across all projects
app.get("/api/tasks/user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const tasks = await Task.find({ assigneeId: uid }).sort({ createdAt: -1 });
    return res.json(tasks);
  } catch (err) {
    console.error("Error fetching user tasks:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/tasks/project/:projectId -> fetch all tasks belonging to a specific project
app.get("/api/tasks/project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ projectId }).sort({ createdAt: 1 });
    return res.json(tasks);
  } catch (err) {
    console.error("Error fetching project tasks:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/tasks/:id -> update task details, status, or priority
app.patch("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const task = await Task.findByIdAndUpdate(id, updates, { new: true });
    if (!task) return res.status(404).json({ error: "Task not found" });
    await recalculateProjectProgress(task.projectId);
    return res.json(task);
  } catch (err) {
    console.error("Error updating task:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/tasks/:id/status -> update only the status of a task
app.patch("/api/tasks/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });
    const task = await Task.findByIdAndUpdate(id, { status }, { new: true });
    if (!task) return res.status(404).json({ error: "Task not found" });
    await recalculateProjectProgress(task.projectId);
    return res.json(task);
  } catch (err) {
    console.error("Error updating task status:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/tasks/:id -> delete a task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    await recalculateProjectProgress(task.projectId);
    return res.json({ success: true });
  } catch (err) {
    console.error("Error deleting task:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/investor/interest -> investor sends interest request
app.post("/api/investor/interest", async (req, res) => {
  try {
    const { projectId, projectName, builderId, investorId, investorName, contributionType, amount, ideaDescription } = req.body;
    if (!projectId || !builderId || !investorId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const existing = await InvestmentInterest.findOne({ projectId, investorId });
    if (existing) {
      return res.status(400).json({ error: "Already expressed interest in this project" });
    }
    const interest = new InvestmentInterest({
      projectId,
      projectName,
      builderId,
      investorId,
      investorName,
      contributionType,
      amount,
      ideaDescription
    });
    await interest.save();
    return res.status(201).json(interest);
  } catch (err) {
    console.error("Error creating investment interest:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/investor/interest/:investorId -> fetch interests sent by this investor
app.get("/api/investor/interest/:investorId", async (req, res) => {
  try {
    const { investorId } = req.params;
    const interests = await InvestmentInterest.find({ investorId }).sort({ createdAt: -1 });
    return res.json(interests);
  } catch (err) {
    console.error("Error fetching investor interests:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/investor/interest/project/:projectId -> fetch investor interests for a specific project
app.get("/api/investor/interest/project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const interests = await InvestmentInterest.find({ projectId }).sort({ createdAt: -1 });
    return res.json(interests);
  } catch (err) {
    console.error("Error fetching project interests:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/investor/interest/:id -> builder accepts or rejects investor interest
app.patch("/api/investor/interest/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'accepted' or 'rejected'" });
    }

    const interest = await InvestmentInterest.findByIdAndUpdate(id, { status }, { new: true });
    if (!interest) return res.status(404).json({ error: "Interest not found" });

    // Auto-create NOC if accepted
    if (status === "accepted") {
      // Fetch the builder details to ensure we have the builder name, or it should be passed optionally
      // Let's assume the user context isn't strictly attached here so we fetch it from Project
      const project = await Project.findById(interest.projectId);
      let builderName = "Builder";
      if (project) {
        const user = await User.findOne({ uid: project.ownerId });
        if (user) builderName = user.name;
      }

      const existingNoc = await NocAgreement.findOne({ projectId: interest.projectId, investorId: interest.investorId });
      if (!existingNoc) {
        const noc = new NocAgreement({
          projectId: interest.projectId,
          projectName: interest.projectName,
          builderId: interest.builderId,
          builderName: builderName,
          investorId: interest.investorId,
          investorName: interest.investorName,
        });
        await noc.save();
      }
    }

    return res.json(interest);
  } catch (err) {
    console.error("Error patching interest:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/noc -> create new NOC agreement between builder and investor
app.post("/api/noc", async (req, res) => {
  try {
    const { projectId, projectName, builderId, builderName, investorId, investorName } = req.body;
    if (!projectId || !builderId || !investorId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const noc = new NocAgreement({
      projectId,
      projectName,
      builderId,
      builderName,
      investorId,
      investorName
    });
    await noc.save();
    return res.status(201).json(noc);
  } catch (err) {
    console.error("Error creating NOC:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/noc/:uid -> fetch all NOC agreements for this user
app.get("/api/noc/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const nocs = await NocAgreement.find({
      $or: [{ builderId: uid }, { investorId: uid }]
    }).sort({ createdAt: -1 });
    return res.json(nocs);
  } catch (err) {
    console.error("Error fetching NOCs:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/noc/doc/:id -> fetch single NOC document
app.get("/api/noc/doc/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const noc = await NocAgreement.findById(id);
    if (!noc) return res.status(404).json({ error: "NOC not found" });
    return res.json(noc);
  } catch (err) {
    console.error("Error fetching single NOC:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/noc/:id/sign -> one party signs the NOC
app.patch("/api/noc/:id/sign", async (req, res) => {
  try {
    const { id } = req.params;
    const { signature, role } = req.body; // role: 'builder' | 'investor'

    if (!signature || !["builder", "investor"].includes(role)) {
      return res.status(400).json({ error: "Invalid signature or role" });
    }

    const noc = await NocAgreement.findById(id);
    if (!noc) return res.status(404).json({ error: "NOC not found" });

    if (role === "builder") {
      noc.builderSignature = signature;
      noc.builderSignedAt = new Date();
    } else {
      noc.investorSignature = signature;
      noc.investorSignedAt = new Date();
    }

    if (noc.builderSignature && noc.investorSignature) {
      noc.status = "signed";
    }

    await noc.save();
    return res.json(noc);
  } catch (err) {
    console.error("Error signing NOC:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/noc/:id/download -> download signed NOC as PDF
app.get("/api/noc/:id/download", async (req, res) => {
  try {
    const { id } = req.params;
    const noc = await NocAgreement.findById(id);

    if (!noc) return res.status(404).json({ error: "NOC not found" });

    if (noc.status !== "signed") {
      return res.status(400).json({ error: "Agreement is not fully signed yet" });
    }

    // Initialize jsPDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Headers & Logos
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(33, 150, 243); // Primary blue
    doc.text("ShipIt", 20, 20);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    const title = "NON-OBJECTION & CONFIDENTIALITY AGREEMENT";
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, 40);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const dateSignedFormatted = new Date(noc.builderSignedAt || Date.now()).toLocaleDateString();
    doc.text(`Date of Agreement: ${dateSignedFormatted}`, 20, 50);

    // Parties & Details
    doc.setFontSize(12);
    doc.text("This agreement is entered into by and between:", 20, 65);

    doc.setFont("helvetica", "bold");
    doc.text("Builder:", 30, 75);
    doc.setFont("helvetica", "normal");
    doc.text(noc.builderName || "Unknown Builder", 60, 75);

    doc.setFont("helvetica", "bold");
    doc.text("Investor:", 30, 82);
    doc.setFont("helvetica", "normal");
    doc.text(noc.investorName || "Unknown Investor", 60, 82);

    doc.setFont("helvetica", "bold");
    doc.text("Project:", 30, 89);
    doc.setFont("helvetica", "normal");
    doc.text(noc.projectName || "Unknown Project", 60, 89);

    // Terms
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Terms & Conditions:", 20, 105);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const terms = [
      "1. The investor agrees not to share, replicate, or misuse any project idea, data, or technical plan shared during collaboration.",
      "2. The builder agrees not to misuse any funds, resources, or contacts provided by the investor.",
      "3. Both parties agree that any breach of this mutual confidentiality agreement may result in legal action under applicable laws.",
      "4. This agreement is legally binding from the date of digital signature by both participating parties."
    ];

    let yOffset = 115;
    terms.forEach(term => {
      // Split text into lines to fit page
      const lines = doc.splitTextToSize(term, pageWidth - 40);
      doc.text(lines, 25, yOffset);
      yOffset += (lines.length * 6) + 4;
    });

    // Signatures
    yOffset += 20;
    doc.line(20, yOffset - 5, pageWidth - 20, yOffset - 5);

    // Builder Signature Block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("BUILDER SIGNATURE", 30, yOffset + 5);

    doc.setFont("times", "italic"); // Use times italic to simulate signature
    doc.setFontSize(22);
    doc.setTextColor(34, 197, 94); // Greenish
    doc.text(noc.builderSignature || "Signed", 30, yOffset + 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(`Digitally Signed on ${new Date(noc.builderSignedAt).toLocaleString()}`, 30, yOffset + 28);

    // Investor Signature Block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("INVESTOR SIGNATURE", 120, yOffset + 5);

    doc.setFont("times", "italic");
    doc.setFontSize(22);
    doc.setTextColor(34, 197, 94);
    doc.text(noc.investorSignature || "Signed", 120, yOffset + 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(`Digitally Signed on ${new Date(noc.investorSignedAt).toLocaleString()}`, 120, yOffset + 28);


    const pdfBuffer = doc.output("arraybuffer");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="NOC-${noc.projectName.replace(/\s+/g, '-')}-${Date.now()}.pdf"`);

    return res.end(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error("Error generating PDF:", err);
    return res.status(500).json({ error: "Server error generating PDF" });
  }
});

// --- Analytics Endpoints --- //

// GET /api/analytics/weekly/:uid -> fetch tasks completed per day for the last 7 days
app.get("/api/analytics/weekly/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 6);
    lastWeek.setHours(0, 0, 0, 0);

    const tasks = await Task.find({
      assigneeId: uid,
      status: "Done",
      completedAt: { $gte: lastWeek, $lte: today }
    });

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyData = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(lastWeek);
      d.setDate(lastWeek.getDate() + i);
      const dayStr = days[d.getDay()];
      const count = tasks.filter(t => {
        const tDate = new Date(t.completedAt);
        return tDate.getDate() === d.getDate() && tDate.getMonth() === d.getMonth();
      }).length;

      weeklyData.push({ day: dayStr, tasks: count });
    }

    return res.json(weeklyData);
  } catch (err) {
    console.error("Error fetching weekly analytics:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/analytics/health/:uid -> fetch projects with health status
app.get("/api/analytics/health/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const projects = await Project.find({
      $or: [{ ownerId: uid }, { teamMembers: uid }]
    }).limit(10); // Limit to top 10 for dashboard size

    const healthData = projects.map(p => {
      let status = "Delayed";
      let color = "bg-destructive";

      if (p.progress >= 60) {
        status = "On Track";
        color = "bg-accent";
      } else if (p.progress >= 30) {
        status = "At Risk";
        color = "bg-[hsl(var(--warning))]";
      }

      return {
        name: p.title,
        status,
        color,
        progress: p.progress || 0
      };
    });

    return res.json(healthData);
  } catch (err) {
    console.error("Error fetching project health:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/analytics/heatmap/:uid -> fetch task completion count for 52 weeks
// Returing an array of 52 arrays
app.get("/api/analytics/heatmap/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Roughly 52 weeks ago
    const yearAgo = new Date(today);
    yearAgo.setDate(today.getDate() - (52 * 7) + 1);
    yearAgo.setHours(0, 0, 0, 0);

    const tasks = await Task.find({
      assigneeId: uid,
      status: "Done",
      completedAt: { $gte: yearAgo, $lte: today }
    });

    const heatmapData = [];
    let currentDate = new Date(yearAgo);

    for (let w = 0; w < 52; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        if (currentDate > today) {
          week.push(0);
        } else {
          const count = tasks.filter(t => {
            const tDate = new Date(t.completedAt);
            return tDate.getDate() === currentDate.getDate()
              && tDate.getMonth() === currentDate.getMonth()
              && tDate.getFullYear() === currentDate.getFullYear();
          }).length;
          // cap visual density max at 5
          week.push(Math.min(count, 5));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      heatmapData.push(week);
    }

    return res.json(heatmapData);
  } catch (err) {
    console.error("Error fetching heatmap:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// --- Thinking Space Endpoints --- //

// POST /api/thinking -> create note
app.post("/api/thinking", async (req, res) => {
  try {
    const { title, content, ownerId } = req.body;
    if (!ownerId || !title) return res.status(400).json({ error: "Missing title or ownerId" });

    const words = content ? content.split(/\s+/).filter(Boolean).length : 0;

    const note = new ThinkingNote({
      title,
      content,
      ownerId,
      wordCount: words
    });

    await note.save();
    return res.status(201).json(note);
  } catch (err) {
    console.error("Error creating note:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/thinking/:uid -> fetch all notes for user
app.get("/api/thinking/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const notes = await ThinkingNote.find({ ownerId: uid }).sort({ updatedAt: -1 });
    return res.json(notes);
  } catch (err) {
    console.error("Error fetching notes:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/thinking/note/:id -> fetch a single note by ID
app.get("/api/thinking/note/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const note = await ThinkingNote.findById(id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    return res.json(note);
  } catch (err) {
    console.error("Error fetching single note:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/thinking/:id -> update note content/tags
app.patch("/api/thinking/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) {
      updates.content = content;
      updates.wordCount = content.split(/\s+/).filter(Boolean).length;
    }
    if (tags !== undefined) updates.tags = tags;

    const note = await ThinkingNote.findByIdAndUpdate(id, updates, { new: true });
    if (!note) return res.status(404).json({ error: "Note not found" });
    return res.json(note);
  } catch (err) {
    console.error("Error patching note:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/thinking/:id -> delete note
app.delete("/api/thinking/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const note = await ThinkingNote.findByIdAndDelete(id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("Error deleting note:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/thinking/:id/convert -> convert note into a project
app.post("/api/thinking/:id/convert", async (req, res) => {
  try {
    const { id } = req.params;
    const note = await ThinkingNote.findById(id);
    if (!note) return res.status(404).json({ error: "Note not found" });

    if (note.status === "converted") {
      return res.status(400).json({ error: "Note is already converted" });
    }

    // Scaffold the new project
    const project = new Project({
      title: note.title,
      description: note.content,
      status: "active",
      ownerId: note.ownerId,
      teamMembers: [note.ownerId],
      progress: 0,
      aiPlan: note.aiPlan,
      pitchGenerated: note.pitchGenerated,
      pitchScore: note.pitchScore,
      thinkingNoteId: note._id
    });

    await project.save();

    // Mark the note as converted
    note.status = "converted";
    await note.save();

    return res.status(201).json(project);
  } catch (err) {
    console.error("Error converting note:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/thinking/note/:id/aiplan -> update AI Plan sections manually
app.patch("/api/thinking/note/:id/aiplan", async (req, res) => {
  try {
    const { id } = req.params;
    const { aiPlan } = req.body;

    if (!aiPlan) {
      return res.status(400).json({ error: "aiPlan data is required" });
    }

    const note = await ThinkingNote.findById(id);
    if (!note) return res.status(404).json({ error: "Thinking note not found" });

    // Update the aiPlan object and ensure pitchGenerated is true if it wasn't
    note.aiPlan = { ...note.aiPlan, ...aiPlan };
    note.pitchGenerated = true; // Mark as generated if manually filled
    await note.save();

    // Sync with existing linked project if any
    await Project.updateMany(
      { thinkingNoteId: id },
      { $set: { aiPlan: note.aiPlan, pitchGenerated: true } }
    );

    return res.json({ success: true, aiPlan: note.aiPlan });
  } catch (err) {
    console.error("Error updating AI Plan:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/ai/generate-pitch -> generate structured pitch using Groq
app.post("/api/ai/generate-pitch", async (req, res) => {
  try {
    const { noteId, content } = req.body;
    console.log(`Step A - Request received with content length: ${content ? content.length : 0}`);

    if (!noteId || !content) {
      return res.status(400).json({ error: "Missing noteId or content" });
    }

    if (content.split(/\s+/).filter(Boolean).length < 50) {
      return res.status(400).json({ error: "Idea description is too short. Please provide at least 50 words." });
    }

    const note = await ThinkingNote.findById(noteId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    const prompt = `You are a startup advisor. Based on this idea, generate a structured business plan. 
You MUST output ONLY valid JSON. Do not include any markdown or conversational text.
Use this exact structure:
{
  "summary": "One line summary",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "additionalIdeas": ["Idea 1", "Idea 2", "Idea 3"],
  "marketOpportunity": "Two sentences about the market",
  "businessPitch": "Three paragraphs investor ready",
  "risks": ["Risk 1", "Risk 2", "Risk 3"],
  "timeline": ["Week 1", "Week 2", "Week 3", "Week 4"]
}
Idea: ${content}`;

    console.log("Step B - Calling Groq API with model llama-3.1-8b-instant");
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    console.log("Step C - Groq responded successfully");

    let rawOutput = completion.choices[0]?.message?.content || "";
    // Clean up potential markdown blocks if present
    rawOutput = rawOutput.replace(/```json/gi, '').replace(/```/g, '').trim();

    let parsedPlan;
    try {
      parsedPlan = JSON.parse(rawOutput);

      // Ensure specific keys exist just in case
      const expectedKeys = ['summary', 'features', 'additionalIdeas', 'marketOpportunity', 'businessPitch', 'risks', 'timeline'];
      for (const key of expectedKeys) {
        if (!parsedPlan[key]) {
          parsedPlan[key] = Array.isArray(key === 'features' || key === 'additionalIdeas' || key === 'risks' || key === 'timeline') ? [] : "";
        }
      }
    } catch (parseErr) {
      console.error("Failed to parse Groq response as JSON. Raw Output:");
      console.error(rawOutput);
      throw new Error("AI returned malformed JSON");
    }

    // Calculate score
    let score = 0;
    const filledSections = Object.values(parsedPlan).filter(val => {
      if (Array.isArray(val)) return val.length > 0;
      return typeof val === 'string' && val.trim().length > 0;
    }).length;

    // Base score from filled sections (max ~7)
    score += filledSections;

    // Bonus score for length of original idea (max ~3)
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    if (wordCount >= 200) score += 3;
    else if (wordCount >= 100) score += 2;
    else if (wordCount >= 50) score += 1;

    score = Math.min(10, score); // Cap at 10

    // Update note with AI details
    note.aiPlan = parsedPlan;
    note.pitchGenerated = true;
    note.pitchScore = score;
    await note.save();

    return res.status(200).json({ aiPlan: parsedPlan, pitchScore: score });

  } catch (err) {
    console.error("AI Pitch Generation Error:", err);
    if (err.stack) console.error(err.stack);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

// POST /api/team/invite -> send email via nodemailer and save to DB
app.post("/api/team/invite", async (req, res) => {
  try {
    const { email, inviterId, inviterName } = req.body;
    if (!email || !inviterId) {
      return res.status(400).json({ error: "Missing email or inviterId" });
    }

    // Save pending invite to MongoDB
    const invite = new Invite({ email, inviterId, inviterName });
    await invite.save();

    // Use Gmail SMTP to send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "sneha191btcseai23@igdtuw.ac.in",
        pass: "dfyrlnniguawgcab" // App password provided in request
      }
    });

    const mailOptions = {
      from: '"ShipIt Team" <sneha191btcseai23@igdtuw.ac.in>',
      to: email,
      subject: "You've been invited to join ShipIt",
      text: `You have been invited to join ShipIt by ${inviterName || "a ShipIt member"}. Click here to sign up: http://localhost:5173/select-role`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You're invited!</h2>
          <p>You have been invited to join <strong>ShipIt</strong> by ${inviterName || "a ShipIt member"}.</p>
          <a href="http://localhost:5173/select-role" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 15px;">Accept Invitation</a>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: "Invite sent successfully" });
  } catch (err) {
    console.error("Error sending invite:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/activity/feed/:uid -> fetches latest tasks, projects, etc.
app.get("/api/activity/feed/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    // Fetch latest tasks the user is assigned to
    const recentTasks = await Task.find({ assigneeId: uid })
      .sort({ updatedAt: -1 })
      .limit(5);

    // Fetch latest projects the user is part of
    const recentProjects = await Project.find({
      $or: [{ ownerId: uid }, { teamMembers: uid }]
    }).sort({ createdAt: -1 }).limit(5);

    // Assemble uniform activity feed objects
    let feed = [];

    recentTasks.forEach(t => {
      feed.push({
        type: "task",
        text: `Task "${t.title}" was ${t.status === "Done" ? "completed" : "updated"}`,
        time: t.updatedAt || t.createdAt,
        id: t._id
      });
    });

    recentProjects.forEach(p => {
      feed.push({
        type: "project",
        text: `Project "${p.title}" details updated`,
        time: p.updatedAt || p.createdAt,
        id: p._id
      });
    });

    // Sort combined feed by time descending
    feed.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Format the timestamp nicely for initial view (limit to top 6)
    const formattedFeed = feed.slice(0, 6).map(item => ({
      ...item,
      timeString: new Date(item.time).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
      })
    }));

    return res.json(formattedFeed);
  } catch (err) {
    console.error("Error fetching activity feed:", err);
    return res.status(500).json({ error: "Server error Activity Feed" });
  }
});

// NOTE: server listen is started after successful DB connection above
