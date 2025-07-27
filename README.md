# AI-Powered Git Activity Monitor

Real-time GitHub incident detection and AI-powered summarization system that continuously monitors GitHub's Global Events API for suspicious patterns and streams intelligent summaries to a live dashboard.

## Features

- **Real-time Monitoring**: Continuous polling of GitHub's Global Events API
- **Intelligent Detection**: AI-powered identification of suspicious patterns including:
  - Failed workflow runs
  - Force pushes to main/master branches
  - Bursty issue creation
  - Repository deletions
  - Security advisories
  - And more...
- **AI Summarization**: Powered by Google Gemini API for detailed incident analysis
- **Live Dashboard**: React-based UI with real-time updates via Server-Sent Events
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop and mobile devices
- **Rate Limit Handling**: Intelligent exponential backoff for API reliability

## Tech Stack

### Backend
- **Node.js** with Express
- **SQLite** for data persistence
- **Google Gemini API** for AI summarization
- **Server-Sent Events** for real-time updates

### Frontend
- **React 18** with hooks
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Lucide React** for icons

## Quick Start

### Prerequisites ⚠️ Required

1. **GitHub Personal Access Token** (REQUIRED):
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Generate a token with `public_repo` scope
   - **Without**: 60 requests/hour | **With**: 5,000 requests/hour

2. **Google Gemini API Key** (REQUIRED):
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key (free tier: 15 requests/minute)
   - **Required** for AI-powered incident summarization

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd ai-powered-git-activity-monitor
npm run install:all
```

2. **Configure API keys:**

Edit `.secrets` file with your API keys:
```bash
# GitHub API Configuration (REQUIRED)
GITHUB_TOKEN=your_github_personal_access_token

# Google Gemini AI API (REQUIRED)  
GEMINI_API_KEY=your_google_gemini_api_key

# Server Configuration
PORT=3000
NODE_ENV=production
```

3. **Build and start:**
```bash
npm run build
npm start
```

4. **Development mode:**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the live dashboard.

**Note:** The application automatically loads environment variables from the `.secrets` file on startup.

### ⚠️ What happens without API keys?

**Without GitHub Token:**
- Only 60 API requests/hour (vs 5,000 with token)
- System will hit rate limits quickly
- Limited real-time functionality

**Without Gemini API Key:**
- Falls back to hardcoded summaries
- No real AI analysis
- Core functionality severely limited

## API Endpoints

- `GET /api/summary?since=TIMESTAMP` - Fetch incident summaries
- `GET /api/stream` - Server-Sent Events stream for real-time updates
- `GET /api/health` - System health check

## Deployment

### Any Platform (Render, Railway, Fly.io, etc.)

1. **Push to GitHub** 
2. **Connect repository** to your platform
3. **Configure build:**
   - Build command: `npm run build`
   - Start command: `npm start`
4. **Add environment variables:**
   - `GITHUB_TOKEN=your_github_token`
   - `GEMINI_API_KEY=your_gemini_key`
   - `NODE_ENV=production`

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub API    │───▶│   Node.js API   │───▶│   React UI      │
│   (Events)      │    │   + SQLite      │    │   (Dashboard)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                               ▼
                       ┌─────────────────┐
                       │   Gemini AI     │
                       │   (Summary)     │
                       └─────────────────┘
```

## Rate Limits

- **GitHub API**: 5,000 requests/hour (with token)
- **Gemini API**: 15 requests/minute (free tier)
- **Polling Frequency**: Every 10 seconds

## Security Features

- Helmet.js for security headers
- Input validation and sanitization
- No logging of sensitive data
- CORS configuration
- Compression for performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with clean, minimal code
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## AI Services Used

- **Google Gemini API** - For intelligent incident summarization and analysis

---

Built with ❤️ for real-time GitHub security monitoring 