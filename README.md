# 🤖 AI Meet-to-Action Application

A powerful AI-driven application that transforms meeting conversations into actionable tasks. Automatically extract action items, assign responsibilities, set deadlines, and manage tasks—all from audio recordings or text transcripts.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [Usage](#usage)
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
   - Accepts audio recordings in multiple formats
   - Supports plain-text transcript uploads
   - **Model**: OpenAI Whisper for accurate speech recognition

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
- API Keys:
  - OpenAI API (for Whisper)
  - Google AI Studio API (for Gemini)
  - Grok API (for LLaMA 3)

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

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
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

## 🚀 Usage

### Running the Application

1. **Start Backend Server**
   ```bash
   python app.py
   ```

2. **Start Frontend (in another terminal)**
   ```bash
   cd frontend
   npm start
   ```

3. **Access the Application**
   - Open your browser and navigate to `http://localhost:3000`

### Upload a Meeting

1. Click the **"Upload Meeting"** button
2. Choose one of:
   - **Record Audio**: Record directly in the app
   - **Upload Audio File**: Select an audio file (MP3, WAV, M4A)
   - **Paste Transcript**: Paste text directly
3. Click **"Process"** and wait for results
4. Review and manage extracted tasks

### Managing Tasks

- **View**: All tasks display in the dashboard
- **Edit**: Click on any task to modify details
- **Status Update**: Change task status (To-Do → In Progress → Completed)
- **Delete**: Remove tasks no longer needed
- **Export**: Download tasks as JSON

## 📁 Project Structure

```
meet-to-action/
├── backend/
│   ├── app.py              # Main Flask/FastAPI app
│   ├── requirements.txt    # Python dependencies
│   ├── config.py           # Configuration
│   ├── .env.example        # Environment variables template
│   ├── modules/
│   │   ├── speech_to_text.py    # Whisper integration
│   │   ├── task_extraction.py   # LLM extraction logic
│   │   ├── scheduler.py         # APScheduler setup
│   │   └── task_manager.py      # Task CRUD operations
│   └── routes/
│       ├── upload.py       # File upload endpoints
│       ├── tasks.py        # Task management endpoints
│       └── reminders.py    # Reminder endpoints
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TaskForm.jsx
│   │   │   ├── TaskList.jsx
│   │   │   └── UploadMeeting.jsx
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
│
├── data/
│   └── tasks.json          # Output tasks
│
├── README.md
├── .gitignore
└── .env.example
```

## ⚙️ Configuration

### Environment Variables (.env)

```env
# OpenAI Configuration
OPENAI_API_KEY= openai_api_key

# Google AI Configuration
GOOGLE_AI_API_KEY=google_ai_key
GOOGLE_AI_MODEL=gemini-pro  # or your preferred model

# Grok Configuration
GROK_API_KEY=grok_api_key

# Application Configuration
DEBUG=True
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration (if using)
DATABASE_URL=your_database_url

# Email Configuration (for reminders)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

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
