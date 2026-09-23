# Smart Study Generator Agent

An **AI-powered personalized study companion** that helps students organize learning resources, generate study materials, prepare for exams, identify weak areas, and adapt their study plan using **IBM Granite** as the primary LLM.

---

## Architecture

```
smart-study-agent/
├── backend/           # Node.js + Express API server
│   ├── src/
│   │   ├── agents/    # Agentic components
│   │   │   ├── resourceAgent.js      – text extraction + chunking
│   │   │   ├── studyMaterialAgent.js – summaries, notes, flashcards, MCQs
│   │   │   ├── studyPlannerAgent.js  – personalized schedule generation
│   │   │   ├── quizAgent.js          – quiz generation & evaluation
│   │   │   └── progressAgent.js      – analytics & recommendations
│   │   ├── routes/    # REST API endpoints
│   │   ├── utils/
│   │   │   ├── granite.js            – IBM Granite / watsonx.ai client
│   │   │   └── textProcessing.js     – PDF, OCR, chunking, RAG retrieval
│   │   ├── database.js               – SQLite schema & init
│   │   └── server.js                 – Express app
│   └── uploads/       # Uploaded files stored here
├── frontend/          # React 18 SPA
│   └── src/
│       ├── pages/     # 12 application pages
│       ├── components/
│       ├── context/
│       └── api/
└── data/              # SQLite database (auto-created)
```

---

## Prerequisites

- **Node.js** v18 or later
- **IBM Cloud account** with watsonx.ai access
- A watsonx.ai **Project ID**
- An **IBM Cloud API Key** with watsonx.ai permissions

---

## Quick Start

### 1. Clone / navigate

```bash
cd smart-study-agent
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
WATSONX_API_KEY=your_ibm_cloud_api_key
WATSONX_PROJECT_ID=your_watsonx_project_id
WATSONX_URL=https://us-south.ml.cloud.ibm.com
GRANITE_TEXT_MODEL=ibm/granite-13b-instruct-v2
PORT=5000
FRONTEND_URL=http://localhost:3000
```

> **Find your credentials:**
> - API Key: IBM Cloud → Manage → Access → API Keys
> - Project ID: watsonx.ai → Projects → your project → Manage → General → Project ID

### 3. Install & Start Backend

```bash
cd backend
npm install
npm start
```

Backend will run on http://localhost:5000

### 4. Configure & Start Frontend

```bash
cd frontend
cp .env.example .env   # already set to http://localhost:5000/api
npm install
npm run dev
```

Frontend will run on http://localhost:3000

> The frontend uses **Vite** for fast development. Use `npm run build` to create a production build.

---

## Supported File Uploads

| Type | Extension | Processing |
|------|-----------|------------|
| PDF Documents | `.pdf` | PDF text extraction |
| Images | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` | OCR via Tesseract.js |
| Text files | `.txt`, `.md` | Direct text read |

Max file size: **20 MB**

---

## Core Features

| Feature | Description |
|---------|-------------|
| **Student Profile** | Name, course, branch, semester, study hours, exam date |
| **Subjects & Topics** | Manage subjects with color coding, topics with completion tracking |
| **Resource Library** | Upload and organize PDFs, images, text files |
| **AI Study Material** | Summaries, detailed notes, key points, flashcards, MCQs, short-answers, important questions |
| **AI Tutor (RAG)** | Ask questions; answers grounded in your uploaded documents |
| **Study Planner** | AI-generated personalized schedule with session logging |
| **Quiz System** | Generate MCQs, answer interactively, score, explain wrong answers |
| **Flashcards** | AI-generated or manual; study mode with difficulty rating |
| **Progress Dashboard** | Charts for quiz scores, topic completion, study hours |
| **Recommendations** | AI-powered analysis of weak areas and actionable advice |

---

## Agentic Architecture

```
User Input / Uploaded Resources
         ↓
