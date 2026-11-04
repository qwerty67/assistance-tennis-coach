# 🎾 Tennis AI Coach

<div align="center">

![Tennis AI Coach](https://img.shields.io/badge/Version-1.0.0-blue)
![React Native](https://img.shields.io/badge/React_Native-Expo-61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688)
![License](https://img.shields.io/badge/License-MIT-green)

**An AI-powered tennis coaching assistant that helps coaches analyze matches and track student performance in real-time.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Usage](#-usage) • [Documentation](#-documentation)

</div>

---

## 📋 Overview

Tennis AI Coach is a mobile application designed for tennis coaches to:
- 📊 Track student performance over time
- 🎾 Record live matches point-by-point
- 🤖 Get AI-powered analysis and training recommendations
- 📈 Analyze strengths and weaknesses
- 🏆 Monitor win rates and progress

## ✨ Features

### For Coaches
- **Student Management** - Add, edit, and track multiple students
- **Live Match Recording** - Record points in real-time during matches
- **Automatic Scoring** - Tennis scoring system (15-30-40-Deuce-Ad)
- **Match History** - Complete history of all matches
- **Statistics Dashboard** - Win rates, serve percentages, and more

### AI-Powered Analysis
- **Performance Insights** - Identify strengths and weaknesses
- **Training Recommendations** - Personalized drills and exercises
- **Match Strategy** - Tactical suggestions for future matches
- **Progress Tracking** - Monitor improvement over time

### Modern UI/UX
- **iOS-Inspired Design** - Clean, minimal, and intuitive
- **Fast & Responsive** - Smooth animations and transitions
- **Offline-First** - Works without internet (data syncs later)
- **Dark Mode** - Easy on the eyes (coming soon)

## 🛠️ Tech Stack

### Frontend (Mobile App)
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation
- **UI Components**: React Native Paper
- **Icons**: Material Community Icons
- **State Management**: React Context API
- **HTTP Client**: Axios

### Backend (API Server)
- **Framework**: FastAPI (Python)
- **Database**: SQLite
- **ORM**: SQLAlchemy
- **Validation**: Pydantic
- **AI Integration**: Google Gemini API

### Architecture
- **Layered Architecture**: UI → Engine → Service → API → Database
- **Single Source of Truth**: Business logic in engines
- **Type-Safe**: Full TypeScript support

## 📦 Installation

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your Gemini API key

# Run the server
uvicorn app.main:app --reload

Backend will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs
Frontend Setup
bash
1
Scan the QR code with Expo Go app on your phone, or press:
a for Android emulator
i for iOS simulator
🚀 Usage
1. Create a Student
Go to Students tab
Tap the + button
Enter student details
2. Create a Match
Go to Dashboard tab
Tap the + button
Select student and enter match details
3. Record Live Match
Tap on a match
Tap "Continue Recording"
Record points:
Serve (Ace/Let/Fault/In)
Return (Error/In)
Final Stroke (Player/Type/Direction/Result)
4. Get AI Analysis
Complete a match
Tap "Analyze Match"
View AI-powered insights
📚 Documentation
Complete documentation is available in the docs/ folder:
01-architecture.md - System architecture
02-database-schema.md - Database structure
03-game-logic.md - Tennis game logic
04-api-endpoints.md - API documentation
05-ui-design.md - UI/UX design guidelines
06-development-guide.md - Development setup
09-design-system.md - Design system
🏗️ Project Structure

TennisPilot/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── models/            # Database models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── routers/           # API endpoints
│   │   ├── services/          # Business logic
│   │   └── utils/             # Helpers
│   ├── requirements.txt
│   └── .env
│
├── frontend/                   # React Native app
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── screens/           # Screen components
│   │   ├── services/          # API calls
│   │   ├── context/           # React Context
│   │   ├── theme/             # Design system
│   │   ├── utils/             # Engines & helpers
│   │   └── types/             # TypeScript types
│   ├── App.tsx
│   └── package.json
│
├── docs/                       # Documentation
└── README.md

🎯 Key Features Explained
Point Recording Engine
The app uses a sophisticated state machine to manage point recording:
typescript
1234
Scoring Engine
Automatic tennis scoring with all rules:
typescript
123
AI Integration
Powered by Google Gemini for intelligent analysis:
python
12
🔒 Security
API keys stored in .env (never committed)
Input validation on all endpoints
SQL injection prevention (SQLAlchemy ORM)
CORS configured for production
🤝 Contributing
Contributions are welcome! Please follow these steps:
Fork the repository
Create a feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request
📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
🙏 Acknowledgments
OffCourtz - Inspiration for tennis-specific UI
Dribbble - Design inspiration
Google Gemini - AI analysis
React Native Community - Amazing framework
📧 Contact
For questions or feedback:
Email: your-email@example.com
GitHub: @your-username
🗺️ Roadmap
Dark mode support
Video integration
Cloud sync
Multi-user support
Advanced statistics
Training mode
Wearable integration
<div align="center">

Made with ❤️ for tennis coaches
⭐ Star this repo if you find it useful!
</div>