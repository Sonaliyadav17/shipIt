# 🚀 ShipIt

> Build Faster. Fund Smarter. Ship Together.

ShipIt is an execution intelligence platform that transforms raw ideas into structured project plans, enables real-time execution tracking, and connects builders with investors — all in one unified workflow.

---

## 🌟 Problem

Ideas often remain stuck in notes.

- No structured planning  
- Tasks get stuck unnoticed  
- Teams use multiple disconnected tools  
- Execution progress is unclear  
- No reliable proof of execution for investors  

ShipIt reduces friction between:

Thinking → Planning → Execution → Funding

---

## 💡 Solution

ShipIt provides:

- 🧠 AI-powered idea → project plan generator  
- 📋 Structured task management  
- 📊 Real-time execution analytics  
- 🔨 Builder execution profiles  
- 🏪 Live investor marketplace  
- ⚖ Built-in digital NOC agreement system  

All in one platform.

---

## 🧠 Key Features

### 1️⃣ AI Plan & Pitch Generator
Write a raw idea in Thinking Space and get:
- Project roadmap
- Milestones
- Task breakdown
- Timeline
- Business pitch
- Risk analysis

Powered by Groq API (Llama 3.1).

---

### 2️⃣ Smart Execution Monitoring
- Detect stuck tasks
- Track execution progress
- Consistency streak analytics
- Project health indicators

---

### 3️⃣ Builder Workflow
Raw Idea → AI Plan → Task Execution → Analytics → Go Live

---

### 4️⃣ Investor Marketplace
- Discover live projects
- Filter by domain & stage
- View AI-generated business pitch
- Express investment interest

---

### 5️⃣ Digital NOC Agreement System
- Auto-generated legal agreement
- Digital signatures
- PDF download
- Immutable agreement storage

---

## 🛠 Tech Stack

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express.js
- JWT Authentication
- Firebase Google Auth

### Database
- MongoDB Atlas
- Mongoose ODM

### AI & Real-Time
- Groq API (Llama 3.1)
- Socket.io (WebSockets)

### Services
- Nodemailer (Gmail SMTP)
- jsPDF (Agreement generation)

---

## 🗂 Database Collections

- users
- projects
- tasks
- thinkingNotes
- investments
- agreements
- notifications

---

## 🔄 Builder Workflow

1. Write raw idea in Thinking Space
2. Generate AI plan & business pitch
3. Execute tasks & track progress
4. Toggle investment ON
5. Accept investor interest
6. Auto-generate and sign NOC
7. Download final agreement

---

## 🔐 Authentication

- Secure login & signup
- Google OAuth integration
- JWT-based protected routes

---

## ⚡ Real-Time Features

- Live marketplace updates via WebSockets
- Instant notifications
- Execution status sync

---

## 🚀 Getting Started (Local Setup)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/shipit.git
cd shipit