┌─────────────────────────────────┐
│     Resource Processing Agent   │  PDF/OCR → text extraction → chunks
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│     Study Material Agent        │  Summaries, notes, flashcards, MCQs
│     (IBM Granite)               │
└──────────────┬──────────────────┘
               ↓
┌───────────────────────────────────────────────────────┐
│   Study Planner Agent  │  Quiz Agent  │  Tutor (RAG)  │
│   (IBM Granite)        │  (Granite)   │  (Granite)    │
└───────────────────────────────────────────────────────┘
               ↓
┌─────────────────────────────────┐
│   Progress & Recommendation     │  Analytics + AI advice
│   Agent (IBM Granite)           │
└─────────────────────────────────┘
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PUT | `/api/profile` | Student profile |
| GET/POST/PUT/DELETE | `/api/subjects` | Subjects + topics |
| GET/POST/DELETE | `/api/resources` | Resource library |
| POST | `/api/resources/upload` | Upload file |
| POST | `/api/study-material/generate` | Generate AI material |
| POST | `/api/tutor/ask` | RAG-based Q&A |
| POST | `/api/quiz/generate` | Generate quiz |
| POST | `/api/quiz/answer` | Submit answer |
| GET | `/api/flashcards` | List flashcards |
| POST | `/api/flashcards/generate` | AI flashcards |
| POST | `/api/planner/generate` | Generate study plan |
| GET | `/api/progress` | Dashboard data |
| GET | `/api/progress/recommendations` | AI recommendations |
| GET | `/api/health` | Server + Granite status |

---

## Sample User Flow

1. Open http://localhost:3000
2. Go to **Profile** → create your student profile
3. Go to **Subjects** → add subjects and topics
4. Go to **Upload Resource** → upload a PDF or image of notes
5. Go to **Study Material** → generate a summary or flashcards
6. Go to **Quiz** → take a subject quiz
7. Go to **AI Tutor** → ask questions about your uploaded notes
8. Go to **Study Planner** → generate your study schedule
9. Go to **Recommendations** → get AI advice on weak areas
10. Go to **Progress** → view charts and analytics

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WATSONX_API_KEY` | ✅ | — | IBM Cloud API key |
| `WATSONX_PROJECT_ID` | ✅ | — | watsonx.ai project ID |
| `WATSONX_URL` | — | `https://us-south.ml.cloud.ibm.com` | watsonx.ai endpoint |
| `GRANITE_TEXT_MODEL` | — | `ibm/granite-13b-instruct-v2` | Granite model ID |
| `PORT` | — | `5000` | Backend port |
| `FRONTEND_URL` | — | `http://localhost:3000` | CORS allowed origin |
| `MAX_FILE_SIZE_MB` | — | `20` | Max upload size |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | `http://localhost:5000/api` | Backend API URL |

---

## Security Notes

- API keys are stored in backend `.env` only — never exposed to the frontend
- File uploads are validated by type and size
- Uploaded files are served as static files, not executed
- User inputs are validated on both frontend and backend

---

## Troubleshooting

**"IBM Granite not configured" warning**
→ Set `WATSONX_API_KEY` and `WATSONX_PROJECT_ID` in `backend/.env`

**AI features return 503**
→ Check your API key is valid and has watsonx.ai permissions

**Upload fails**
→ Check `backend/uploads/` directory exists (auto-created) and is writable

**OCR is slow**
→ Tesseract.js downloads language data on first use; subsequent calls are faster

**SQLite errors**
→ Ensure `data/` directory is writable; the database is auto-created

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI/LLM | IBM Granite via watsonx.ai |
| Backend | Node.js, Express.js |
| Database | SQLite (sql.js — pure WASM, no native build required) |
| PDF Processing | pdf-parse |
| OCR | Tesseract.js |
| Frontend | React 18, Vite, React Router v6 |
| Charts | Recharts |
| HTTP Client | Axios |
