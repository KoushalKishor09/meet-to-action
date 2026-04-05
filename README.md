# 🤖 AI Meet-to-Action Application

A powerful AI-driven application that transforms meeting conversations into actionable tasks. Automatically extract action items, assign responsibilities, set deadlines, and manage tasks—all from audio recordings or text transcripts.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Supported Audio Formats](#supported-audio-formats)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [FFmpeg Setup](#ffmpeg-setup)
- [Usage](#usage)
- [Testing AAC Support](#testing-aac-support)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Reminders & Alerts](#reminders--alerts)
- [Output Format](#output-format)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)

## 🎯 Overview

**AI Meet-to-Action** revolutionizes meeting productivity by automating task extraction and management. Instead of manually transcribing meetings and creating task lists, our application:

✅ Converts speech to text automatically  
✅ Intelligently extracts action items and deadlines  
✅ Assigns responsibility to team members  
✅ Generates an interactive task dashboard  
✅ Sends automated reminders  
✅ Exports structured data in JSON format  

Perfect for teams that want to maximize meeting efficiency and ensure nothing falls through the cracks.

## ✨ Features

### 1. **Speech-to-Text Conversion**
   - Accepts audio recordings in **multiple formats**: MP3, M4A, AAC, OGG, WAV, FLAC, WebM, WMA
   - Supports plain-text transcript uploads
   - **Model**: OpenAI Whisper (via Groq) for accurate speech recognition

### 2. **Intelligent Task Extraction**
   - Automatically identifies action items from transcripts
   - Extracts key information:
     - 📝 Action items and descriptions
     - 👤 Responsible person/assignee
     - 📅 Deadlines and due dates
   - **Model**: LLaMA 3 via Grok/Google Gemini (via Google AI Studio)

### 3. **Interactive Task Dashboard**
   - Beautiful, user-friendly interface built with React
   - View all tasks in:
     - 📊 Table format for detailed overview
     - 🎴 Card format for quick scanning
   - Manually update task status with one click
   - Real-time task management

### 4. **Automated Reminders & Alerts**
   - Smart scheduling system to notify team members
   - Customizable reminder intervals
   - **Technology**: Python APScheduler Library
   - Alert notifications before deadlines

### 5. **Structured Data Export**
   - Automatic JSON output for task data
   - Combine AI extraction + rule-based tracking
   - Easy integration with other tools and workflows
   - Backup and audit trail capabilities

## 🎵 Supported Audio Formats

The application accepts the following audio formats for upload and transcription:

| Format | Extension(s) | MIME Type | Notes |
|--------|-------------|-----------|-------|
| MP3 | `.mp3` | `audio/mpeg` | Standard lossy compression |
| M4A / M4B | `.m4a`, `.m4b` | `audio/mp4`, `audio/x-m4a` | Apple's AAC container |
| **AAC** | `.aac` | `audio/aac` | Advanced Audio Coding |
| OGG | `.ogg`, `.oga` | `audio/ogg` | Open-source container |
| WAV | `.wav` | `audio/wav`, `audio/x-wav` | Lossless, large files |
| FLAC | `.flac` | `audio/flac` | Lossless compression |
| WebM | `.webm` | `audio/webm` | Web streaming format |
| WMA | `.wma` | `audio/x-ms-wma` | Windows Media Audio |

> **Maximum file size:** 50 MB  
> **Recommended format for AAC:** Use `.m4a` (AAC in an MPEG-4 container) for best compatibility across all operating systems.

---

## 🛠 Tech Stack

### Backend
- **Language**: Python
- **Speech-to-Text**: OpenAI Whisper
- **LLM Models**: 
  - LLaMA 3 (via Grok)
  - Google Gemini (via Google AI Studio)
- **Task Scheduling**: APScheduler
- **API Framework**: [Flask/FastAPI - specify as needed]

### Frontend
- **Framework**: React
- **State Management**: [Redux/Context API - specify as needed]
- **UI Library**: [Material-UI/Tailwind CSS - specify as needed]
- **Styling**: [CSS-in-JS/CSS Modules - specify as needed]

### Data & Storage
- **Format**: JSON
- **Database**: [MongoDB/PostgreSQL - specify as needed]

## 🔄 How It Works

```
┌─────────────────┐
│   Input Stage   │
├─────────────────┤
│ • Audio Files   │
│ • Transcripts   │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│ Speech-to-Text (Whisper) │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ LLM Extraction (LLaMA 3)      │
├──────────────────────────────┤
│ Extract:                     │
│ • Action Items               │
│ • Assignees                  │
│ • Deadlines                  │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────┐
│   Task Dashboard (React) │
├──────────────────────────┤
│ • Display Tasks           │
│ • Manage Status          │
│ • Track Progress         │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ APScheduler (Reminders)      │
├──────────────────────────────┤
│ • Send Notifications         │
│ • Track Deadlines           │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────┐
│ JSON Export & Storage    │
└──────────────────────────┘
```

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 14+ and npm
- **FFmpeg** (required for AAC/M4A/OGG audio processing — see [FFmpeg Setup](#ffmpeg-setup))
- API Keys:
  - Groq API key (for Whisper transcription and LLaMA 3)
  - MongoDB connection string (for task storage)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/meet-to-action.git
   cd meet-to-action
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install / update backend dependencies**
   ```bash
   cd backend
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

   > 💡 If you are adding FFmpeg-based local audio conversion (optional), also install `pydub`:
   > ```bash
   > pip install pydub
   > ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

   The minimum required keys are:
   ```env
   GROQ_API_KEY=your_groq_api_key
   MONGO_URI=your_mongodb_connection_string
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

## 🎬 FFmpeg Setup

FFmpeg is required by the Groq Whisper service and by many audio-processing libraries to decode AAC, M4A, OGG, FLAC, and WebM files. Follow the steps for your operating system.

---

### 🪟 Windows

**Option A — winget (Windows 10/11, recommended)**

1. Open **PowerShell** or **Command Prompt** as Administrator.
2. Run:
   ```powershell
   winget install --id=Gyan.FFmpeg -e
   ```
3. Close and reopen your terminal so the `PATH` updates, then verify:
   ```powershell
   ffmpeg -version
   ```

**Option B — Manual install**

1. Download the latest FFmpeg Windows build from [https://www.gyan.dev/ffmpeg/builds/](https://www.gyan.dev/ffmpeg/builds/) (choose `ffmpeg-release-essentials.zip`).
2. Extract the zip to a permanent location, e.g. `C:\ffmpeg`.
3. Add `C:\ffmpeg\bin` to your **System PATH**:
   - Search for **"Edit the system environment variables"** in the Start menu.
   - Click **Environment Variables → Path → Edit → New** and paste `C:\ffmpeg\bin`.
   - Click **OK** on all dialogs.
4. Open a **new** terminal and verify:
   ```powershell
   ffmpeg -version
   ```

---

### 🍎 macOS

**Option A — Homebrew (recommended)**

1. Install Homebrew if you don't have it:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. Install FFmpeg:
   ```bash
   brew install ffmpeg
   ```
3. Verify:
   ```bash
   ffmpeg -version
   ```

**Option B — MacPorts**

```bash
sudo port install ffmpeg
ffmpeg -version
```

---

### 🐧 Linux

**Ubuntu / Debian:**
```bash
sudo apt update
sudo apt install ffmpeg -y
ffmpeg -version
```

**Fedora / RHEL / CentOS (with RPM Fusion):**
```bash
sudo dnf install https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm -y
sudo dnf install ffmpeg -y
ffmpeg -version
```

**Arch Linux:**
```bash
sudo pacman -S ffmpeg
ffmpeg -version
```

---

### ✅ Verify AAC Codec Support

After installing FFmpeg, confirm AAC encoding/decoding is available:

```bash
ffmpeg -codecs 2>/dev/null | grep aac
```

You should see output similar to:
```
 DEA.L. aac                  AAC (Advanced Audio Coding) (decoders: aac aac_fixed )
 DEA.L. aac_latm             MPEG-4 Audio LATM syntax
```

The `D` flag confirms **decoding** is supported; `E` confirms **encoding**. Both should be present.

If the `aac` line is missing, reinstall FFmpeg with the `--enable-libfdk-aac` option (advanced; see the [FFmpeg compilation guide](https://trac.ffmpeg.org/wiki/CompilationGuide)).

---

## 🚀 Usage

### Running the Application

1. **Start Backend Server**
   ```bash
   cd backend
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   uvicorn main:app --reload
   ```

2. **Start Frontend (in another terminal)**
   ```bash
   cd frontend
   npm start
   ```

3. **Access the Application**
   - Open your browser and navigate to `http://localhost:3000`

### Upload a Meeting

1. Click the **🎙️ Audio Upload** tab (or **📝 Text Input** for transcripts)
2. For audio:
   - Drag and drop your file onto the drop zone, **or** click it to browse
   - Supported formats: MP3, M4A, AAC, OGG, WAV, FLAC, WebM, WMA (max 50 MB)
3. Click **Extract Tasks** and wait for transcription + AI extraction
4. Review the generated summary and task table

### Managing Tasks

- **View**: Switch between Table and Tiles view using the toggle button
- **Status Update**: Click a status badge to toggle between **Pending** and **Done**
- **Export**: Click **⬇️ Export** to download as **JSON** or **PDF**

## 🧪 Testing AAC Support

Follow these steps to verify that AAC and M4A audio files are processed correctly end-to-end.

### Step 1 — Confirm FFmpeg is installed

```bash
ffmpeg -version
```

Expected: A version string starting with `ffmpeg version …`. If you see `command not found`, complete the [FFmpeg Setup](#ffmpeg-setup) steps first.

### Step 2 — Verify AAC codec is available

```bash
ffmpeg -codecs 2>/dev/null | grep -i aac
```

Expected output contains a line like:
```
 DEA.L. aac    AAC (Advanced Audio Coding) (decoders: aac aac_fixed )
```

### Step 3 — Create a test AAC file (if you don't have one)

If you have an existing MP3 or WAV file, convert it to AAC using FFmpeg:

```bash
# Convert MP3 → AAC (.aac)
ffmpeg -i input.mp3 -c:a aac -b:a 128k test_meeting.aac

# Convert MP3 → M4A (AAC inside MPEG-4 container, recommended)
ffmpeg -i input.mp3 -c:a aac -b:a 128k test_meeting.m4a
```

> 💡 You can also record a short voice memo on your phone and save it as `.m4a` or `.aac`.

### Step 4 — Start the application

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate   # On Windows: venv\Scripts\activate
uvicorn main:app --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
```

### Step 5 — Upload and test the AAC file

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Click the **🎙️ Audio Upload** tab.
3. Drag your `test_meeting.aac` or `test_meeting.m4a` file onto the drop zone (or click to browse).
4. Click **Extract Tasks**.
5. ✅ **Pass:** The app shows a meeting summary and an extracted task table.
6. ❌ **Fail:** An error banner appears — check the backend terminal for the full error message.

### Step 6 — Check the backend logs

With the backend running, the terminal should print:
```
📁 Received file: test_meeting.aac, size: 123.4 KB, MIME: audio/aac
```

If you see a `415 Unsupported Media Type` error, ensure:
- The file extension is one of: `.mp3 .m4a .m4b .aac .ogg .oga .wav .flac .webm .wma`
- The MIME type reported by your OS matches a supported type (e.g. `audio/aac`, `audio/mp4`)

### Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `ffmpeg: command not found` | FFmpeg not installed | Follow [FFmpeg Setup](#ffmpeg-setup) |
| `415 Unsupported Media Type` | Unrecognised MIME type | Rename file with correct extension (e.g. `.m4a`) |
| `Failed to transcribe audio` | Groq API key missing / invalid | Check `GROQ_API_KEY` in `.env` |
| `File too large` | File exceeds 50 MB | Compress with FFmpeg: `ffmpeg -i input.aac -b:a 64k output.aac` |
| Blank task list | Audio contains no speech | Use a file with clear human speech |

## 📁 Project Structure

```
meet-to-action/
├── backend/
│   ├── main.py             # FastAPI application (endpoints, audio validation)
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Environment variables (GROQ_API_KEY, MONGO_URI)
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js          # Main React component (audio upload, task table)
│   │   ├── App.css         # Styles
│   │   ├── App.test.js     # Unit tests (format validation, UI)
│   │   └── index.js
│   └── package.json
│
└── README.md
```

## ⚙️ Configuration

### Environment Variables (.env)

Create a `.env` file inside the `backend/` directory with the following keys:

```env
# Groq API (Whisper transcription + LLaMA 3 task extraction)
GROQ_API_KEY=your_groq_api_key_here

# MongoDB Atlas connection string
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/meettask?retryWrites=true&w=majority
```

> 🔑 Get your **Groq API key** at [https://console.groq.com](https://console.groq.com)  
> 🍃 Get your **MongoDB URI** at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

## 🔔 Reminders & Alerts

The application uses **APScheduler** to manage automated reminders:

- **Task Due Soon**: Notification 24 hours before deadline
- **Overdue Tasks**: Alert for tasks past their due date
- **Task Assigned**: Notification when assigned a new task
- **Status Update**: Optional notification on task status changes

Configure reminder intervals in the settings panel or modify `scheduler.py`.

## 📤 Output Format

Tasks are exported in the following JSON structure:

```json
{
  "meeting_id": "meeting_001",
  "meeting_date": "2024-04-04",
  "transcript": "...",
  "tasks": [
    {
      "task_id": "task_001",
      "title": "Prepare Q2 Report",
      "description": "Complete financial analysis for Q2",
      "assignee": "John Doe",
      "due_date": "2024-04-15",
      "priority": "high",
      "status": "pending",
      "created_at": "2024-04-04T10:00:00Z",
      "updated_at": "2024-04-04T10:00:00Z"
    }
  ]
}
```

## 🚧 Future Enhancements

- [ ] Multi-language support for speech recognition
- [ ] Integration with calendar apps (Google Calendar, Outlook)
- [ ] Team collaboration features (comments, mentions)
- [ ] Advanced analytics and reporting
- [ ] Mobile app (iOS/Android)
- [ ] Custom reminder channels (Slack, Teams, Email)
- [ ] Recurring task templates
- [ ] AI-powered priority suggestions
- [ ] Meeting summary generation

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure your code follows the project's style guidelines and includes appropriate tests.


**Questions or Issues?** Please open an issue on GitHub or contact the development team.

**Made with ❤️ at Hackatron 3.0**
